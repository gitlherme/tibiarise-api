import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { TibiaDataCharacterEndpoint } from './entities/character.entity';
import { CharacterDataMapper } from './dto/character.dto';

@Injectable()
export class CharacterService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async findOne(name: string) {
    Logger.log(`Finding character ${name}`);
    try {
      const character = await this.prismaService.character.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
        include: {
          profitHistory: false,
        },
      });

      if (!character) {
        return Response.json(
          { message: 'Character not found' },
          { status: 404 },
        );
      }

      const characterDailyExperienceTable =
        await this.prismaService.dailyExperience.findMany({
          where: {
            characterId: character.id,
          },
          orderBy: {
            date: 'asc',
          },
        });

      if (!characterDailyExperienceTable) {
        Logger.error(`ERROR: No daily experience found for ${name}`);
      }

      const { data: characterData } =
        await this.httpService.axiosRef.get<TibiaDataCharacterEndpoint>(
          `${this.configService.get<string>('TIBIA_DATA_API_URL')}/character/${name}`,
        );

      const isVerified = character.verified;
      if (characterData && characterDailyExperienceTable) {
        return CharacterDataMapper.output(
          characterData.character,
          characterDailyExperienceTable,
          isVerified,
        );
      }

      return {};
    } catch (error) {
      Logger.error(error);
    }
  }
}
