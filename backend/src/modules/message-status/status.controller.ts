import { Controller, Get, Param } from '@nestjs/common';
import { StatusService } from './status.service';

@Controller('status')
export class StatusController {
    constructor(private readonly statusService: StatusService) { }

    @Get(':messageId')
    getStatus(@Param('messageId') messageId: string) {
        return this.statusService.findByMessageId(messageId);
    }
}
