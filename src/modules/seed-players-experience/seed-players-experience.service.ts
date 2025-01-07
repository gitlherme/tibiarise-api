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
import { Character } from '@prisma/client';

@Injectable()
export class SeedPlayersExperienceService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly worldsService: WorldsService,
    private readonly prismaService: PrismaService,
  ) {}

  async fetchHighscorePage(page: number, world: string) {
    const { data } = await this.httpService.axiosRef.get<Highscores>(
      `${this.configService.get<string>('TIBIA_DATA_API_URL')}/highscores/${world}/experience/all/${page}`,
    );
    return data.highscores.highscore_list;
  }

  async createDailyExperience(character: Character, data: HighscoreList) {
    await this.prismaService.dailyExperience.upsert({
      where: {
        characterId: character.id,
        date: new Date().toISOString().split('T')[0],
      },
      create: {
        characterId: character.id,
        date: new Date().toISOString().split('T')[0],
        value: data.value,
        level: data.level,
        createdAt: new Date(),
      },
      update: {
        value: data.value,
        level: data.level,
      },
    });

    Logger.log(`Daily experience created for ${character.name}`);
  }

  @Cron('0 */3 * * *')
  async seedPlayersExperience() {
    try {
      const { worlds } = await this.worldsService.getAllWorlds();
      const TOTAL_PAGES = 20;
      worlds.map(async (world, index) => {
        await setTimeout(async () => {
          let currentPage = 1;
          while (currentPage <= TOTAL_PAGES) {
            const highscorePage = await this.fetchHighscorePage(
              currentPage,
              world,
            );
            highscorePage.map(async (data) => {
              try {
                const characterExists =
                  await this.prismaService.character.findFirst({
                    where: {
                      name: data.name,
                    },
                  });

                if (!characterExists) {
                  Logger.log(`Character ${data.name} not found. Creating...`);
                  const characterData =
                    await this.prismaService.character.create({
                      data: {
                        name: data.name,
                        world: world,
                        level: data.level,
                        experience: data.value,
                        createdAt: new Date(),
                      },
                    });

                  await this.createDailyExperience(characterData, data);
                  return;
                }

                const checkIfCharacterDailyExists =
                  await this.prismaService.dailyExperience.findFirst({
                    where: {
                      characterId: characterExists.id,
                      date: new Date().toISOString().split('T')[0],
                    },
                  });

                if (!checkIfCharacterDailyExists) {
                  Logger.log(
                    `Daily experience not found for ${data.name}. Creating...`,
                  );
                  this.createDailyExperience(characterExists, data);
                }
              } catch (error) {
                console.error(error);
              }
            });
            currentPage++;
          }
        }, index * 50000);
      });
    } catch (error) {
      console.error(error);
    }
  }
}
