import { Injectable } from "@nestjs/common";
import { ApiPromise } from "@polkadot/api";
import { WsProvider } from "@polkadot/rpc-provider";
import { options } from "@acala-network/api";
import { forceToCurrencyId } from "@acala-network/sdk-core";
import BN from "bignumber.js";
import fetch from 'axios';
import { timestamp } from "rxjs";

const MULTISIG = "pqdhUsWkiGqyGvKDED2qAqiX4hHjtjJdBsmoj1HTAUhCRNk";
const TAI = "TAI";
const KSM_ONE = new BN("1000000000000");
const DOT_ONE = new BN("10000000000");
const TAI_INITIAL_SUPPLY = KSM_ONE.multipliedBy(10000000);

export interface TokenBalance {
  free: number,
  reserved: number,
  frozen: number
}

@Injectable()
export class TokenService {
  private apis: { [network: string]: ApiPromise} = {};
  constructor() {
    const karuraProvider = new WsProvider("wss://karura.api.onfinality.io/public-ws");
    this.apis['karura'] = new ApiPromise(options({ provider: karuraProvider }));

    const acalaProvider = new WsProvider("wss://acala-polkadot.api.onfinality.io/public-ws");
    this.apis['acala'] = new ApiPromise(options({ provider: acalaProvider }));
  }

  async getTokenBalance(network: string, asset: string, user: string, decimals: number): Promise<TokenBalance> {
    const api = this.apis[network];
    await api.isReady;

    const currencyId = forceToCurrencyId(api, asset);
    const balances = await api.query.tokens.accounts(user, currencyId);
    const unit = new BN(10).pow(decimals);

    return {
      free: new BN(balances["free"].toString()).div(unit).toNumber(),
      reserved: new BN(balances["reserved"].toString()).div(unit).toNumber(),
      frozen: new BN(balances["frozen"].toString()).div(unit).toNumber(),
    }
  }

  async getTaiCirculatingSupply(): Promise<string> {
    const api = this.apis['karura'];
    await api.isReady;

    const currencyId = forceToCurrencyId(api, TAI);

    const balances = await api.query.tokens.accounts(MULTISIG, currencyId);

    // Do something
    const circulating = TAI_INITIAL_SUPPLY.minus(
      new BN(balances["free"].toString())
    ).div(KSM_ONE);
    
    return circulating.toPrecision(12);
  }

  /**
   * @dev Gets the current total supply of an asset.
   */
  async getTotalSupply(network: string, asset: string, decimals: number) {
    const api = this.apis[network];
    await api.isReady;

    const currencyId = forceToCurrencyId(api, asset);
    const totalIssuance = await api.query.tokens.totalIssuance(currencyId);
    const unit = new BN(10).pow(decimals);

    return new BN(totalIssuance.toString()).div(unit).toNumber();
  }

  /**
   * @dev Gets the history of total supply for an asset.
   */
  async getTotalSupplyHistory(network: string, asset: string, decimals: number, days: number = 1) {
    const query = `https://api.subquery.network/sq/AcalaNetwork/${network}-tokens-ipfs?`
    + `query={token(id:"${asset}"){dailyTokens(first:${days}, orderBy: TIMESTMAP_DESC){nodes{issuance,timestmap}}}}`;
    const result = await fetch(query);
    if (result.status != 200) {
      return [];
    }

    const unit = new BN(10).pow(decimals);
    return result.data.data.token.dailyTokens.nodes.map(node => (
      {
        issuance: new BN(node.issuance).div(unit).toNumber(),
        timestamp: node.timestmap
      }
    ));
  }

  async getHolderAmount(network: string, asset: string): Promise<number> {
    const query = `https://api.subquery.network/sq/AcalaNetwork/${network}-tokens-ipfs?`
    + `query={accountBalances(filter: {tokenId: {equalTo: "${asset}"}}) {totalCount}}`;
    const result = await fetch(query);
    if (result.status != 200) {
      return 0;
    }

    return result.data.data.accountBalances.totalCount;
  }

  /**
   * @dev Gets the current price of an asset.
   */
  async getPrice(network: string, asset: string): Promise<number> {
    const prices = await this.getPriceHistory(network, asset, 1);

    return prices[0].price;
  }

  /**
   * @dev Gets the price history of an asset.
   */
  async getPriceHistory(network: string, asset: string, days: number = 1) {
    const query = `https://api.subquery.network/sq/AcalaNetwork/${network}-dex?`
    + `query={token(id:"${asset}"){dailyData(first:${days}, orderBy: TIMESTAMP_DESC){nodes{price,timestamp}}}}`;
    console.log(query)
    const result = await fetch(query);
    if (result.status != 200) {
      return [];
    }

    // Price returned by Acala SubQuery has 18 decimals
    const unit = new BN(10).pow(18);
    return result.data.data.token.dailyData.nodes.map(node => (
      {
        price: new BN(node.price).div(unit).toNumber(),
        timestamp: node.timestamp
      }
    ));
  }
}
