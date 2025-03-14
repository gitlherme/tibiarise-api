import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WorldsService } from '../worlds/worlds.service';
import {
  HighscoreList,
  Highscores,
} from './entities/seed-players-experience.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';
import { chunk } from 'lodash';

@Injectable()
export class SeedPlayersExperienceService implements OnModuleInit {
  private readonly BATCH_SIZE = 100;
  private readonly TOTAL_PAGES = 20;
  private readonly CONCURRENT_WORLDS = 3;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly worldsService: WorldsService,
    private readonly prismaService: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronTime = this.configService.get('CRON_SEED_PLAYERS_CONFIG');

    // Configurar manualmente a função cron
    const callback = () => {
      this.seedPlayersExperience();
    };

    // Adicionar o job ao scheduler
    try {
      // Importe o CronJob da versão correta
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CronJob } = require('cron');

      const job = new CronJob(cronTime, callback);
      this.schedulerRegistry.addCronJob('seedPlayersExperience', job);
      job.start();

      Logger.log(`Scheduled seedPlayersExperience job with cron: ${cronTime}`);
      Logger.log(
        this.schedulerRegistry.getCronJob('seedPlayersExperience').nextDate(),
      );
    } catch (error) {
      Logger.error(`Failed to schedule cron job: ${error.message}`);
    }
  }

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

  // Função auxiliar para obter apenas a parte da data (sem hora)
  private getDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Função auxiliar para comparar se duas datas são do mesmo dia
  private isSameDay(date1: string, date2: string): boolean {
    return date1.split('T')[0] === date2.split('T')[0];
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

      // Remover possíveis duplicatas na lista de highscores
      const uniqueHighscores = Array.from(
        new Map(allHighscores.map((item) => [item.name, item])).values(),
      );

      // Get all existing characters for this world
      const existingCharacters = await this.prismaService.character.findMany({
        where: { world },
        select: { id: true, name: true, streak: true },
      });
      const existingCharacterNames = new Set(
        existingCharacters.map((c) => c.name),
      );

      // Get yesterday's date and today's date with full timestamp
      const now = new Date();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get the date parts for comparison
      const yesterdayDateOnly = this.getDateOnly(yesterday);
      const todayDateOnly = this.getDateOnly(today);
      const currentTimestamp = now.toISOString(); // Timestamp completo para registros

      // Get yesterday's experience data for streak calculation
      const yesterdayExperiences =
        await this.prismaService.dailyExperience.findMany({
          where: {
            character: { world },
          },
          select: { characterId: true, value: true, date: true },
        });

      // Filtrar experiências de ontem usando a função isSameDay
      const yesterdayFilteredExperiences = yesterdayExperiences.filter((exp) =>
        this.isSameDay(exp.date, yesterdayDateOnly),
      );

      const yesterdayExpMap = new Map(
        yesterdayFilteredExperiences.map((exp) => [exp.characterId, exp.value]),
      );

      // Get existing daily experiences for today
      const existingDailies = await this.prismaService.dailyExperience.findMany(
        {
          where: {
            character: { world },
          },
          select: { characterId: true, value: true, level: true, date: true },
        },
      );

      // Filtrar experiências de hoje usando a função isSameDay
      const todayFilteredDailies = existingDailies.filter((daily) =>
        this.isSameDay(daily.date, todayDateOnly),
      );

      const existingDailyMap = new Map(
        todayFilteredDailies.map((d) => [
          d.characterId,
          { value: d.value, level: d.level, date: d.date },
        ]),
      );
      const existingDailyCharacterIds = new Set(
        todayFilteredDailies.map((d) => d.characterId),
      );

      // Prepare batch operations
      const newCharacters = [];
      const newDailyExperiences = [];
      const updateDailyExperiences = [];
      const characterUpdates = [];

      // Criar novos personagens
      for (const data of uniqueHighscores) {
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
      for (const data of uniqueHighscores) {
        const characterInfo = characterMap.get(data.name);
        if (!characterInfo) continue;

        const characterId = characterInfo.id;
        let currentStreak = characterInfo.streak || 0;

        // Verificar se já existe um registro para este personagem hoje
        if (!existingDailyCharacterIds.has(characterId)) {
          // CASO 1: Não existe registro de hoje - criar novo
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

          // Create daily experience record com timestamp completo
          newDailyExperiences.push({
            characterId,
            date: currentTimestamp, // Usar o timestamp completo
            value: data.value,
            level: data.level,
          });
        } else {
          // CASO 2: Existe registro de hoje - verificar se a XP aumentou
          const existingDaily = existingDailyMap.get(characterId);

          if (existingDaily && data.value > existingDaily.value) {
            // A XP aumentou, vamos atualizar o registro
            updateDailyExperiences.push({
              characterId,
              oldValue: existingDaily.value,
              newValue: data.value,
              level: data.level,
              oldDate: existingDaily.date,
            });
          }
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

      // Update daily experiences where XP increased
      for (const update of updateDailyExperiences) {
        await this.prismaService.dailyExperience.updateMany({
          where: {
            characterId: update.characterId,
            date: update.oldDate, // Usar a data exata do registro antigo
            value: update.oldValue, // Garantir que só atualizamos se o valor ainda for o mesmo que detectamos
          },
          data: {
            value: update.newValue,
            level: update.level,
            date: currentTimestamp, // Atualizar com o timestamp atual
          },
        });
      }

      Logger.log(
        `Processed world ${world}: ${newCharacters.length} new characters, ${newDailyExperiences.length} new daily experiences, ${updateDailyExperiences.length} updated experiences, ${characterUpdates.length} streak updates`,
      );
    } catch (error) {
      Logger.error(`Failed to process world ${world}: ${error.message}`);
    }
  }

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
