import { Module } from '@nestjs/common';
import { ExperienceByWorldService } from './experience-by-world.service';
import { ExperienceByWorldController } from './experience-by-world.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [],
  providers: [ExperienceByWorldService, PrismaService],
  controllers: [ExperienceByWorldController],
  exports: [ExperienceByWorldService],
})
export class ExperienceByWorldModule {}
