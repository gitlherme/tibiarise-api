import { PartialType } from '@nestjs/swagger';
import { CreateVerifyCharacterDto } from './create-verify-character.dto';

export class UpdateVerifyCharacterDto extends PartialType(CreateVerifyCharacterDto) {}
