import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worlds } from './entities/worlds.entity';

@Injectable()
export class WorldsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAllWorlds() {
    const { data } = await this.httpService.axiosRef.get<Worlds>(
      `${this.configService.get<string>('TIBIA_DATA_API_URL')}/worlds`,
    );

    const worlds = data.worlds.regular_worlds.map((world) => world.name);

    return { worlds };
  }
}
