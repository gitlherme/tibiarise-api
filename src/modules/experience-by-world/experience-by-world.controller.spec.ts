import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceByWorldController } from './experience-by-world.controller';
import { ExperienceByWorldService } from './experience-by-world.service';

describe('ExperienceByWorldController', () => {
  let controller: ExperienceByWorldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperienceByWorldController],
      providers: [ExperienceByWorldService],
    }).compile();

    controller = module.get<ExperienceByWorldController>(ExperienceByWorldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
