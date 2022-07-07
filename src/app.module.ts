import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenController } from './token/token.controller';
import { RewardController } from './reward/reward.controller';
import { RewardService } from './reward/reward.service';
import { AirdropController } from './airdrop/airdrop.controller';
import { AirdropService } from './airdrop/airdrop.service';

@Module({
  imports: [],
  controllers: [AppController, TokenController, RewardController, AirdropController],
  providers: [AppService, RewardService, AirdropService],
})
export class AppModule {}
