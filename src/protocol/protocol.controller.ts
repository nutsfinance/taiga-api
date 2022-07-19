import { Controller, Get } from "@nestjs/common";
import BN from "bignumber.js";
import fetch from 'axios';
import { TokenService } from "../token/token.service";

@Controller("protocol")
export class ProtocolController {
  constructor(private tokenService: TokenService) {
  }

  @Get("taiga/tvl")
  async getTaigaTvl(): Promise<string> {
    const taiksmTotalSupply = new BN(await this.tokenService.getTotalSupply('karura', 'sa://0', 12));
    const threeUsdTotalSupply = new BN(await this.tokenService.getTotalSupply('karura', 'sa://1', 12));

    const ksmPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=kusama&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true')

    return new BN(ksmPrice.data.kusama.usd).times(taiksmTotalSupply).plus(threeUsdTotalSupply).toString();
  }

  @Get("tapio/tvl")
  async getTapioTvl(): Promise<string> {
    const tdotTotalSupply = new BN(await this.tokenService.getTotalSupply('acala', 'sa://0', 10));

    const dotPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true')

    return new BN(dotPrice.data.polkadot.usd).times(tdotTotalSupply).toString();
  }
}
