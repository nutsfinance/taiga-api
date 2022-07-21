import { Injectable } from "@nestjs/common";
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { keyring as Keyring } from '@polkadot/ui-keyring';
import { ethers } from 'ethers';
import { abi } from './abi';
import BN from "bignumber.js";
import fetch from 'axios';
import * as _ from "lodash";
import { TokenService } from "src/token/token.service";

const REWARD_DISTRIBUTORS = {
  "mandala": [
    "0x90005382C1951eFDc027DFF09a7C9d1a1E5060EF",
    "0x53CFdfD2C7387EB9409B8Fe63Eb99D2081718a12",
    "0x1eB47C01cfAb26D2346B449975b7BF20a34e0d45"
  ],
  "karura": [
    "0xf595F4a81B27E5CC1Daca349A69c834f375224F4",
    "0xff066331be693BE721994CF19905b2DC7475C5c9"
  ],
  "acala": [
    "0x219FA396aE50f789b0cE5e27D6EcbE6b36ef49d9"
  ]
};

const SUBQUERY_SERVERS = {
  "karura": "https://api.subquery.network/sq/nutsfinance/taiga-protocol",
  "acala": "https://api.subquery.network/sq/nutsfinance/tapio-protocol"
}

interface PoolDailyData {
  yieldVolume: number,
  feeVolume: number,
  totalSupply: number,
  timestamp: string
}

@Injectable()
export class RewardService {
  private providers: { [network: string]: Provider} = {};
  private rewardMerkles: {[key: string]: any} = {};

  constructor(private tokenService: TokenService) {
    this.providers["mandala"] = new Provider({
      provider: new WsProvider("wss://mandala-tc7-rpcnode.aca-dev.network/ws") 
    });
    this.providers["karura"] = new Provider({
      provider: new WsProvider("wss://karura-rpc-2.aca-api.network/ws") 
    });
    this.providers["acala"] = new Provider({
      provider: new WsProvider("wss://acala-rpc-0.aca-api.network/ws") 
    });
  }

  async getCurrentCycle(network: string, pool: number): Promise<number> {
    await this.providers[network].api.isReady;
    const contract = new ethers.Contract(REWARD_DISTRIBUTORS[network][pool], abi, this.providers[network]);
    return (await contract.currentCycle()).toNumber();
  }

  async getCurrentRoot(network: string, pool: number): Promise<string> {
    await this.providers[network].api.isReady;
    const contract = new ethers.Contract(REWARD_DISTRIBUTORS[network][pool], abi, this.providers[network]);
    return await contract.merkleRoot();
  }

  async getUserReward(user: string, network: string, pool: number) {
    await this.providers[network].api.isReady;
    const cycle = await this.getCurrentCycle(network, pool);
    const rewardKey = `rewards_${network}_${pool}_${cycle}`;
    let rewardJson = this.rewardMerkles[rewardKey];

    if (!rewardJson) {
      try {
        const response = await fetch(`http://reward-merkle-json.s3-website-ap-southeast-1.amazonaws.com/${rewardKey}.json`);
        rewardJson = response.data;
        this.rewardMerkles[rewardKey] = rewardJson;
      } catch (error) {
        console.error(error)
        return {};
      }
    }

    const contract = new ethers.Contract(REWARD_DISTRIBUTORS[network][pool], abi, this.providers[network]);
    const addressKey = Keyring.encodeAddress(user, 42);
    if (!rewardJson.claims[addressKey])  return {};

    const [tokens, amounts] = await contract.getClaimableFor(
        Keyring.decodeAddress(user),
        rewardJson.claims[addressKey].tokens,
        rewardJson.claims[addressKey].cumulativeAmounts
    );

    return {
        tokens,
        cumulative: rewardJson.claims[addressKey].cumulativeAmounts,
        claimable: amounts.map(amount => amount.toString()),
        index: rewardJson.claims[addressKey].index,
        cycle: rewardJson.cycle,
        proof: rewardJson.claims[addressKey].proof
    };
  }

  async getPoolAPR(network: string, poolId: number): Promise<number> {
    const query = `${SUBQUERY_SERVERS[network]}?`
    + `query={dailyData(first:30, orderBy: TIMESTAMP_DESC, filter: {poolId: {equalTo: ${poolId}}}) {nodes{yieldVolume feeVolume totalSupply}}}`;
    const result = await fetch(query);
    if (result.status != 200) {
      return 0;
    }
  
    const data = result.data.data.dailyData.nodes;
    const dailyFeeApr = data.map((dailyData: PoolDailyData) => dailyData.feeVolume * 365.0 / dailyData.totalSupply);
    const dailyYieldApr = data.map((dailyData: PoolDailyData) => dailyData.yieldVolume * 365.0 / dailyData.totalSupply);
  
    // Important: This is used to filter out adnormal data in the early phase.
    // TODO Review the calculation
    const feeApr = _.mean(dailyFeeApr.filter(apr => apr < 0.5));
    const yieldApr = _.mean(dailyYieldApr);
  
    return feeApr + yieldApr;
  }
  
  async getTaiKsmApr() {
    const poolApr = await this.getPoolAPR('karura', 0);
  
    // TODO Replace it with tokenService.getTotalSupplyHistory()
    // Currently issuance in Karura token subquery is inaccurate
    const query1 = `${SUBQUERY_SERVERS.karura}?`
    + "query={dailyData(first:30, orderBy: TIMESTAMP_DESC, filter: {poolId: {equalTo: 0}}) {nodes{totalSupply}}}";
    const result1 = await fetch(query1);
    if (result1.status != 200) {
      return 0;
    }
    const dailyTotalSupply = result1.data.data.dailyData.nodes.map((node: {totalSupply: string}) => node.totalSupply);
  
    const dailyTaiPrice = await this.tokenService.getPriceHistory('karura', 'TAI', 30);
    // Use KSM price for taiKSM
    const dailyTaiKsmPrice = await this.tokenService.getPriceHistory('karura', 'KSM', 30);
  
    let totalAPR = 0;
    for (let i = 0; i < dailyTotalSupply.length; i++) {
      // 4000 TAI each day
      // Note: Need to change code here if the daily TAI reward changes!
      const apr = (4000 * dailyTaiPrice[i].price * 365) / (dailyTotalSupply[i] * dailyTaiKsmPrice[i].price);
      console.log(apr)
      totalAPR += apr;
    }
  
    return {
      "sa://0": poolApr,
      "TAI": totalAPR / dailyTotalSupply.length
    };
  }
  
  async get3UsdApr() {
    const poolApr = await this.getPoolAPR('karura', 1);
  
    // TODO Replace it with tokenService.getTotalSupplyHistory()
    // Currently issuance in Karura token subquery is inaccurate
    // TODO Set a longer period?
    const query1 = `${SUBQUERY_SERVERS.karura}?`
    + "query={dailyData(first:4, orderBy: TIMESTAMP_DESC, filter: {poolId: {equalTo: 1}}) {nodes{totalSupply}}}";
    const result1 = await fetch(query1);
    if (result1.status != 200) {
      return 0;
    }
    const dailyTotalSupply = result1.data.data.dailyData.nodes.map((node: {totalSupply: string}) => node.totalSupply);
  
    // TODO Use more days
    const dailyTaiPrice = await this.tokenService.getPriceHistory('karura', "TAI", 4);
    // Use KSM price for taiKSM
    const dailyTaiKsmPrice = await this.tokenService.getPriceHistory("karura", "KSM", 4);
    const dailyLksmPrice = await this.tokenService.getPriceHistory("karura", "LKSM", 4);
    const dailyKarPrice = await this.tokenService.getPriceHistory("karura", "KAR", 4);
    
    let taiApr = 0;
    let taiKsmApr = 0;
    let lksmApr = 0;
    let karApr = 0;
    for (let i = 0; i < dailyTotalSupply.length; i++) {
      // 8000 TAI per week
      taiApr += 8000.0 * dailyTaiPrice[i].price * (365.0 / 7) / dailyTotalSupply[i];
  
      // 30 taiKSM per week
      taiKsmApr += 30.0 * dailyTaiKsmPrice[i].price * (365.0 / 7) / dailyTotalSupply[i];
  
      // 250 LKSM per week
      lksmApr += 250.0 * dailyLksmPrice[i].price * (365.0 / 7) / dailyTotalSupply[i];
  
      // 2000 KAR per week
      karApr += 2000.0 * dailyKarPrice[i].price * (365.0 / 7) / dailyTotalSupply[i];
    }
  
    return {
      "sa://1": poolApr,
      "TAI": taiApr / dailyTotalSupply.length,
      "sa://0": taiKsmApr / dailyTotalSupply.length,
      "LKSM": lksmApr / dailyTotalSupply.length,
      "KAR": karApr / dailyTotalSupply.length,
    }
  }
  
  async getTdotApr() {
    const poolApr = await this.getPoolAPR('acala', 0);
  
    return {
      "sa://0": poolApr
    }
  }
}
