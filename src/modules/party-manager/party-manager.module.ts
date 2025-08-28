import { Module } from '@nestjs/common';
import { PartyManagerService } from './party-manager.service';
import { PartyManagerController } from './party-manager.controller';

@Module({
  controllers: [PartyManagerController],
  providers: [PartyManagerService],
})
export class PartyManagerModule {}
