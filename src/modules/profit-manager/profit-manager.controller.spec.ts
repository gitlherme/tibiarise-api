import { Test, TestingModule } from '@nestjs/testing';
import { ProfitManagerController } from './profit-manager.controller';
import { ProfitManagerService } from './profit-manager.service';

describe('ProfitManagerController', () => {
  let controller: ProfitManagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfitManagerController],
      providers: [ProfitManagerService],
    }).compile();

    controller = module.get<ProfitManagerController>(ProfitManagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
