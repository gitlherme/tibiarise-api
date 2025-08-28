import { Injectable } from '@nestjs/common';
import { CreatePartyManagerDto } from './dto/create-party-manager.dto';
import { UpdatePartyManagerDto } from './dto/update-party-manager.dto';

@Injectable()
export class PartyManagerService {
  create(createPartyManagerDto: CreatePartyManagerDto) {
    return 'This action adds a new partyManager';
  }

  findAll() {
    return `This action returns all partyManager`;
  }

  findOne(id: number) {
    return `This action returns a #${id} partyManager`;
  }

  update(id: number, updatePartyManagerDto: UpdatePartyManagerDto) {
    return `This action updates a #${id} partyManager`;
  }

  remove(id: number) {
    return `This action removes a #${id} partyManager`;
  }
}
