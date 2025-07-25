import { Test, TestingModule } from '@nestjs/testing';
import { ProfitManagerService } from './profit-manager.service';

describe('ProfitManagerService', () => {
  let service: ProfitManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfitManagerService],
    }).compile();

    service = module.get<ProfitManagerService>(ProfitManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
