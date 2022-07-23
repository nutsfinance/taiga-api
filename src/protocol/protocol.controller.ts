import { Controller, Get } from "@nestjs/common";
import BN from "bignumber.js";
import fetch from 'axios';
import { TokenService } from "../token/token.service";

@Controller("protocol")
export class ProtocolController {
  constructor(private tokenService: TokenService) {
  }


  @Get("taiga/stats")
  async getTaigaStats() {
    const taiksmTotalSupply = await this.tokenService.getTotalSupply('karura', 'sa://0', 12);
    const ksmPrice = await this.tokenService.getPrice('karura', 'sa://0');

    const threeUsdTotalSupply = await this.tokenService.getTotalSupply('karura', 'sa://1', 12);

    return {
      tvl: ksmPrice * taiksmTotalSupply + threeUsdTotalSupply
    };
  }

  @Get("tapio/stats")
  async getTapioStats() {
    const tdotTotalSupply = await this.tokenService.getTotalSupply('acala', 'sa://0', 10);
    const dotPrice = await this.tokenService.getPrice("acala", "sa://0");

    return {
      tvl: tdotTotalSupply * dotPrice
    };
  }

  /**
   * Below are deprecated methods and should be removed later.
   */

  @Get("taiga/tvl")
  async getTaigaTvl() {
    const taiksmTotalSupply = await this.tokenService.getTotalSupply('karura', 'sa://0', 12);
    const ksmPrice = await this.tokenService.getPrice("karura", "sa://0");

    const threeUsdTotalSupply = await this.tokenService.getTotalSupply('karura', 'sa://1', 12);

    return ksmPrice * taiksmTotalSupply + threeUsdTotalSupply;
  }

  @Get("tapio/tvl")
  async getTapioTvl() {
    const tdotTotalSupply = await this.tokenService.getTotalSupply('acala', 'sa://0', 10);
    const dotPrice = await this.tokenService.getPrice("acala", "sa://0");

    return tdotTotalSupply * dotPrice;
  }
}
