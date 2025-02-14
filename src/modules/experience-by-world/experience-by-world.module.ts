import { Module } from '@nestjs/common';
import { ExperienceByWorldService } from './experience-by-world.service';
import { ExperienceByWorldController } from './experience-by-world.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WorldsModule } from '../worlds/worlds.module';
import { PrismaService } from 'src/prisma.service';
import { WorldsService } from '../worlds/worlds.service';

@Module({
  imports: [HttpModule, ConfigModule, WorldsModule],
  controllers: [ExperienceByWorldController],
  providers: [ExperienceByWorldService, PrismaService, WorldsService],
})
export class ExperienceByWorldModule {}
