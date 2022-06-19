import { Controller, Get, Param, Query } from '@nestjs/common';
import { AirdropService } from './airdrop.service';

@Controller('airdrop')
export class AirdropController {
  constructor(private airdropService: AirdropService) {}

  @Get('cycle')
  async getCycle(@Query('network') network = 'karura', @Query('id') id = 0): Promise<number> {
    return await this.airdropService.getCurrentCycle(network, id);
  }

  @Get('root')
  async getRoot(@Query('network') network = 'karura', @Query('id') id = 0): Promise<string> {
    return await this.airdropService.getCurrentRoot(network, id);
  }

  @Get('user/:user')
  async getUserReward(@Param('user') user: string, @Query('network') network = 'karura', @Query('id') id = 0) {
    return await this.airdropService.getUserAirdrop(user, network, id);
  }

}