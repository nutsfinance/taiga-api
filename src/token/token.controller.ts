import { Controller, Get } from "@nestjs/common";
import BN from "bignumber.js";
import { TokenService } from "./token.service";

@Controller("tokens")
export class TokenController {
  constructor(private tokenService: TokenService) {
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
