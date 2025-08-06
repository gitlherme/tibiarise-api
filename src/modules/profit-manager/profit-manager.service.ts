import { Injectable, Logger } from '@nestjs/common';
import { CreateProfitManagerDto } from './dto/create-profit-manager.dto';
import { UpdateProfitManagerDto } from './dto/update-profit-manager.dto';
import { PrismaService } from 'src/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prices } from './entities/profit-manager.entity';

@Injectable()
export class ProfitManagerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  async create(createProfitManagerDto: CreateProfitManagerDto) {
    const {
      huntName,
      huntDate,
      huntDuration,
      profit,
      preyCardsUsed,
      boostsValue,
      characterId,
    } = createProfitManagerDto;

    const tibiaCoinValue = await this.getTibiaCoinValue(
      createProfitManagerDto.world,
    );

    const character = await this.prismaService.character.findUnique({
      where: { id: characterId, userId: createProfitManagerDto.userId },
    });

    if (!character) {
      throw new Error(
        `Character with ID ${characterId} for user ${createProfitManagerDto.userId} not found`,
      );
    }

    const totalPrey = preyCardsUsed * (Number(tibiaCoinValue) * 10);
    const totalBoosts = boostsValue * Number(tibiaCoinValue);
    return this.prismaService.profitEntry.create({
      data: {
        huntName,
        huntDate,
        profit,
        huntDuration,
        preyCardsUsed: totalPrey,
        boostsValue: totalBoosts,
        tibiaCoinValue,
        netProfit: Number(profit) - (totalPrey + totalBoosts),
        character: {
          connect: { id: characterId },
        },
      },
    });
  }

  async getTibiaCoinValue(world: string) {
    Logger.log(`Fetching Tibia Coin values for world: ${world}`);
    const { data: tibiaCoinValues } =
      await this.httpService.axiosRef.get<Prices>(
        'https://tibiatrade.gg/api/tibiaCoinPrices',
      );

    const worldPrices = tibiaCoinValues.prices.find(
      (price) => price.world_name.toLowerCase() === world.toLowerCase(),
    );

    return worldPrices ? worldPrices.sell_average_price : null;
  }

  findAll(characterId: string) {
    return this.prismaService.profitEntry.findMany({
      where: {
        character: {
          id: characterId,
        },
      },
      orderBy: {
        huntDate: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prismaService.profitEntry.findUnique({
      where: { id },
    });
  }

  update(id: string, updateProfitManagerDto: UpdateProfitManagerDto) {
    return this.prismaService.profitEntry.update({
      where: { id },
      data: updateProfitManagerDto,
    });
  }

  remove(id: string) {
    return this.prismaService.profitEntry.delete({
      where: { id },
    });
  }
}
