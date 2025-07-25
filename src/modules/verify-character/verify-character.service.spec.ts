import { Test, TestingModule } from '@nestjs/testing';
import { VerifyCharacterService } from './verify-character.service';

describe('VerifyCharacterService', () => {
  let service: VerifyCharacterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyCharacterService],
    }).compile();

    service = module.get<VerifyCharacterService>(VerifyCharacterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
