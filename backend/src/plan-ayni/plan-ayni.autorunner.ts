import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PlanAyniService } from './plan-ayni.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlanAyniAutoRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlanAyniAutoRunner.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly planAyni: PlanAyniService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const enabled = (process.env.AUTO_PLAN_ENABLED ?? 'false').toLowerCase() === 'true';
    if (!enabled) return;
    const intervalMs = Number(process.env.AUTO_PLAN_INTERVAL_MS ?? 600000); // 10 min
    const minPendientes = Number(process.env.AUTO_PLAN_MIN_PENDIENTES ?? 1);
    if (intervalMs <= 0) return;
    this.logger.log(
      `Auto-plan habilitado: cada ${intervalMs}ms si hay >= ${minPendientes} solicitudes pendientes`,
    );
    this.timer = setInterval(() => {
      this.tick(minPendientes).catch((err) =>
        this.logger.error(`Auto-plan fallo: ${err?.message ?? err}`),
      );
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(minPendientes: number) {
    if (this.running) return;
    this.running = true;
    try {
      const pendientes = await this.prisma.solicitudAyuda.count({
        where: { estado: 'PENDIENTE' },
      });
      if (pendientes < minPendientes) return;
      await this.planAyni.generarPlan();
    } finally {
      this.running = false;
    }
  }
}
