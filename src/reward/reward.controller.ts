import { Controller, Get, Param, Query } from '@nestjs/common';
import { RewardService } from './reward.service';

@Controller('rewards')
export class RewardController {
  constructor(private rewardService: RewardService) {}

  @Get('apr')
  async getApr(@Query('network') network = 'karura', @Query('pool') pool = 0) {
    // Simply return Karura APR to Mandala
    if (network === 'karura' || network === 'mandala') {
      if (pool == 0)  return await this.rewardService.getTaiKsmApr();
      if (pool == 1)  return await this.rewardService.get3UsdApr();
    } else if (network === 'acala') {
      if (pool == 0)  return await this.rewardService.getTdotApr();
    }
  }

  @Get('cycle')
  async getCycle(@Query('network') network = 'karura', @Query('pool') pool = 0): Promise<number> {
    return await this.rewardService.getCurrentCycle(network, pool);
  }

  @Get('root')
  async getRoot(@Query('network') network = 'karura', @Query('pool') pool = 0): Promise<string> {
    return await this.rewardService.getCurrentRoot(network, pool);
  }

  @Get('user/:user')
  async getUserReward(@Param('user') user: string, @Query('network') network = 'karura', @Query('pool') pool = 0) {
    return await this.rewardService.getUserReward(user, network, pool);
  }

}