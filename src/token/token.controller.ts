import { Controller, Get, Query } from "@nestjs/common";
import BN from "bignumber.js";
import { TokenService } from "./token.service";

@Controller("tokens")
export class TokenController {
  constructor(private tokenService: TokenService) {
  }

  @Get("taiksm/stats")
  async getTaiKsmStats() {
    const total = await this.tokenService.getTotalSupply('karura', "sa://0", 12);
    const holder = await this.tokenService.getHolderAmount('karura', 'sa://0');
    const price = await this.tokenService.getPrice('kusama');

    return {
      total,
      chains: {
        karura: total
      },
      // Karura Pulse
      code: 1,
      data: {
        label: 'taiKSM',
        tvl: Number(total) * price,
        holder,
        data: new Date().toISOString()
      }
    };
  }

  @Get("taiksm/history")
  async getTaiKsmHistory(@Query('days') days: number = 30) {
    const totalSupplies = await this.tokenService.getTotalSupplyHistory('karura', 'sa://0', 12, days);
    const prices = await this.tokenService.getPriceHistory('karura', 'KSM', days);
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        label: 'taiKSM',
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

  @Get("3usd/history")
  async getThreeUsdHistory(@Query('days') days: number = 30) {
    const totalSupplies = await this.tokenService.getTotalSupplyHistory('karura', 'sa://1', 12, days);
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        label: '3USD',
        tvl: totalSupplies[i].issuance,
        holder: '-',
        date: new Date(totalSupplies[i].timestamp).toISOString()
      });
    }

    return {
      // Karura Pulse
      code: 1,
      data
    };
  }

  @Get("tdot/history")
  async getTdotHistory(@Query('days') days: number = 30) {
    const totalSupplies = await this.tokenService.getTotalSupplyHistory('acala', 'sa://0', 10, days);
    const prices = await this.tokenService.getPriceHistory('acala', 'DOT', days);
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        label: 'tDOT',
        tvl: totalSupplies[i].issuance * prices[i].price,
        holder: '-',
        date: new Date(prices[i].timestamp).toISOString()
      });
    }

    return {
      // Acala Pulse
      code: 1,
      data
    };
  }

  @Get("3usd/stats")
  async getThreeUsdStats() {
    const total = await this.tokenService.getTotalSupply('karura', 'sa://1', 12);
    const holder = await this.tokenService.getHolderAmount('karura', 'sa://1');

    return {
      total,
      chains: {
        karura: total
      },
      // Karura Pulse
      code: 1,
      data: {
        label: '3USD',
        tvl: total,
        holder,
        data: new Date().toISOString()
      }
    };
  }

  @Get("tdot/stats")
  async getTdotStats() {
    const total = await this.tokenService.getTotalSupply('acala', 'sa://0', 10);
    const holder = await this.tokenService.getHolderAmount('acala', 'sa://0');
    const price = await this.tokenService.getPrice('polkadot');

    return {
      total,
      chains: {
        acala: total
      },
      // Karura Pulse
      code: 1,
      data: {
        label: 'tDOT',
        tvl: Number(total) * price,
        holder,
        data: new Date().toISOString()
      }
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
