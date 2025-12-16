import { Test, TestingModule } from '@nestjs/testing';
import { AyudasService } from './ayudas.service';

describe('AyudasService', () => {
  let service: AyudasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AyudasService],
    }).compile();

    service = module.get<AyudasService>(AyudasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
