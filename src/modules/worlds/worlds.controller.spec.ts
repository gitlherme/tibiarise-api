import { Test, TestingModule } from '@nestjs/testing';
import { WorldsController } from './worlds.controller';

describe('WorldsController', () => {
  let controller: WorldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorldsController],
    }).compile();

    controller = module.get<WorldsController>(WorldsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
