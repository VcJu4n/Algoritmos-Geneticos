import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAyudaDto } from './dto/create-ayuda.dto';
import { CreateAyudaBatchDto } from './dto/create-ayuda-batch.dto';
import { UpdateEstadoAyudaDto } from './dto/update-estado-ayuda.dto';
import { AyudaAsignada } from '@prisma/client';

@Injectable()
export class AyudasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AyudasService.name);
  private autoCompleteTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const enabled = (process.env.AUTO_COMPLETE_AYUDAS_ENABLED ?? 'false').toLowerCase() === 'true';
    if (!enabled) return;
    const intervalMs = Number(process.env.AUTO_COMPLETE_AYUDAS_INTERVAL_MS ?? 300000); // 5 min
    if (intervalMs > 0) {
      this.logger.log(`Auto-completado de ayudas habilitado cada ${intervalMs}ms`);
      this.autoCompleteTimer = setInterval(() => {
        this.completarVencidas().catch((err) =>
          this.logger.error(`Auto-completar ayudas falló: ${err?.message ?? err}`),
        );
      }, intervalMs);
    }
  }

  onModuleDestroy() {
    if (this.autoCompleteTimer) {
      clearInterval(this.autoCompleteTimer);
    }
  }

  async create(data: CreateAyudaDto) {
    await this.validarMismaComunidad(data.origenId, data.destinoId);
    const estado = (data.estado as any) ?? 'PROGRAMADO';
    const fecha = data.fecha ?? new Date();
    const ayuda = await this.prisma.ayudaAsignada.create({
      data: {
        ...data,
        fecha,
        estado,
      },
    });
    if (estado === 'REALIZADO') {
      await this.aplicarHoras(ayuda);
    }
    return this.findOne(ayuda.id);
  }

  // crear muchas ayudas de una sola vez (desde el AG)
  async createBatch(batch: CreateAyudaBatchDto) {
    const ids = Array.from(new Set(batch.ayudas.flatMap((a) => [a.origenId, a.destinoId])));
    const familias = await this.prisma.familia.findMany({
      where: { id: { in: ids } },
      select: { id: true, comunidadId: true },
    });
    const comunidadPorFamilia = new Map(familias.map((f) => [f.id, f.comunidadId]));

    for (const a of batch.ayudas) {
      const cOrigen = comunidadPorFamilia.get(a.origenId);
      const cDestino = comunidadPorFamilia.get(a.destinoId);
      if (!cOrigen || !cDestino) {
        throw new BadRequestException('Familia origen o destino no encontrada');
      }
      if (cOrigen !== cDestino) {
        throw new BadRequestException('Las familias deben pertenecer a la misma comunidad');
      }
    }

    const creadas: AyudaAsignada[] = [];
    for (const a of batch.ayudas) {
      const estado = (a.estado as any) ?? 'PROGRAMADO';
      const ayuda = await this.prisma.ayudaAsignada.create({
        data: {
          ...a,
          estado,
        },
      });
      creadas.push(ayuda);
      if (estado === 'REALIZADO') {
        await this.aplicarHoras(ayuda);
      }
    }

    return this.findAll();
  }

  // Lista ayudas, con filtros opcionales:
  // familiaId, rol (origen/destino), estado
  findAll(params?: {
    familiaId?: number;
    rol?: 'origen' | 'destino' | 'ambos';
    estado?: string;
    comunidadId?: number;
  }) {
    const { familiaId, rol = 'ambos', estado, comunidadId } = params || {};

    const andFilters: any[] = [];

    if (estado) {
      andFilters.push({ estado });
    }

    if (comunidadId) {
      // Todas las ayudas son intra-comunidad por validación; basta filtrar por origen.
      andFilters.push({ origen: { comunidadId } });
    }

    if (familiaId) {
      if (rol === 'origen') {
        andFilters.push({ origenId: familiaId });
      } else if (rol === 'destino') {
        andFilters.push({ destinoId: familiaId });
      } else {
        andFilters.push({ OR: [{ origenId: familiaId }, { destinoId: familiaId }] });
      }
    }

    const where = andFilters.length ? { AND: andFilters } : undefined;

    return this.prisma.ayudaAsignada.findMany({
      where,
      include: {
        origen: true,
        destino: true,
        solicitud: true,
      },
      orderBy: {
        fecha: 'asc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.ayudaAsignada.findUnique({
      where: { id },
      include: {
        origen: true,
        destino: true,
        solicitud: true,
      },
    });
  }

  async updateEstado(id: number, data: UpdateEstadoAyudaDto) {
    const ayuda = await this.prisma.ayudaAsignada.findUnique({ where: { id } });
    if (!ayuda) throw new BadRequestException('Ayuda no encontrada');
    if (ayuda.estado === 'REALIZADO' && data.estado !== 'REALIZADO') {
      throw new BadRequestException('No se puede revertir una ayuda realizada');
    }
    if (data.estado === 'REALIZADO' && ayuda.estado !== 'REALIZADO') {
      await this.completarAyuda(ayuda);
      return this.findOne(id);
    }
    return this.prisma.ayudaAsignada.update({
      where: { id },
      data: { estado: data.estado as any },
    });
  }

  // Marca todas las ayudas PROGRAMADAS cuya fecha ya pasó como REALIZADAS
  async completarVencidas() {
    const ahora = new Date();
    const vencidas = await this.prisma.ayudaAsignada.findMany({
      where: {
        estado: 'PROGRAMADO',
        fecha: { lte: ahora },
      },
    });
    for (const a of vencidas) {
      await this.completarAyuda(a);
    }
    return { completadas: vencidas.length };
  }

  // Modo simulación: completar todas las PROGRAMADAS
  async completarProgramadas() {
    const programadas = await this.prisma.ayudaAsignada.findMany({
      where: { estado: 'PROGRAMADO' },
    });
    for (const a of programadas) {
      await this.completarAyuda(a);
    }
    return { completadas: programadas.length };
  }

  private async validarMismaComunidad(origenId: number, destinoId: number) {
    const familias = await this.prisma.familia.findMany({
      where: { id: { in: [origenId, destinoId] } },
      select: { id: true, comunidadId: true },
    });
    if (familias.length < 2) {
      throw new BadRequestException('Familia origen o destino no encontrada');
    }
    if (familias[0].comunidadId !== familias[1].comunidadId) {
      throw new BadRequestException('Las familias deben pertenecer a la misma comunidad');
    }
    return familias[0].comunidadId;
  }

  private async aplicarHoras(ayuda: AyudaAsignada) {
    await this.prisma.$transaction([
      this.prisma.familia.update({
        where: { id: ayuda.origenId },
        data: { horasDadas: { increment: ayuda.horas } },
      }),
      this.prisma.familia.update({
        where: { id: ayuda.destinoId },
        data: { horasRecibidas: { increment: ayuda.horas } },
      }),
    ]);
  }

  private async completarAyuda(ayuda: AyudaAsignada) {
    await this.prisma.$transaction([
      this.prisma.ayudaAsignada.update({
        where: { id: ayuda.id },
        data: { estado: 'REALIZADO' },
      }),
      this.prisma.familia.update({
        where: { id: ayuda.origenId },
        data: { horasDadas: { increment: ayuda.horas } },
      }),
      this.prisma.familia.update({
        where: { id: ayuda.destinoId },
        data: { horasRecibidas: { increment: ayuda.horas } },
      }),
    ]);
  }
}
