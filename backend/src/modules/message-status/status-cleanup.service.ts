import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageStatusRecord } from './schemas/message-status.schema';

@Injectable()
export class StatusCleanupService {
  private readonly logger = new Logger(StatusCleanupService.name);

  constructor(
    @InjectModel(MessageStatusRecord.name)
    private readonly statusModel: Model<MessageStatusRecord>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCleanup() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await this.statusModel.updateMany(
      {
        status: 'pending',
        createdAt: { $lt: fiveMinutesAgo },
      },
      {
        $set: {
          status: 'failed',
          error: 'Job stuck in pending (timeout)',
        },
      },
    );

    if (result.modifiedCount > 0) {
      this.logger.warn(
        `Marked ${result.modifiedCount} stuck pending messages as failed (fail-safe cleanup)`,
      );
    }
  }
}
