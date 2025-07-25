import { DailyExperience } from '@prisma/client';
import { TibiaDataCharacter } from '../entities/character.entity';

export class CharacterDataMapper {
  static output(
    character: TibiaDataCharacter,
    experienceTable: DailyExperience[],
    isVerified: boolean = false,
    verifiedAt: Date | null = null,
  ) {
    const experienceTableOutput = experienceTable.map((day, index) => {
      if (index !== 0 && experienceTable[index - 1].value! !== day.value!) {
        return {
          experience:
            Number(day.value.toString()) -
            Number(experienceTable[index - 1].value!.toString()),
          totalExperience: Number(day.value.toString()),
          date: day.date,
          level: day.level,
        };
      }

      return {
        experience: 0,
        totalExperience: Number(day.value.toString()),
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
        isVerified,
        verifiedAt,
        guild: {
          name: character.character.guild.name,
          rank: character.character.guild.rank,
        },
      },
      experienceTable: experienceTableOutput.reverse(),
    };
  }
}
