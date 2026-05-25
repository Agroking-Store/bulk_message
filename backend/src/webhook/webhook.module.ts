import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';

import { TemplateModule } from '../template/template.module';

@Module({
  imports: [
    TemplateModule,   
  ],
  controllers: [WebhookController],
  
})
export class WebhookModule {}