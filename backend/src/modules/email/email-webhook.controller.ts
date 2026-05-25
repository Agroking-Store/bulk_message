import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { EmailWebhookService } from './services/email-webhook.service';

@Controller('email/webhook')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);

  constructor(private readonly webhookService: EmailWebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() events: any[]) {
    // Note: This endpoint is public so SendGrid can reach it.
    // In production, you should verify the SendGrid signature.
    try {
      if (Array.isArray(events)) {
        await this.webhookService.handleSendGridEvents(events);
      } else {
        this.logger.warn('Received non-array payload from SendGrid Webhook');
      }
    } catch (err) {
      this.logger.error(`Error handling SendGrid Webhook: ${err.message}`);
    }
    
    return { status: 'received' };
  }
}
