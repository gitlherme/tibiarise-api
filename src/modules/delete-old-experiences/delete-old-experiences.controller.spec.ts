import { Test, TestingModule } from '@nestjs/testing';
import { DeleteOldExperiencesController } from './delete-old-experiences.controller';
import { DeleteOldExperiencesService } from './delete-old-experiences.service';

describe('DeleteOldExperiencesController', () => {
  let controller: DeleteOldExperiencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeleteOldExperiencesController],
      providers: [DeleteOldExperiencesService],
    }).compile();

    controller = module.get<DeleteOldExperiencesController>(DeleteOldExperiencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
