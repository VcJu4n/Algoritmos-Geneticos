import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ComunidadesModule } from './comunidades/comunidades.module';
import { FamiliasModule } from './familias/familias.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { AyudasModule } from './ayudas/ayudas.module';
import { PlanAyniModule } from './plan-ayni/plan-ayni.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ComunidadesModule,
    FamiliasModule,
    SolicitudesModule,
    AyudasModule,
    PlanAyniModule,
    QueueModule,
    JobsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
