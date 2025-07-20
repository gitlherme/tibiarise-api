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
    const { huntDate, profit, preyCardsUsed, boostsValue, characterId } =
      createProfitManagerDto;

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

    return this.prismaService.profitEntry.create({
      data: {
        huntDate,
        profit,
        preyCardsUsed: preyCardsUsed * Number(tibiaCoinValue),
        boostsValue: boostsValue * Number(tibiaCoinValue),
        tibiaCoinValue,
        netProfit:
          Number(profit) -
          (preyCardsUsed * Number(tibiaCoinValue) +
            boostsValue * Number(tibiaCoinValue)),
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

    Logger.log(`Tibia Coin values fetched: ${JSON.stringify(tibiaCoinValues)}`);

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
