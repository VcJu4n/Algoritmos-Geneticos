import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlanAyniService } from './plan-ayni.service';
import { PlanAyniController } from './plan-ayni.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AyudasModule } from '../ayudas/ayudas.module';
import { AyudasService } from '../ayudas/ayudas.service';
import { PlanAyniAutoRunner } from './plan-ayni.autorunner';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    AyudasModule,
  ],
  controllers: [PlanAyniController],
  providers: [PlanAyniService, AyudasService, PlanAyniAutoRunner],
})
export class PlanAyniModule {}
