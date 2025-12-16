import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class QueueService {
  private logger = new Logger(QueueService.name);
  private redis: Redis | null = null;
  private queueName = process.env.JOBS_QUEUE ?? 'ag_jobs';

  constructor() {
    const url = process.env.REDIS_URL ?? process.env.REDIS_HOST;
    if (url) {
      this.redis = new Redis(url);
      this.redis.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
    } else {
      this.logger.warn('REDIS_URL/REDIS_HOST no configurado, la encolada será noop');
    }
  }

  async enqueueJob(payload: any) {
    if (!this.redis) {
      this.logger.warn('No Redis, job no encolado');
      return;
    }
    await this.redis.lpush(this.queueName, JSON.stringify(payload));
  }
}
