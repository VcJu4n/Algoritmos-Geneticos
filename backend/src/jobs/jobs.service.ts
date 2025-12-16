import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Job, JobMetric, JobEvent, Artifact, Prisma } from '@prisma/client';
import { CreateJobDto } from './dto/create-job.dto';
import type { AppRole } from '../auth/roles.decorator';
import { JobProgressDto } from './dto/job-progress.dto';
import { QueueService } from '../queue/queue.service';

export type JobWithRelations = Job & {
  metrics: JobMetric[];
  events: JobEvent[];
  artifacts: Artifact[];
};

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
  ) {}

  async createJob(dto: CreateJobDto, user: { sub: number; role: AppRole; familiaId?: number }) {
    const familiaId = user.role === 'FAMILIA' ? user.familiaId ?? null : dto.familiaId ?? null;
    const job = await this.prisma.job.create({
      data: {
        tipo: dto.tipo,
        estado: 'queued',
        userId: user.sub,
        familiaId,
        params: dto.params,
        seed: dto.seed,
        motorVersion: dto.motorVersion,
        datasetPath: dto.datasetPath,
        datasetHash: dto.datasetHash,
      },
    });

    await this.queue.enqueueJob({
      jobId: job.id,
      tipo: dto.tipo,
      params: dto.params,
      seed: dto.seed,
      motorVersion: dto.motorVersion,
      datasetPath: dto.datasetPath,
      datasetHash: dto.datasetHash,
      familiaId,
    });

    return job;
  }

  async findOneWithRelations(id: number): Promise<JobWithRelations> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { metrics: true, events: true, artifacts: true },
    });
    if (!job) throw new NotFoundException('Job no encontrado');
    return job;
  }

  async recordProgress(id: number, dto: JobProgressDto) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job no encontrado');

    const actions: Prisma.PrismaPromise<any>[] = [];

    if (dto.generation !== undefined) {
      actions.push(
        this.prisma.jobMetric.create({
          data: {
            jobId: id,
            generation: dto.generation,
            best: dto.best ?? 0,
            avg: dto.avg ?? 0,
            elapsedMs: null,
          },
        }),
      );
    }

    actions.push(
      this.prisma.job.update({
        where: { id },
        data: {
          estado: dto.estado ?? job.estado,
          etaMin: dto.etaMin ?? job.etaMin,
          finishedAt:
            dto.estado === 'finished' || dto.estado === 'failed'
              ? new Date()
              : job.finishedAt,
        },
      }),
    );

    if (dto.message) {
      actions.push(
        this.prisma.jobEvent.create({
          data: {
            jobId: id,
            type: dto.estado ?? 'info',
            message: dto.message,
          },
        }),
      );
    }

    await this.prisma.$transaction(actions);
    return this.findOneWithRelations(id);
  }
}
