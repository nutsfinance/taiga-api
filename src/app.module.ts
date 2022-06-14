import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TokenController } from './token/token.controller';
import { RewardController } from './reward/reward.controller';
import { RewardService } from './reward/reward.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [AppController, TokenController, RewardController],
  providers: [AppService, RewardService],
})
export class AppModule {}
