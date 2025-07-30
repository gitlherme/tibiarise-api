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
    const verification = await this.prismaService.verifyCharacter.findFirst({
      where: {
        verificationCode: id,
      },
    });

    return verification;
  }

  async update(id: string) {
    const verification = await this.findOne(id);
    const { data } =
      await this.httpService.axiosRef.get<TibiaDataCharacterEndpoint>(
        `${this.configService.get<string>('TIBIA_DATA_API_URL')}/character/${verification.characterName}`,
      );

    const comment = data.character.character.comment;
    const commentHasCode =
      comment !== undefined && comment.toLowerCase().includes(id);

    if (!commentHasCode) {
      Logger.error(`Comment does not contain verification code
        - Current comment: ${comment}
        - Verification code: ${id}  
      `);
      throw new UnauthorizedException(
        'Comment does not contain verification code',
      );
    }

    const characterExists = await this.prismaService.character.findFirst({
      where: {
        name: {
          equals: verification.characterName,
          mode: 'insensitive',
        },
      },
    });

    if (!characterExists) {
      Logger.error(`Character does not exist: ${verification.characterName}`);
      throw new UnauthorizedException('Character does not exist');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        email: verification.userId,
      },
    });

    if (!user) {
      await this.prismaService.user.create({
        data: {
          email: verification.userId,
        },
      });
    }

    await this.prismaService.character.update({
      where: {
        name: characterExists.name,
      },
      data: {
        verified: true,
        verifiedAt: new Date(),
        userId: user.id,
      },
    });

    await this.remove(verification.id);

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
