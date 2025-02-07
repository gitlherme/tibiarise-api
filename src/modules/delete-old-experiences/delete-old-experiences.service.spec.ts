import { Test, TestingModule } from '@nestjs/testing';
import { DeleteOldExperiencesService } from './delete-old-experiences.service';

describe('DeleteOldExperiencesService', () => {
  let service: DeleteOldExperiencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteOldExperiencesService],
    }).compile();

    service = module.get<DeleteOldExperiencesService>(DeleteOldExperiencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
