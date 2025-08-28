import { PartialType } from '@nestjs/swagger';
import { CreatePartyManagerDto } from './create-party-manager.dto';

export class UpdatePartyManagerDto extends PartialType(CreatePartyManagerDto) {}
