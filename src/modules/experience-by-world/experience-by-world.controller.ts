import { Controller, Get, Param } from '@nestjs/common';
import { ExperienceByWorldService } from './experience-by-world.service';

@Controller('experience-by-world')
export class ExperienceByWorldController {
  constructor(
    private readonly experienceByWorldService: ExperienceByWorldService,
  ) {}

  @Get('/:world/:filter')
  getExperienceByWorld(
    @Param('world') world: string,
    @Param('filter') filter: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.experienceByWorldService.getExperienceByWorld(world, filter);
  }
}
