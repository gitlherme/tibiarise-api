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
  private readonly CONCURRENT_WORLDS = 5; // Aumentado para melhor performance

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
        { timeout: 10000 }, // Adicionado timeout para evitar promessas pendentes
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

  private async processWorld(world: string): Promise<void> {
    const startTime = Date.now();
    try {
      Logger.log(`Starting to process world: ${world}`);

      // Fetch all pages for this world with better concurrency
      const fetchPromises = Array.from({ length: this.TOTAL_PAGES }, (_, i) =>
        this.fetchHighscorePage(i + 1, world),
      );

      // Use Promise.allSettled para garantir que uma falha não impeça o processamento dos outros
      const results = await Promise.allSettled(fetchPromises);
      const allHighscores: HighscoreList[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allHighscores.push(...result.value);
        } else {
          Logger.warn(
            `Failed to fetch page ${index + 1} for world ${world}: ${result.reason}`,
          );
        }
      });

      if (allHighscores.length === 0) {
        Logger.warn(`No highscores data found for world ${world}`);
        return;
      }

      // Remover duplicatas com melhor performance usando Map
      const uniqueHighscores = Array.from(
        new Map(allHighscores.map((item) => [item.name, item])).values(),
      );

      // Pegar a data atual (apenas a parte da data, sem hora)
      const today = new Date();
      const todayDateOnly = this.getDateOnly(today);

      // Determinar a data de ontem
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateOnly = this.getDateOnly(yesterday);

      // Verificar se já processamos este mundo hoje
      const todayRecordsCount = await this.prismaService.dailyExperience.count({
        where: {
          character: { world },
          date: { startsWith: todayDateOnly },
        },
      });

      if (todayRecordsCount > 0) {
        Logger.log(`World ${world} already processed today, skipping`);
        return;
      }

      // Buscar todos os personagens existentes
      const existingCharacters = await this.prismaService.character.findMany({
        where: { world },
        select: { id: true, name: true, streak: true, experience: true },
      });

      // Criar mapas para acesso rápido
      const characterByName = new Map(
        existingCharacters.map((c) => [c.name, c]),
      );

      // Buscar experiências de ontem para cálculo de streak
      const yesterdayExperiences =
        await this.prismaService.dailyExperience.findMany({
          where: {
            character: { world },
            date: { startsWith: yesterdayDateOnly },
          },
          select: { characterId: true, value: true },
        });

      const yesterdayExpMap = new Map(
        yesterdayExperiences.map((exp) => [exp.characterId, exp.value]),
      );

      // Preparar operações em lote
      const newCharacters = [];
      const newDailyExperiences = [];
      const characterUpdates = [];

      // Timestamp para registros
      const currentTimestamp = new Date().toISOString();

      // Processar os personagens
      for (const data of uniqueHighscores) {
        const existingChar = characterByName.get(data.name);

        if (!existingChar) {
          // É um personagem novo
          const newChar = {
            name: data.name,
            world,
            level: data.level,
            experience: data.value,
            streak: 1, // Novo personagem começa com streak 1
            createdAt: new Date(),
          };
          newCharacters.push(newChar);
        } else {
          // É um personagem existente
          const characterId = existingChar.id;
          let currentStreak = existingChar.streak || 0;
          let shouldUpdateStreak = false;

          // Verificar se teve ganho de XP ontem para o cálculo do streak
          const yesterdayExp = yesterdayExpMap.get(characterId);
          const hadExpYesterday = yesterdayExp !== undefined;

          // Verificar se experiência aumentou desde o último registro
          const expIncreased = data.value > existingChar.experience;

          // Atualizar streak
          if (hadExpYesterday) {
            currentStreak += 1; // Incrementar streak se teve experiência ontem
            shouldUpdateStreak = true;
          } else if (expIncreased) {
            // Se não teve exp ontem mas tem hoje, resetar para 1
            currentStreak = 1;
            shouldUpdateStreak = true;
          }

          // Atualizar caractere somente se necessário
          if (shouldUpdateStreak || expIncreased) {
            characterUpdates.push({
              id: characterId,
              updates: {
                streak: currentStreak,
                ...(expIncreased && {
                  experience: data.value,
                  level: data.level,
                }),
              },
            });
          }

          // Sempre criar um novo registro diário
          newDailyExperiences.push({
            characterId,
            date: currentTimestamp,
            value: data.value,
            level: data.level,
          });
        }
      }

      // Processar em lotes para melhor performance

      // 1. Criar novos personagens
      if (newCharacters.length > 0) {
        const characterChunks = chunk(newCharacters, this.BATCH_SIZE);
        for (const batch of characterChunks) {
          await this.prismaService.character.createMany({
            data: batch,
            skipDuplicates: true,
          });
        }

        // Buscar IDs dos novos personagens
        const newCharacterNames = newCharacters.map((c) => c.name);
        const createdCharacters = await this.prismaService.character.findMany({
          where: {
            name: { in: newCharacterNames },
            world,
          },
          select: { id: true, name: true },
        });

        // Adicionar registros diários para os novos personagens
        const newCharacterDailies = createdCharacters.map((c) => ({
          characterId: c.id,
          date: currentTimestamp,
          value:
            newCharacters.find((nc) => nc.name === c.name)?.experience || 0,
          level: newCharacters.find((nc) => nc.name === c.name)?.level || 1,
        }));

        newDailyExperiences.push(...newCharacterDailies);
      }

      // 2. Atualizar personagens existentes em paralelo
      if (characterUpdates.length > 0) {
        const updateChunks = chunk(
          characterUpdates,
          Math.min(100, Math.ceil(characterUpdates.length / 10)),
        );
        await Promise.all(
          updateChunks.map(async (chunk) => {
            await Promise.all(
              chunk.map((update) =>
                this.prismaService.character.update({
                  where: { id: update.id },
                  data: update.updates,
                }),
              ),
            );
          }),
        );
      }

      // 3. Criar registros diários em lotes
      if (newDailyExperiences.length > 0) {
        const dailyChunks = chunk(newDailyExperiences, this.BATCH_SIZE);
        for (const batch of dailyChunks) {
          await this.prismaService.dailyExperience.createMany({
            data: batch,
            skipDuplicates: true,
          });
        }
      }

      const executionTime = (Date.now() - startTime) / 1000;
      Logger.log(
        `Processed world ${world} in ${executionTime.toFixed(2)}s: ${newCharacters.length} new characters, ${newDailyExperiences.length} daily experiences, ${characterUpdates.length} character updates`,
      );
    } catch (error) {
      Logger.error(
        `Failed to process world ${world}: ${error.message}`,
        error.stack,
      );
    }
  }

  async seedPlayersExperience() {
    try {
      Logger.log('Starting seedPlayersExperience job');
      const startTime = Date.now();

      const { worlds } = await this.worldsService.getAllWorlds();
      const worldChunks = chunk(worlds, this.CONCURRENT_WORLDS);

      for (const worldBatch of worldChunks) {
        await Promise.all(worldBatch.map((world) => this.processWorld(world)));
      }

      const executionTime = (Date.now() - startTime) / 1000;
      Logger.log(
        `SeedPlayersExperience completed in ${executionTime.toFixed(2)}s`,
      );
    } catch (error) {
      Logger.error('Failed to seed players experience:', error);
    }
  }
}
