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
    let response;
    try {
      response = await fetch(`/airdrop_${network}_${id}_${cycle}.json`);
    } catch (error) {
      console.error(error)
      return {};
    }
    const rewardJson = response.data;

    const contract = new ethers.Contract(AIRDROP_DISTRIBUTORS[network][id], abi, this.providers[network]);
    const addressKey = Keyring.encodeAddress(user, 42);
    if (!rewardJson.claims[addressKey])  return {};

    const [tokens, amounts] = await contract.getClaimableFor(
        Keyring.decodeAddress(user),
        rewardJson.claims[addressKey].tokens,
        rewardJson.claims[addressKey].cumulativeAmounts
    );

    let info = {}
    try {
      const infoJson = (await fetch(`/airdrop_${network}_${id}_info.json`)).data;
      info = infoJson.find(i => i.address === addressKey);
    } catch (error) {
      console.error(error)
    }

    return {
        tokens,
        cumulative: rewardJson.claims[addressKey].cumulativeAmounts,
        claimable: amounts.map(amount => amount.toString()),
        index: rewardJson.claims[addressKey].index,
        cycle: rewardJson.cycle,
        proof: rewardJson.claims[addressKey].proof,
        info
    };
  }
}
