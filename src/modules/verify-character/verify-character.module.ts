import { Module } from '@nestjs/common';
import { VerifyCharacterService } from './verify-character.service';
import { VerifyCharacterController } from './verify-character.controller';
import { PrismaService } from 'src/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [HttpModule],
  controllers: [VerifyCharacterController],
  providers: [VerifyCharacterService, PrismaService, ConfigService],
})
export class VerifyCharacterModule {}
