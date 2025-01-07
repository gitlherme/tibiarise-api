import { Controller, Get, Param } from '@nestjs/common';
import { CharacterService } from './character.service';

@Controller('character')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.characterService.findOne(name);
  }
}
