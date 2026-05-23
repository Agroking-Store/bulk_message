import { Injectable } from '@nestjs/common';
import { BulkService } from '../bulk-messaging/bulk.service';
import { ScheduleMessageDto } from '../bulk-messaging/dto/schedule-message.dto';

@Injectable()
export class SchedulerService {
    constructor(private readonly bulkService: BulkService) { }

    schedule(userId: string, dto: ScheduleMessageDto) {
        return this.bulkService.scheduleMessage(userId, dto);
    }
}
