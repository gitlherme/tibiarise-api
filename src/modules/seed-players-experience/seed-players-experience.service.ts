import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WorldsService } from '../worlds/worlds.service';
import { Highscores } from './entities/seed-players-experience.entity';
import { supabase } from 'src/lib/supabase.lib';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SeedPlayersExperienceService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly worldsService: WorldsService,
  ) {}

  async fetchHighscorePage(page: number, world: string) {
    const { data } = await this.httpService.axiosRef.get<Highscores>(
      `${this.configService.get<string>('TIBIA_DATA_API_URL')}/highscores/${world}/experience/all/${page}`,
    );
    return data.highscores.highscore_list;
  }

  @Cron('31 23 * * *')
  async seedPlayersExperience() {
    try {
      const { worlds } = await this.worldsService.getAllWorlds();
      const TOTAL_PAGES = 20;
      worlds.forEach(async (world) => {
        let currentPage = 1;
        while (currentPage <= TOTAL_PAGES) {
          const highscorePage = await this.fetchHighscorePage(
            currentPage,
            world,
          );
          highscorePage.forEach(async (character, index) => {
            await setTimeout(async () => {
              let nameToFind = character.name;
              const characterHasSpace = nameToFind.includes(' ');
              if (characterHasSpace) {
                nameToFind = nameToFind.replaceAll(' ', '+');
              }

              const { data: characterExists } = await supabase
                .from('character')
                .select('*')
                .ilike('name', `%${character.name}`);

              if (characterExists?.length === 0) {
                console.warn(
                  `Character ${character.name} not found in database, trying to add...`,
                );

                const {
                  data: createdCharacter,
                  status: createdCharacterStatus,
                } = await supabase
                  .from('character')
                  .insert([
                    {
                      name: character.name,
                    },
                  ])
                  .select();

                if (createdCharacterStatus === 201 && createdCharacter) {
                  console.warn(`Character ${character.name} added to database`);
                }

                if (createdCharacter) {
                  await supabase.from('daily_experience').insert([
                    {
                      character_id: createdCharacter[0].id,
                      value: character.value,
                      date: new Date().toISOString().split('T')[0],
                      level: character.level,
                    },
                  ]);
                }

                return;
              }

              if (characterExists && characterExists.length > 0) {
                console.warn(`Character ${character.name} already in database`);
                const { data: dailyExperienceExists } = await supabase
                  .from('daily_experience')
                  .select('*')
                  .eq('character_id', characterExists[0].id)
                  .eq('date', new Date().toISOString().split('T')[0]);

                if (
                  dailyExperienceExists &&
                  dailyExperienceExists.length === 0
                ) {
                  await supabase.from('daily_experience').insert([
                    {
                      character_id: characterExists[0].id,
                      value: character.value,
                      date: new Date().toISOString().split('T')[0],
                      level: character.level,
                    },
                  ]);
                }
              }
            }, index * 10000);
          });
          currentPage++;
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
}
