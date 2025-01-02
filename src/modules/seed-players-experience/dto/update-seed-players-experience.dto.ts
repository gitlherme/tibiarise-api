import { PartialType } from '@nestjs/mapped-types';
import { CreateSeedPlayersExperienceDto } from './create-seed-players-experience.dto';

export class UpdateSeedPlayersExperienceDto extends PartialType(
  CreateSeedPlayersExperienceDto,
) {}
