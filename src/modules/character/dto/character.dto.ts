import { DailyExperience } from '@prisma/client';
import { TibiaDataCharacter } from '../entities/character.entity';

export class CharacterDataMapper {
  static output(
    character: TibiaDataCharacter,
    experienceTable: DailyExperience[],
  ) {
    const experienceTableOutput = experienceTable.map((day) => {
      return {
        value: day.value.toString(),
        date: day.date,
        level: day.level,
      };
    });

    return {
      character: {
        name: character.character.name,
        level: character.character.level,
        world: character.character.world,
        vocation: character.character.vocation,
        sex: character.character.sex,
        guild: {
          name: character.character.guild.name,
          rank: character.character.guild.rank,
        },
      },
      experienceTable: experienceTableOutput,
    };
  }
}
