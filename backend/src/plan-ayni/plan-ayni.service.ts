import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AyudasService } from '../ayudas/ayudas.service';

@Injectable()
export class PlanAyniService {
  private readonly logger = new Logger(PlanAyniService.name);
  private readonly agServiceUrl = process.env.AG_SERVICE_URL ?? 'http://127.0.0.1:8000/optimizar-ayni';

  constructor(
    private readonly prisma: PrismaService,
    private readonly ayudasService: AyudasService,
    private readonly http: HttpService,
  ) {}

  async generarPlan() {
    const comunidades = await this.prisma.comunidad.findMany();
    const planesComunidad: Array<{
      comunidadId: number;
      ayudas: any[];
      solicitudesIds: number[];
      fitness: number;
      detalleFitness: any;
    }> = [];

    for (const comunidad of comunidades) {
      const familias = await this.prisma.familia.findMany({
        where: { comunidadId: comunidad.id },
      });
      const solicitudes = await this.prisma.solicitudAyuda.findMany({
        where: { estado: 'PENDIENTE', familia: { comunidadId: comunidad.id } },
      });

      if (!familias.length || !solicitudes.length) {
        continue;
      }

      const plan = await this.generarPlanConMicroservicio(familias, solicitudes);

      planesComunidad.push({
        comunidadId: comunidad.id,
        ayudas: plan.ayudas,
        solicitudesIds: plan.solicitudesIds,
        fitness: plan.fitness,
        detalleFitness: plan.detalleFitness,
      });
    }

    if (!planesComunidad.length) {
      throw new BadRequestException('No hay solicitudes PENDIENTE para generar el plan de ayni.');
    }

    const todasAyudas = planesComunidad.flatMap((p) =>
      p.ayudas.map((a) => ({
        origenId: a.origenId,
        destinoId: a.destinoId,
        solicitudId: a.solicitudId,
        tipo: a.tipo,
        fecha: a.fecha,
        horas: a.horas,
      })),
    );

    await this.ayudasService.createBatch({
      ayudas: todasAyudas,
    });

    const autoCompleteOnPlan =
      (process.env.AUTO_COMPLETE_ON_PLAN ?? 'true').toLowerCase() === 'true';
    if (autoCompleteOnPlan) {
      await this.ayudasService.completarProgramadas();
    }

    const todasSolicitudes = Array.from(
      new Set(planesComunidad.flatMap((p) => p.solicitudesIds)),
    );
    if (todasSolicitudes.length) {
      await this.prisma.solicitudAyuda.updateMany({
        where: { id: { in: todasSolicitudes } },
        data: { estado: 'PLANIFICADA' },
      });
    }

    return {
      mensaje: 'Plan de ayni generado y ayudas registradas correctamente.',
      totalAyudas: todasAyudas.length,
      comunidades: planesComunidad.map((p) => ({
        comunidadId: p.comunidadId,
        totalAyudas: p.ayudas.length,
        fitness: p.fitness,
        detalleFitness: p.detalleFitness,
      })),
    };
  }

  async obtenerPlanActual(comunidadId?: number) {
    return this.ayudasService.findAll(comunidadId ? { comunidadId } : undefined);
  }

  /**
   * Generador heuristico: asigna cada solicitud a la familia con mayor balance disponible,
   * evitando autoasignacion y priorizando la misma comunidad.
   */
  private generarPlanLocal(
    familias: Array<{
      id: number;
      nombre: string;
      comunidadId: number;
      miembros: number;
      horasDadas: number;
      horasRecibidas: number;
    }>,
    solicitudes: Array<{
      id: number;
      familiaId: number;
      tipo: string;
      horasEstimadas: number;
      fechaInicio: Date;
    }>,
  ) {
    const estado = new Map(
      familias.map((f) => [
        f.id,
        {
          ...f,
          balance: f.horasDadas - f.horasRecibidas,
        },
      ]),
    );

    const ayudas: Array<{
      origenId: number;
      destinoId: number;
      solicitudId: number;
      tipo: string;
      fecha: Date;
      horas: number;
    }> = [];

    for (const solicitud of solicitudes) {
      const destino = estado.get(solicitud.familiaId);
      if (!destino) continue;

      const candidatos = familias
        .filter((f) => f.id !== solicitud.familiaId)
        .sort((a, b) => {
          const ea = estado.get(a.id)!;
          const eb = estado.get(b.id)!;
          const comunidadScoreA = a.comunidadId === destino.comunidadId ? 1 : 0;
          const comunidadScoreB = b.comunidadId === destino.comunidadId ? 1 : 0;
          if (comunidadScoreB !== comunidadScoreA) return comunidadScoreB - comunidadScoreA;
          if (eb.balance !== ea.balance) return eb.balance - ea.balance;
          return eb.miembros - ea.miembros;
        });

      const origen = candidatos[0];
      if (!origen) continue;

      const horas = solicitud.horasEstimadas;
      const fecha = solicitud.fechaInicio ?? new Date();

      ayudas.push({
        origenId: origen.id,
        destinoId: solicitud.familiaId,
        solicitudId: solicitud.id,
        tipo: solicitud.tipo,
        fecha,
        horas,
      });

      const estadoOrigen = estado.get(origen.id)!;
      estadoOrigen.horasDadas += horas;
      estadoOrigen.balance += horas;

      destino.horasRecibidas += horas;
      destino.balance -= horas;
    }

    const balances = Array.from(estado.values()).map((f) => f.balance);
    const promedio = balances.reduce((a, b) => a + b, 0) / balances.length;
    const maxDesbalance = Math.max(...balances.map((b) => Math.abs(b - promedio)));
    const varianza = balances.reduce((acc, b) => acc + Math.pow(b - promedio, 2), 0) / balances.length;
    const stdDev = Math.sqrt(varianza);

    return {
      ayudas,
      solicitudesIds: Array.from(new Set(ayudas.map((a) => a.solicitudId))),
      fitness: 1 / (1 + maxDesbalance + stdDev),
      detalleFitness: {
        desbalancePromedio: promedio,
        maxDesbalance,
        stdDev,
        generaciones: 1,
      },
    };
  }

  private async generarPlanConMicroservicio(
    familias: Array<{
      id: number;
      nombre: string;
      comunidadId: number;
      miembros: number;
      horasDadas: number;
      horasRecibidas: number;
    }>,
    solicitudes: Array<{
      id: number;
      familiaId: number;
      tipo: string;
      horasEstimadas: number;
      urgencia: string;
      fechaInicio: Date;
      fechaFin: Date;
    }>,
  ) {
    const totalHoras = solicitudes.reduce((acc, s) => acc + (s.horasEstimadas ?? 0), 0);
    const maxHorasEnv = process.env.AG_MAX_HORAS ? Number(process.env.AG_MAX_HORAS) : null;
    const maxHorasCalculado =
      totalHoras && familias.length
        ? Math.ceil((totalHoras / familias.length) * 1.1) // 10% por encima del promedio
        : null;
    const maxHorasPorFamilia =
      maxHorasEnv && maxHorasEnv > 0 ? maxHorasEnv : maxHorasCalculado;

    const payload = {
      familias: familias.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        comunidadId: f.comunidadId,
        miembros: f.miembros,
        horasDadas: f.horasDadas,
        horasRecibidas: f.horasRecibidas,
      })),
      solicitudes: solicitudes.map((s) => ({
        id: s.id,
        familiaId: s.familiaId,
        tipo: s.tipo,
        horasEstimadas: s.horasEstimadas,
        urgencia: (s as any).urgencia ?? 'MEDIA',
        fechaInicio: s.fechaInicio.toISOString(),
        fechaFin: s.fechaFin.toISOString(),
      })),
      parametros: {
        tamanoPoblacion: 30,
        maxGeneraciones: 50,
        probCruzamiento: 0.7,
        probMutacion: 0.1,
        pesoEquilibrio: 0.65,
        pesoCobertura: 0.15,
        pesoCarga: 0.2,
        maxHorasPorFamilia,
      },
    };

    const response = await lastValueFrom(
      this.http.post(this.agServiceUrl, payload, { timeout: 10000 }),
    );

    const { ayudas, fitness, detalleFitness } = response.data ?? {};

    if (!Array.isArray(ayudas) || !ayudas.length) {
      throw new BadRequestException('El microservicio AG no devolvio ayudas validas.');
    }

    return {
      ayudas: ayudas.map((a: any) => ({
        origenId: a.origenId,
        destinoId: a.destinoId,
        solicitudId: a.solicitudId,
        tipo: a.tipo,
        fecha: new Date(a.fecha),
        horas: a.horas,
      })),
      solicitudesIds: Array.from(new Set(ayudas.map((a: any) => a.solicitudId))),
      fitness: fitness ?? 0,
      detalleFitness: detalleFitness ?? {},
    };
  }
}
