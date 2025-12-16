import { Controller, Get, Post, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { PlanAyniService } from './plan-ayni.service';

@Controller('plan-ayni')
export class PlanAyniController {
  constructor(private readonly planAyniService: PlanAyniService) {}

  @Post('generar')
  async generar() {
    return this.planAyniService.generarPlan();
  }

  @Get('actual')
  async actual(
    @Query('comunidadId', new DefaultValuePipe(null), ParseIntPipe) comunidadId: number | null,
  ) {
    return this.planAyniService.obtenerPlanActual(comunidadId ?? undefined);
  }
}
