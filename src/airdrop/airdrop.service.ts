import { Injectable } from "@nestjs/common";
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { keyring as Keyring } from '@polkadot/ui-keyring';
import { ethers } from 'ethers';
import { abi } from './abi';
import fetch from 'axios';

const AIRDROP_DISTRIBUTORS = {
  "mandala": [
    "0xD7F984196392C7eA791F4A39e797e8dE19Ca898d",
  ],
  "karura": [
    "0x30385059196602A1498F5f8Ef91f3450e3A7B27a",
  ],
  "acala": [

  ]
};

@Injectable()
export class AirdropService {
  private providers: { [network: string]: Provider} = {};
  private airdropMerkles: {[key: string]: any} = {};
  private airdropInfos: {[key: string]: any} = {};

  constructor() {
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

  async getCurrentCycle(network: string, id: number): Promise<number> {
    await this.providers[network].api.isReady;
    const contract = new ethers.Contract(AIRDROP_DISTRIBUTORS[network][id], abi, this.providers[network]);
    return (await contract.currentCycle()).toNumber();
  }

  async getCurrentRoot(network: string, id: number): Promise<string> {
    await this.providers[network].api.isReady;
    const contract = new ethers.Contract(AIRDROP_DISTRIBUTORS[network][id], abi, this.providers[network]);
    return await contract.merkleRoot();
  }

  async getUserAirdrop(user: string, network: string, id: number) {
    await this.providers[network].api.isReady;
    const cycle = await this.getCurrentCycle(network, id);
    const airdropKey = `airdrop_${network}_${id}_${cycle}`;
    let airdropJson = this.airdropMerkles[airdropKey];
    
    if (!airdropJson) {
      try {
        const response = await fetch(`http://reward-merkle-json.s3-website-ap-southeast-1.amazonaws.com/${airdropKey}.json`);
        airdropJson = response.data;
        this.airdropMerkles[airdropKey] = airdropJson;
      } catch (error) {
        console.error(error)
        return {};
      }
    }

    const contract = new ethers.Contract(AIRDROP_DISTRIBUTORS[network][id], abi, this.providers[network]);
    const addressKey = Keyring.encodeAddress(user, 42);
    if (!airdropJson.claims[addressKey])  return {};

    const [tokens, amounts] = await contract.getClaimableFor(
        Keyring.decodeAddress(user),
        airdropJson.claims[addressKey].tokens,
        airdropJson.claims[addressKey].cumulativeAmounts
    );

    const infoKey = `airdrop_${network}_${id}_info`;
    let infoJson = this.airdropInfos[infoKey];
    if (!infoJson) {
      try {
        const response = await fetch(`http://reward-merkle-json.s3-website-ap-southeast-1.amazonaws.com/${infoKey}.json`);
        infoJson = response.data;
        this.airdropInfos[infoKey] = infoJson;
      } catch (error) {
        console.error(error)
      }
    }
    const info = infoJson.find(i => i.address === addressKey) || {};

    return {
        tokens,
        cumulative: airdropJson.claims[addressKey].cumulativeAmounts,
        claimable: amounts.map(amount => amount.toString()),
        index: airdropJson.claims[addressKey].index,
        cycle: airdropJson.cycle,
        proof: airdropJson.claims[addressKey].proof,
        info
    };
  }
}
