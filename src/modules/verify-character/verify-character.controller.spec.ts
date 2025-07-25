import { Test, TestingModule } from '@nestjs/testing';
import { VerifyCharacterController } from './verify-character.controller';
import { VerifyCharacterService } from './verify-character.service';

describe('VerifyCharacterController', () => {
  let controller: VerifyCharacterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifyCharacterController],
      providers: [VerifyCharacterService],
    }).compile();

    controller = module.get<VerifyCharacterController>(
      VerifyCharacterController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
