import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DeleteOldExperiencesService {
  constructor(private readonly prismaService: PrismaService) {}

  // Run every day at 5:00 AM
  @Cron('0 5 */1 * *')
  async execute() {
    try {
      Logger.log('Deleting old experiences...');

      // Thirty days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 32);

      const deleted = await this.prismaService.dailyExperience.deleteMany({
        where: {
          date: {
            // Lower than 30 days ago
            lt: thirtyDaysAgo.toISOString().split('T')[0],
          },
        },
      });
      if (deleted) {
        Logger.log(`Deleted ${deleted.count} old experiences`);
      }
    } catch (e) {
      Logger.error(e);
    }
  }
}
