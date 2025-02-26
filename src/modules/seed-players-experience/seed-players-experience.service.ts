import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WorldsService } from '../worlds/worlds.service';
import {
  HighscoreList,
  Highscores,
} from './entities/seed-players-experience.entity';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';
import { chunk } from 'lodash';

@Injectable()
export class SeedPlayersExperienceService {
  private readonly BATCH_SIZE = 100;
  private readonly TOTAL_PAGES = 20;
  private readonly CONCURRENT_WORLDS = 3;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly worldsService: WorldsService,
    private readonly prismaService: PrismaService,
  ) {}

  private async fetchHighscorePage(
    page: number,
    world: string,
  ): Promise<HighscoreList[]> {
    try {
      const { data } = await this.httpService.axiosRef.get<Highscores>(
        `${this.configService.get<string>('TIBIA_DATA_API_URL')}/highscores/${world}/experience/all/${page}`,
      );
      return data.highscores.highscore_list;
    } catch (error) {
      Logger.error(
        `Failed to fetch highscore page ${page} for world ${world}`,
        error,
      );
      return [];
    }
  }

  private async processWorld(world: string): Promise<void> {
    try {
      // Fetch all pages for this world
      const allHighscores: HighscoreList[] = [];
      await Promise.all(
        Array.from({ length: this.TOTAL_PAGES }, async (_, i) => {
          const page = await this.fetchHighscorePage(i + 1, world);
          allHighscores.push(...page);
        }),
      );

      // Get all existing characters for this world
      const existingCharacters = await this.prismaService.character.findMany({
        where: { world },
        select: { id: true, name: true, streak: true },
      });
      const existingCharacterNames = new Set(
        existingCharacters.map((c) => c.name),
      );

      // Get yesterday's date
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      const todayString = today.toISOString().split('T')[0];

      // Get yesterday's experience data for streak calculation
      const yesterdayExperiences =
        await this.prismaService.dailyExperience.findMany({
          where: {
            date: yesterdayString,
            character: { world },
          },
          select: { characterId: true, value: true },
        });
      const yesterdayExpMap = new Map(
        yesterdayExperiences.map((exp) => [exp.characterId, exp.value]),
      );

      // Get existing daily experiences for today
      const existingDailies = await this.prismaService.dailyExperience.findMany(
        {
          where: {
            date: todayString,
            character: { world },
          },
          select: { characterId: true },
        },
      );
      const existingDailyCharacterIds = new Set(
        existingDailies.map((d) => d.characterId),
      );

      // Prepare batch operations
      const newCharacters = [];
      const newDailyExperiences = [];
      const characterUpdates = [];

      for (const data of allHighscores) {
        if (!existingCharacterNames.has(data.name)) {
          newCharacters.push({
            name: data.name,
            world,
            level: data.level,
            experience: data.value,
            streak: 1, // New characters start with streak 1
            createdAt: new Date(),
          });
        }
      }

      // Create new characters in batches
      const characterChunks = chunk(newCharacters, this.BATCH_SIZE);
      for (const batch of characterChunks) {
        await this.prismaService.character.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      // Refresh character list after creating new ones
      const allCharacters = await this.prismaService.character.findMany({
        where: { world },
        select: { id: true, name: true, streak: true },
      });
      const characterMap = new Map(
        allCharacters.map((c) => [c.name, { id: c.id, streak: c.streak }]),
      );

      // Prepare daily experiences and streak updates
      for (const data of allHighscores) {
        const characterInfo = characterMap.get(data.name);
        if (!characterInfo) continue;

        const characterId = characterInfo.id;
        let currentStreak = characterInfo.streak || 0;

        // Check if we need to update the streak
        if (!existingDailyCharacterIds.has(characterId)) {
          const yesterdayExp = yesterdayExpMap.get(characterId);
          const previousDayExpGain = yesterdayExp !== undefined;

          // Update streak in character record
          if (previousDayExpGain) {
            currentStreak += 1; // Increment streak if had exp yesterday
            characterUpdates.push({
              id: characterId,
              streak: currentStreak,
            });
          } else {
            // Reset streak if no exp yesterday
            currentStreak = 1;
            characterUpdates.push({
              id: characterId,
              streak: 1,
            });
          }

          // Create daily experience record
          newDailyExperiences.push({
            characterId,
            date: todayString,
            value: data.value,
            level: data.level,
          });
        }
      }

      // Process streak updates in batches
      const streakUpdateChunks = chunk(characterUpdates, this.BATCH_SIZE);
      for (const batch of streakUpdateChunks) {
        await Promise.all(
          batch.map((update) =>
            this.prismaService.character.update({
              where: { id: update.id },
              data: { streak: update.streak },
            }),
          ),
        );
      }

      // Create daily experiences in batches
      const dailyChunks = chunk(newDailyExperiences, this.BATCH_SIZE);
      for (const batch of dailyChunks) {
        await this.prismaService.dailyExperience.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }

      Logger.log(
        `Processed world ${world}: ${newCharacters.length} new characters, ${newDailyExperiences.length} new daily experiences, ${characterUpdates.length} streak updates`,
      );
    } catch (error) {
      Logger.error(`Failed to process world ${world}: ${error.message}`);
    }
  }

  @Cron('0 */12 * * *')
  async seedPlayersExperience() {
    try {
      const { worlds } = await this.worldsService.getAllWorlds();
      const worldChunks = chunk(worlds, this.CONCURRENT_WORLDS);

      for (const worldBatch of worldChunks) {
        await Promise.all(worldBatch.map((world) => this.processWorld(world)));
      }
    } catch (error) {
      Logger.error('Failed to seed players experience:', error);
    }
  }
}
