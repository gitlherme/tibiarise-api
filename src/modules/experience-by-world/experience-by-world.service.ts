import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

export interface ExperienceGain {
  characterId: string;
  characterName: string;
  level: number;
  world: string;
  experienceGained: number;
  experiencePerHour: number;
  percentageGain: number;
}

interface TimePeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

@Injectable()
export class ExperienceByWorldService {
  constructor(private readonly prismaService: PrismaService) {}

  private getTimePeriods(): {
    yesterday: TimePeriod;
    lastWeek: TimePeriod;
    lastMonth: TimePeriod;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 2);
    yesterday.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);

    return {
      yesterday: {
        startDate: yesterday,
        endDate: today,
        label: 'daily',
      },
      lastWeek: {
        startDate: weekAgo,
        endDate: today,
        label: 'weekly',
      },
      lastMonth: {
        startDate: monthAgo,
        endDate: today,
        label: 'monthly',
      },
    };
  }

  /**
   * Calculate experience gains for characters in a specific world and time period
   */
  private async calculateExperienceGains(
    world: string,
    startDate: Date,
    endDate: Date,
    limit = 100,
  ): Promise<ExperienceGain[]> {
    // Find characters from the specified world
    Logger.log(
      `Calculating experience gains for world: ${world}, from ${startDate} to ${endDate}`,
      'ExperienceByWorldService',
    );

    const characters = await this.prismaService.character.findMany({
      where: {
        world: {
          mode: 'insensitive',
          equals: world,
        },
      },
      select: {
        id: true,
        name: true,
        level: true,
      },
    });

    if (characters.length === 0) {
      Logger.warn(`No characters found for world: ${world}`);
      return [];
    }

    const characterIds = characters.map((char) => char.id);

    // Get the earliest daily experience record within the date range for each character
    const startExperiences = await this.prismaService.dailyExperience.findMany({
      where: {
        characterId: {
          in: characterIds,
        },
        date: {
          gte: startDate.toISOString().split('T')[0],
        },
      },
      orderBy: {
        date: 'asc',
      },
      distinct: ['characterId'],
    });

    const endExperiences = await this.prismaService.dailyExperience.findMany({
      where: {
        characterId: {
          in: characterIds,
        },
        date: {
          lte: endDate.toISOString().split('T')[0],
        },
      },
      orderBy: {
        date: 'desc',
      },
      distinct: ['characterId'],
    });

    // Create maps for faster lookup
    const startExpMap = new Map(
      startExperiences.map((exp) => [exp.characterId, exp]),
    );
    const endExpMap = new Map(
      endExperiences.map((exp) => [exp.characterId, exp]),
    );
    const characterMap = new Map(characters.map((char) => [char.id, char]));

    const gains: ExperienceGain[] = [];

    for (const characterId of characterIds) {
      const startExp = startExpMap.get(characterId);
      const endExp = endExpMap.get(characterId);
      const character = characterMap.get(characterId);

      if (startExp && endExp && startExp.date !== endExp.date) {
        const expGained = Number(
          Number(endExp.value.toString()) - Number(startExp.value.toString()),
        );

        if (expGained <= 0) continue; // Skip negative or zero gains

        const startDateTime = new Date(startExp.date).getTime();
        const endDateTime = new Date(endExp.date).getTime();
        const daysDiff = (endDateTime - startDateTime) / (1000 * 60 * 60 * 24);

        const hoursDiff = daysDiff * 24;

        const expPerHour =
          hoursDiff > 0 ? Math.round(expGained / hoursDiff) : expGained;

        const percentageGain =
          (expGained / Number(startExp.value.toString())) * 100;

        gains.push({
          characterId,
          characterName: character.name,
          level: endExp.level,
          world,
          experienceGained: expGained,
          experiencePerHour: expPerHour,
          percentageGain: parseFloat(percentageGain.toFixed(2)),
        });
      }
    }

    // Sort by experience gained (descending) and take top results
    return gains
      .sort((a, b) => b.experienceGained - a.experienceGained)
      .slice(0, limit);
  }

  /**
   * Get top gainers for all time periods
   */
  async getTopGainers(world: string, limit = 100) {
    const periods = this.getTimePeriods();

    // Execute all queries in parallel
    const [yesterdayGains, weeklyGains, monthlyGains] = await Promise.all([
      this.calculateExperienceGains(
        world,
        periods.yesterday.startDate,
        periods.yesterday.endDate,
        limit,
      ),
      this.calculateExperienceGains(
        world,
        periods.lastWeek.startDate,
        periods.lastWeek.endDate,
        limit,
      ),
      this.calculateExperienceGains(
        world,
        periods.lastMonth.startDate,
        periods.lastMonth.endDate,
        limit,
      ),
    ]);

    return {
      world,
      periods: {
        yesterday: {
          startDate: periods.yesterday.startDate,
          endDate: periods.yesterday.endDate,
          topGainers: yesterdayGains,
        },
        lastWeek: {
          startDate: periods.lastWeek.startDate,
          endDate: periods.lastWeek.endDate,
          topGainers: weeklyGains,
        },
        lastMonth: {
          startDate: periods.lastMonth.startDate,
          endDate: periods.lastMonth.endDate,
          topGainers: monthlyGains,
        },
      },
    };
  }

  /**
   * Get top gainers for a specific period
   */
  async getTopGainersByPeriod(
    world: string,
    period: 'daily' | 'weekly' | 'monthly',
    limit = 100,
  ) {
    Logger.log(
      `Fetching characters for world: ${world}`,
      'ExperienceByWorldService',
    );
    const periods = this.getTimePeriods();
    let timePeriod: TimePeriod;

    switch (period) {
      case 'daily':
        timePeriod = periods.yesterday;
        break;
      case 'weekly':
        timePeriod = periods.lastWeek;
        break;
      case 'monthly':
        timePeriod = periods.lastMonth;
        break;
      default:
        throw new NotFoundException(`Invalid period: ${period}`);
    }

    const gains = await this.calculateExperienceGains(
      world,
      timePeriod.startDate,
      timePeriod.endDate,
      limit,
    );

    return {
      world,
      period: {
        type: period,
        startDate: timePeriod.startDate,
        endDate: timePeriod.endDate,
      },
      topGainers: gains,
    };
  }
}
