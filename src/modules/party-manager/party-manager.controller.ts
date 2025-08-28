import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PartyManagerService } from './party-manager.service';
import { CreatePartyManagerDto } from './dto/create-party-manager.dto';
import { UpdatePartyManagerDto } from './dto/update-party-manager.dto';

@Controller('party-manager')
export class PartyManagerController {
  constructor(private readonly partyManagerService: PartyManagerService) {}

  @Post()
  create(@Body() createPartyManagerDto: CreatePartyManagerDto) {
    return this.partyManagerService.create(createPartyManagerDto);
  }

  @Get()
  findAll() {
    return this.partyManagerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partyManagerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartyManagerDto: UpdatePartyManagerDto) {
    return this.partyManagerService.update(+id, updatePartyManagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partyManagerService.remove(+id);
  }
}
