import { Test, TestingModule } from '@nestjs/testing';
import { ComunidadesController } from './comunidades.controller';

describe('ComunidadesController', () => {
  let controller: ComunidadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComunidadesController],
    }).compile();

    controller = module.get<ComunidadesController>(ComunidadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
