import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.logger.log('SendGrid API Key initialized correctly.');
    } else {
      this.logger.error('SENDGRID_API_KEY is missing in environment configuration.');
    }
  }

  async sendEmail(data: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, any>;
    attachments?: {
      content: string;
      filename: string;
      type: string;
      disposition: string;
    }[];
    customArgs?: Record<string, string>;
  }) {
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const fromName = this.configService.get<string>('SENDGRID_FROM_NAME');

    const msg: any = {
      to: data.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: data.subject,
      text: data.text,
      html: data.html || data.text,
      attachments: data.attachments || [],
      customArgs: data.customArgs || {},
    };

    if (data.templateId) {
      msg.templateId = data.templateId;
      msg.dynamicTemplateData = data.dynamicTemplateData || {};
      delete msg.subject; 
      delete msg.text;
      delete msg.html;
    }

    try {
      const result = await sgMail.send(msg);
      this.logger.log(`Email successfully sent to ${data.to}. Response: ${result[0].statusCode}`);
      return { success: true, statusCode: result[0].statusCode };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${data.to}. Error: ${error.message}`);
      if (error.response) {
        this.logger.error(JSON.stringify(error.response.body));
      } //    
      return { success: false, error: error.message, details: error.response?.body };
    }
  }
}