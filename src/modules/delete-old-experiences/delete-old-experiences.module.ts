import { Module } from '@nestjs/common';
import { DeleteOldExperiencesService } from './delete-old-experiences.service';
import { DeleteOldExperiencesController } from './delete-old-experiences.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [DeleteOldExperiencesController],
  providers: [DeleteOldExperiencesService, PrismaService, ConfigService],
})
export class DeleteOldExperiencesModule {}
