import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ExperienceByWorldService } from './experience-by-world.service';

@ApiTags('experience-by-world')
@Controller('experience-by-world')
export class ExperienceByWorldController {
  constructor(
    private readonly experienceByWorldService: ExperienceByWorldService,
  ) {}

  @Get('/:world')
  @ApiOperation({ summary: 'Get top experience gainers for all time periods' })
  @ApiParam({ name: 'world', description: 'World name' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit of results per period (default: 50)',
  })
  async getTopGainers(
    @Param('world') world: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.experienceByWorldService.getTopGainers(world, limit);
  }

  @Get('/:world/:period')
  @ApiOperation({
    summary: 'Get top experience gainers for a specific time period',
  })
  @ApiParam({ name: 'world', description: 'World name' })
  @ApiParam({
    name: 'period',
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Time period',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit of results (default: 100)',
  })
  async getTopGainersByPeriod(
    @Param('world') world: string,
    @Param('period') period: 'daily' | 'weekly' | 'monthly',
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.experienceByWorldService.getTopGainersByPeriod(
      world,
      period,
      limit,
    );
  }
}
