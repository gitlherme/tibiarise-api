import { Injectable, Logger, Param } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ExperienceByWorldService {
  constructor(private readonly prismaService: PrismaService) {}

  async getExperienceByWorld(
    @Param('world') world: string,
    @Param('filter') filter: 'daily' | 'weekly' | 'monthly',
  ) {
    const filterDates = {
      daily: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      weekly: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      monthly: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    };

    const filterDate = filterDates[filter];

    const data = await this.prismaService.dailyExperience.findMany({
      where: {
        character: {
          world: {
            mode: 'insensitive',
            equals: world,
          },
        },
        date: {
          gte: filterDate,
        },
      },
      include: {
        character: true,
      },

      orderBy: {
        value: 'desc',
      },
    });

    const players = data.map((experience) => {
      return {
        name: experience.character.name,
        value: experience.value,
      };
    });

    const totalByPlayer: { name: string; value: number }[] = [];

    players.map((player) => {
      const playerExists = totalByPlayer.find((p) => p.name === player.name);
      if (playerExists) {
        playerExists.value += Number(player.value.toString());
        totalByPlayer[totalByPlayer.indexOf(playerExists)].value =
          playerExists.value;

        return;
      }

      totalByPlayer.push({
        name: player.name,
        value: Number(player.value.toString()),
      });
    });

    return totalByPlayer;
  }
}
