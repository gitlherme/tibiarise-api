import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { VerifyCharacterService } from './verify-character.service';
import { CreateVerifyCharacterDto } from './dto/create-verify-character.dto';

@Controller('verify-character')
export class VerifyCharacterController {
  constructor(
    private readonly verifyCharacterService: VerifyCharacterService,
  ) {}

  @Post()
  create(@Body() createVerifyCharacterDto: CreateVerifyCharacterDto) {
    return this.verifyCharacterService.create(createVerifyCharacterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.verifyCharacterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.verifyCharacterService.update(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.verifyCharacterService.remove(id);
  }
}
