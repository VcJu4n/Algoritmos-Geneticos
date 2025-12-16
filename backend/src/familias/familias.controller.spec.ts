import { Test, TestingModule } from '@nestjs/testing';
import { FamiliasController } from './familias.controller';

describe('FamiliasController', () => {
  let controller: FamiliasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamiliasController],
    }).compile();

    controller = module.get<FamiliasController>(FamiliasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
