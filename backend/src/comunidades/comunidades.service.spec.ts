import { Test, TestingModule } from '@nestjs/testing';
import { ComunidadesService } from './comunidades.service';

describe('ComunidadesService', () => {
  let service: ComunidadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComunidadesService],
    }).compile();

    service = module.get<ComunidadesService>(ComunidadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
