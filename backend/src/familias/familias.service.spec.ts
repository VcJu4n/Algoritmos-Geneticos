import { Test, TestingModule } from '@nestjs/testing';
import { FamiliasService } from './familias.service';

describe('FamiliasService', () => {
  let service: FamiliasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamiliasService],
    }).compile();

    service = module.get<FamiliasService>(FamiliasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
