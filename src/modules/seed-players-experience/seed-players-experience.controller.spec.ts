import { Test, TestingModule } from '@nestjs/testing';
import { SeedPlayersExperienceController } from './seed-players-experience.controller';
import { SeedPlayersExperienceService } from './seed-players-experience.service';

describe('SeedPlayersExperienceController', () => {
  let controller: SeedPlayersExperienceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeedPlayersExperienceController],
      providers: [SeedPlayersExperienceService],
    }).compile();

    controller = module.get<SeedPlayersExperienceController>(
      SeedPlayersExperienceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
