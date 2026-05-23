import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { BULK_QUEUE, SCHEDULER_QUEUE, AUTH_QUEUE, EMAIL_BULK_QUEUE } from '../../queues/queue.processor';

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL');
                const isUpstash = redisUrl?.includes('upstash.io') || redisUrl?.startsWith('rediss://');
                return {
                    connection: {
                      url: redisUrl,
                      tls: isUpstash ? {} : undefined,
                      maxRetriesPerRequest: null,
                      enableReadyCheck: false,
                      connectTimeout: 10000, // 10s connection timeout
                      keepAlive: 1000,
                      retryStrategy: (times) => {
                        const delay = Math.min(times * 100, 3000);
                        return delay;
                      },
                    },
                };
            },
            inject: [ConfigService],
        }),
        BullModule.registerQueue(
            { 
                name: BULK_QUEUE,
                defaultJobOptions: {
                    attempts: 5, // Increased attempts for bulk messages
                    backoff: { type: 'exponential', delay: 5000 }, // Exponential backoff starting at 5s
                    removeOnComplete: { count: 1000 }, // Keep some history for debugging
                    removeOnFail: { count: 5000 },
                },
            },
            { 
                name: SCHEDULER_QUEUE,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 10000 },
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 1000 },
                },
            },
            {
                name: AUTH_QUEUE,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'fixed', delay: 5000 }, // short retry for emails vs scheduler
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 1000 },
                },
            },
            {
                name: EMAIL_BULK_QUEUE,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 10000 },
                    removeOnComplete: { count: 1000 },
                    removeOnFail: { count: 5000 },
                },
            },
        ),
    ],
    providers: [QueueService],
    exports: [QueueService, BullModule],
})
export class QueueModule {}
