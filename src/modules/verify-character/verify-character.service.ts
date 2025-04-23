import {
  Body,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateVerifyCharacterDto } from './dto/create-verify-character.dto';
import { PrismaService } from 'src/prisma.service';
import { randomUUID } from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { TibiaDataCharacterEndpoint } from '../character/entities/character.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VerifyCharacterService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(@Body() createVerifyCharacterDto: CreateVerifyCharacterDto) {
    const verification = await this.prismaService.verifyCharacter.create({
      data: {
        characterName: createVerifyCharacterDto.characterName,
        userId: createVerifyCharacterDto.userId,
        verificationCode: randomUUID(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    return {
      code: verification.verificationCode,
    };
  }

  async findOne(id: string) {
    console.log('entrou aqui', id);
    const verification = await this.prismaService.verifyCharacter.findFirst({
      where: {
        verificationCode: id,
      },
    });

    return verification;
  }

  async update(id: string) {
    const verification = await this.findOne(id);
    console.log(verification);
    const { data } =
      await this.httpService.axiosRef.get<TibiaDataCharacterEndpoint>(
        `${this.configService.get<string>('TIBIA_DATA_API_URL')}/character/${verification.characterName}`,
      );

    const comment = data.character.character.comment;
    const commentHasCode = comment.toLowerCase().includes(id);

    if (!commentHasCode) {
      Logger.error(`Comment does not contain verification code: ${comment}`);
      throw new UnauthorizedException(
        'Comment does not contain verification code',
      );
    }

    await this.prismaService.character.update({
      where: {
        name: verification.characterName,
      },
      data: {
        verified: true,
        userId: verification.userId,
      },
    });

    await this.remove(id);

    return { message: 'Verification code accepted. Character verified.' };
  }

  async remove(id: string) {
    await this.prismaService.verifyCharacter.delete({
      where: {
        id,
      },
    });
  }
}
