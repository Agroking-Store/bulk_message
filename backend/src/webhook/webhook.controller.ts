import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { TemplateService } from '../template/template.service';

@Controller('whatsapp/webhook')
export class WebhookController {

  constructor(private templateService: TemplateService) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    if (mode === 'subscribe' && token === 'mysecretkey083752') {
      return challenge;
    }
    return 'Verification failed ';
  }

  
  @Post()
  handleWebhook(@Body() body: any) {
    console.log("WEBHOOK HIT:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const templateUpdate = value?.message_template_status_update;

    if (templateUpdate) {
      const templateId = templateUpdate.message_template_id;
      const status = templateUpdate.event;

      console.log(" TEMPLATE STATUS:", templateId, status);

      
      this.templateService.updateTemplateStatus(templateId, status);
    } else {
      console.log(" No template update found");
    }

    return 'EVENT_RECEIVED';
  }
}