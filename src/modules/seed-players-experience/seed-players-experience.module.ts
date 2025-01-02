import { Module } from '@nestjs/common';
import { SeedPlayersExperienceService } from './seed-players-experience.service';
import { SeedPlayersExperienceController } from './seed-players-experience.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import * as http from 'node:http';
import { WorldsModule } from '../worlds/worlds.module';
import { WorldsService } from '../worlds/worlds.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 9999999,
      httpAgent: new http.Agent({
        keepAlive: true,
        timeout: 60000,
        maxSockets: 100,
      }),
    }),
    ConfigModule,
    WorldsModule,
  ],
  controllers: [SeedPlayersExperienceController],
  providers: [SeedPlayersExperienceService, WorldsService],
})
export class SeedPlayersExperienceModule {}
