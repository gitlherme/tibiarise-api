import { Controller } from '@nestjs/common';
import { SeedPlayersExperienceService } from './seed-players-experience.service';

@Controller('seed-players-experience')
export class SeedPlayersExperienceController {
  constructor(
    private readonly seedPlayersExperienceService: SeedPlayersExperienceService,
  ) {}

  async seedPlayersExperience() {
    await this.seedPlayersExperienceService.seedPlayersExperience();
  }
}
