import { Controller, Get, Param, Query } from "@nestjs/common";
import BN from "bignumber.js";
import { TokenService } from "./token.service";

const TOKEN_CONFIG = {
  "ksm": {
    network: "karura",
    asset: "KSM",
    decimals: 12
  },
  "lksm": {
    network: "karura",
    asset: "LKSM",
    decimals: 12
  },
  "taiksm": {
    network: "karura",
    asset: "sa://0",
    decimals: 12,
    reference: "KSM"
  },
  "3usd": {
    network: "karura",
    asset: "sa://1",
    decimals: 12,
    reference: "KUSD"
  },
  "dot": {
    network: "acala",
    asset: "DOT",
    decimals: 10
  },
  "ldot": {
    network: "acala",
    asset: "LDOT",
    decimals: 10
  },
  "tdot": {
    network: "acala",
    asset: "sa://0",
    decimals: 10,
    reference: "DOT"
  }
};

@Controller("tokens")
export class TokenController {
  constructor(private tokenService: TokenService) {
  }

  @Get(":token/balance")
  async getTokenBalance(@Param("token") token: string, @Query("user") user: string) {
    const config = TOKEN_CONFIG[token.toLocaleLowerCase()];
    return this.tokenService.getTokenBalance(config.network, config.asset, user, config.decimals);
  }

  @Get(":token/stats")
  async getTokenStats(@Param("token") token: string) {
    const config = TOKEN_CONFIG[token.toLocaleLowerCase()];
    const total = await this.tokenService.getTotalSupply(config.network, config.asset, config.decimals);
    const holder = await this.tokenService.getHolderAmount(config.network, config.asset);
    const price = await this.tokenService.getPrice(config.network, config.reference || config.asset);

    const stats =  {
      total,
      chains: {},
      // Acala/Karura Pulse
      code: 1,
      data: {
        label: token,
        tvl: Number(total) * price,
        holder,
        data: new Date().toISOString()
      }
    };
    stats.chains[config.network] = total;

    return stats;
  }

  @Get(":token/history")
  async getTokenHistory(@Param("token") token: string, @Query('days') days: number = 30) {
    const config = TOKEN_CONFIG[token.toLocaleLowerCase()];
    const totalSupplies = await this.tokenService.getTotalSupplyHistory(config.network, config.asset, config.decimals, days);
    const prices = await this.tokenService.getPriceHistory(config.network, config.reference || config.asset, days);
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        label: token,
        tvl: totalSupplies[i].issuance * prices[i].price,
        holder: '-',
        date: new Date(prices[i].timestamp).toISOString()
      });
    }

    return {
      // Karura Pulse
      code: 1,
      data
    };
  }

  /**
   * Below are deprecated methods. Should be removed after all dependencies are updated.
   */
  
   @Get("taiksm")
   async getTaiKsmData() {
     const total = await this.tokenService.getTotalSupply('karura', "sa://0", 12);
 
     return {
       tvl: total
     };
   }
 
   @Get("3usd")
   async getThreeUsdData() {
     const total = await this.tokenService.getTotalSupply('karura', 'sa://1', 12);
 
     return {
       tvl: total,
     };
   }
 
   @Get("tdot")
   async getTdotData() {
     const total = await this.tokenService.getTotalSupply('acala', 'sa://0', 10);
     
     return {
       tvl: total,
     };
   }

  @Get("tai/total-supply")
  async getTaiTotalSupply() {
    return this.tokenService.getTaiCirculatingSupply();
  }

  @Get("taiksm/total-supply")
  async getTaiKsmTotalSupply() {
    return this.tokenService.getTotalSupply('karura', 'sa://0', 12);
  }

  @Get("3usd/total-supply")
  async getThreeUsdTotalSupply() {
    return this.tokenService.getTotalSupply('karura', 'sa://1', 12);
  }

  @Get("tdot/total-supply")
  async getTdotTotalSupply() {
    return this.tokenService.getTotalSupply('acala', 'sa://0', 10);
  }
}
