import { Module } from '@nestjs/common';
import { ProfitManagerService } from './profit-manager.service';
import { ProfitManagerController } from './profit-manager.controller';
import { PrismaService } from 'src/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  controllers: [ProfitManagerController],
  providers: [ProfitManagerService, PrismaService, ConfigService],
})
export class ProfitManagerModule {}
