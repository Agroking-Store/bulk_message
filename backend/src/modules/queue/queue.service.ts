import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BULK_QUEUE, SCHEDULER_QUEUE, AUTH_QUEUE, AuthEmailPayload, EMAIL_BULK_QUEUE, EmailBulkJobPayload } from '../../queues/queue.processor';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue(BULK_QUEUE) private readonly bulkQueue: Queue,
        @InjectQueue(SCHEDULER_QUEUE) private readonly schedulerQueue: Queue,
        @InjectQueue(AUTH_QUEUE) private readonly authQueue: Queue,
        @InjectQueue(EMAIL_BULK_QUEUE) private readonly emailBulkQueue: Queue,
    ) { }

    async addBulkJob(name: string, data: any, delay: number = 0) {
        await this.bulkQueue.add(name, data, {
            delay,
            attempts: 3,
            backoff: {
                type: 'fixed',
                delay: 30000,
            },
        });
    }

    async addSchedulerJob(name: string, data: any, delay: number = 0) {
        await this.schedulerQueue.add(name, data, {
            delay,
            // No retry attempts for scheduler jobs - they are time-sensitive
            // The queue defaultJobOptions.attempts=1 handles this
        });
    }

    async addAuthEmailJob(name: string, data: AuthEmailPayload, delay: number = 0) {
        await this.authQueue.add(name, data, {
            delay,
        });
    }

    async addEmailBulkJob(name: string, data: EmailBulkJobPayload, delay: number = 0) {
        await this.emailBulkQueue.add(name, data, {
            delay,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 10000,
            },
        });
    }

    async addJob(queueName: string, name: string, data: any, options: any = {}) {
        const queue = queueName === BULK_QUEUE ? this.bulkQueue : this.schedulerQueue;
        // Let queue-level defaultJobOptions handle retry settings (no global override here)
        await queue.add(name, data, { ...options });
    }

    async getScheduledJobs() {
        return this.schedulerQueue.getJobs(['delayed', 'waiting', 'active']);
    }
}
