import { Controller, Get } from "@nestjs/common";
import { ApiPromise } from "@polkadot/api";
import { WsProvider } from "@polkadot/rpc-provider";
import { options } from "@acala-network/api";
import { forceToCurrencyId } from "@acala-network/sdk-core";
import BN from "bignumber.js";

const MULTISIG = "pqdhUsWkiGqyGvKDED2qAqiX4hHjtjJdBsmoj1HTAUhCRNk";
const TAI = "TAI";
const KSM_ONE = new BN("1000000000000");
const DOT_ONE = new BN("10000000000");
const TAI_INITIAL_SUPPLY = KSM_ONE.multipliedBy(10000000);

@Controller("tokens")
export class TokenController {
  private apis: { [network: string]: ApiPromise} = {};
  constructor() {
    const karuraProvider = new WsProvider("wss://karura.api.onfinality.io/public-ws");
    this.apis['karura'] = new ApiPromise(options({ provider: karuraProvider }));

    const acalaProvider = new WsProvider("wss://acala-polkadot.api.onfinality.io/public-ws");
    this.apis['acala'] = new ApiPromise(options({ provider: acalaProvider }));
  }

  @Get("tai/total-supply")
  async getTaiTotalSupply(): Promise<string> {
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

  @Get("taiksm/total-supply")
  async getTaiKsmTotalSupply(): Promise<string> {
    const api = this.apis['karura'];
    await api.isReady;

    const currencyId = forceToCurrencyId(api, "sa://0");
    const totalIssuance = await api.query.tokens.totalIssuance(currencyId);
    
    return new BN(totalIssuance.toString()).div(KSM_ONE).toPrecision(12);
  }

  @Get("3usd/total-supply")
  async getThreeUsdTotalSupply(): Promise<string> {
    const api = this.apis['karura'];
    await api.isReady;

    const currencyId = forceToCurrencyId(api, "sa://1");
    const totalIssuance = await api.query.tokens.totalIssuance(currencyId);
    
    return new BN(totalIssuance.toString()).div(KSM_ONE).toPrecision(12);
  }

  @Get("tdot/total-supply")
  async getTdotTotalSupply(): Promise<string> {
    const api = this.apis['acala'];
    await api.isReady;

    const currencyId = forceToCurrencyId(api, "sa://0");
    const totalIssuance = await api.query.tokens.totalIssuance(currencyId);
    
    return new BN(totalIssuance.toString()).div(DOT_ONE).toPrecision(12);
  }
}
