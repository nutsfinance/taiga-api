import { Controller, Get } from "@nestjs/common";
import BN from "bignumber.js";
import { TokenService } from "./token.service";

@Controller("tokens")
export class TokenController {
  constructor(private tokenService: TokenService) {
  }

  @Get("taiksm")
  async getTaiKsmStats() {
    const tvl = await this.tokenService.getTaiKsmTotalSupply();

    return {
      tvl
    };
  }

  @Get("3usd")
  async getThreeUsdStats() {
    const tvl = await this.tokenService.getThreeUsdTotalSupply();

    return {
      tvl
    };
  }

  @Get("tdot")
  async getTdotStats() {
    const tvl = await this.tokenService.getTdotTotalSupply();

    return {
      tvl
    };
  }

  @Get("tai/total-supply")
  async getTaiTotalSupply(): Promise<string> {
    return this.tokenService.getTaiTotalSupply();
  }

  @Get("taiksm/total-supply")
  async getTaiKsmTotalSupply(): Promise<string> {
    return this.tokenService.getTaiKsmTotalSupply();
  }

  @Get("3usd/total-supply")
  async getThreeUsdTotalSupply(): Promise<string> {
    return this.tokenService.getThreeUsdTotalSupply();
  }

  @Get("tdot/total-supply")
  async getTdotTotalSupply(): Promise<string> {
    return this.tokenService.getTdotTotalSupply();
  }
}
