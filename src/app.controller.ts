import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { keyring as Keyring } from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    cryptoWaitReady().then(() => {
      Keyring.loadAll({ ss58Format: 42, type: 'sr25519' });
  });
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
