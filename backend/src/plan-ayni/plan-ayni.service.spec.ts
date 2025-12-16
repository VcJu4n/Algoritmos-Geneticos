import { Test, TestingModule } from '@nestjs/testing';
import { PlanAyniService } from './plan-ayni.service';

describe('PlanAyniService', () => {
  let service: PlanAyniService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanAyniService],
    }).compile();

    service = module.get<PlanAyniService>(PlanAyniService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
