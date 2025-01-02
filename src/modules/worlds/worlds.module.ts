import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WorldsController } from './worlds.controller';
import { WorldsService } from './worlds.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [WorldsController],
  providers: [WorldsService],
})
export class WorldsModule {}
