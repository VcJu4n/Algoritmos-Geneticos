import { Module } from '@nestjs/common';
import { FamiliasController } from './familias.controller';
import { FamiliasService } from './familias.service';
import { FamiliaGuard } from '../auth/familia.guard';

@Module({
  controllers: [FamiliasController],
  providers: [FamiliasService, FamiliaGuard],
})
export class FamiliasModule {}
