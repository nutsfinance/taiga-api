import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenController } from './token/token.controller';
import { RewardController } from './reward/reward.controller';
import { RewardService } from './reward/reward.service';
import { AirdropController } from './airdrop/airdrop.controller';
import { AirdropService } from './airdrop/airdrop.service';
import { ProtocolController } from './protocol/protocol.controller';
import { TokenService } from './token/token.service';

@Module({
  imports: [],
  controllers: [AppController, TokenController, RewardController, AirdropController, ProtocolController],
  providers: [AppService, RewardService, AirdropService, TokenService],
})
export class AppModule {}