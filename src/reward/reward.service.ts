import { Injectable } from "@nestjs/common";
import { WsProvider } from "@polkadot/api";
import { Provider } from "@acala-network/bodhi";

import { keyring as Keyring } from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { ethers } from 'ethers';
import { abi } from './abi';
import axios from "axios";

@Injectable()
export class RewardService {
  private provider: Provider;

  constructor() {
    const wsProvider = new WsProvider("wss://karura-rpc-2.aca-api.network/ws");
    this.provider = new Provider({ provider: wsProvider });
    cryptoWaitReady().then(() => {
        Keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
    });
  }

  async getCurrentCycle(): Promise<number> {
    await this.provider.api.isReady;
    const contract = new ethers.Contract('0xf595F4a81B27E5CC1Daca349A69c834f375224F4', abi, this.provider);
    return (await contract.currentCycle()).toNumber();
  }

  async getClaimableFor(user: string) {
    const cycle = await this.getCurrentCycle();
    const rewardJson = (await axios.get(`/rewards_${cycle}.json`)).data;

    const contract = new ethers.Contract('0xf595F4a81B27E5CC1Daca349A69c834f375224F4', abi, this.provider);
    const addressKey = Keyring.encodeAddress(user, 42);

    const [tokens, amounts] = await contract.getClaimableFor(
        Keyring.decodeAddress(user),
        rewardJson.claims[addressKey].tokens,
        rewardJson.claims[addressKey].cumulativeAmounts
    );

    return {
        tokens,
        amounts: amounts.map(amount => amount.toString())
    };
  }
}
