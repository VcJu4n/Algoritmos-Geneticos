import { Test, TestingModule } from '@nestjs/testing';
import { AyudasController } from './ayudas.controller';

describe('AyudasController', () => {
  let controller: AyudasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AyudasController],
    }).compile();

    controller = module.get<AyudasController>(AyudasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
