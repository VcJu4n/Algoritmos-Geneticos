import { Job, JobMetric, Artifact, JobEvent } from '@prisma/client';

type JobWithRelations = Job & {
  metrics?: JobMetric[];
  artifacts?: Artifact[];
  events?: JobEvent[];
};

export function toAdminDetails(job: JobWithRelations) {
  return {
    id: job.id,
    estado: job.estado,
    tipo: job.tipo,
    params: job.params,
    seed: job.seed,
    motorVersion: job.motorVersion,
    dataset: { path: job.datasetPath, hash: job.datasetHash },
    timeline: {
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    },
    etaMin: job.etaMin ?? null,
    metrics: job.metrics ?? [],
    artifacts: job.artifacts ?? [],
    events: job.events ?? [],
  };
}

export function toFamilySummary(job: JobWithRelations) {
  const metrics = job.metrics ?? [];
  const last = metrics[metrics.length - 1];
  return {
    id: job.id,
    estado: job.estado,
    progreso: {
      generacion: last?.generation ?? 0,
      best: last?.best ?? null,
      avg: last?.avg ?? null,
    },
    mensaje:
      job.estado === 'running'
        ? `Mejoro ${last ? last.best.toFixed(1) : 0}% vs inicio`
        : `Estado: ${job.estado}`,
    etaMin: job.etaMin ?? null,
  };
}
