import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProfitManagerService } from './profit-manager.service';
import { CreateProfitManagerDto } from './dto/create-profit-manager.dto';
import { UpdateProfitManagerDto } from './dto/update-profit-manager.dto';

@Controller('profit-manager')
export class ProfitManagerController {
  constructor(private readonly profitManagerService: ProfitManagerService) {}

  @Post()
  create(@Body() createProfitManagerDto: CreateProfitManagerDto) {
    return this.profitManagerService.create(createProfitManagerDto);
  }

  @Get(':characterId')
  findAll(@Param('characterId') characterId: string) {
    return this.profitManagerService.findAll(characterId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profitManagerService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProfitManagerDto: UpdateProfitManagerDto,
  ) {
    return this.profitManagerService.update(id, updateProfitManagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profitManagerService.remove(id);
  }
}
