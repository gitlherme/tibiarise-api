import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceByWorldService } from './experience-by-world.service';

describe('ExperienceByWorldService', () => {
  let service: ExperienceByWorldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExperienceByWorldService],
    }).compile();

    service = module.get<ExperienceByWorldService>(ExperienceByWorldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
