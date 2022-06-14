import { Controller, Get } from "@nestjs/common";
import { ApiPromise } from "@polkadot/api";
import { WsProvider } from "@polkadot/rpc-provider";
import { options } from "@acala-network/api";
import { forceToCurrencyId } from "@acala-network/sdk-core";
import BN from "bignumber.js";

const MULTISIG = "pqdhUsWkiGqyGvKDED2qAqiX4hHjtjJdBsmoj1HTAUhCRNk";
const TAI = "TAI";
const TAI_ONE = new BN("1000000000000");
const INITIAL_SUPPLY = TAI_ONE.multipliedBy(10000000);

@Controller("tokens")
export class TokenController {
  constructor() {}

  @Get("tai/total-supply")
  async getTaiTotalSupply(): Promise<string> {
    const provider = new WsProvider("wss://karura.api.onfinality.io/public-ws");
    const api = new ApiPromise(options({ provider }));
    await api.isReady;

    const currencyId = forceToCurrencyId(api, TAI);

    const balances = await api.query.tokens.accounts(MULTISIG, currencyId);

    // Do something
    const circulating = INITIAL_SUPPLY.minus(
      new BN(balances["free"].toString())
    ).div(TAI_ONE);
    
    return circulating.toPrecision(12);
  }
}
