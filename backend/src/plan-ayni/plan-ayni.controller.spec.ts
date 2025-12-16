import { Test, TestingModule } from '@nestjs/testing';
import { PlanAyniController } from './plan-ayni.controller';

describe('PlanAyniController', () => {
  let controller: PlanAyniController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanAyniController],
    }).compile();

    controller = module.get<PlanAyniController>(PlanAyniController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
