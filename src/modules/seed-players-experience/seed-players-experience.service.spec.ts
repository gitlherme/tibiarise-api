import { Test, TestingModule } from '@nestjs/testing';
import { SeedPlayersExperienceService } from './seed-players-experience.service';

describe('SeedPlayersExperienceService', () => {
  let service: SeedPlayersExperienceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeedPlayersExperienceService],
    }).compile();

    service = module.get<SeedPlayersExperienceService>(
      SeedPlayersExperienceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
