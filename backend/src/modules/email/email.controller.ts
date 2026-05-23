import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Req,
    Request as NestRequest
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserEmailService } from './services/user-email.service';
import { Request } from 'express';
import { ContactsService } from '../contacts/contacts.service';
import { SendGridService } from './services/sendgrid.service';
import { WalletService } from '../wallet/wallet.service';

@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
    constructor(
        private readonly userEmailService: UserEmailService,
        private readonly contactsService: ContactsService,
        private readonly sendGridService: SendGridService,
        private readonly walletService: WalletService
    ) { }

    @Post('send-email')
    async sendEmailDirect(@Req() req: Request, @Body() body: {
        to: string;
        subject: string;
        text: string;
        html?: string;
        templateId?: string;
        dynamicTemplateData?: Record<string, any>;
    }) {
        const userId = (req.user as any).userId;
        const totalCost = 0.10; // Cost per single email

        // Validation
        if (!body.to || (!body.subject && !body.templateId) || (!body.text && !body.templateId)) {
            return {
                success: false,
                message: 'Missing required fields. Provide to, subject, and text (or templateId).'
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.to)) {
            return { success: false, message: 'Invalid recipient email format.' };
        }

        // Debit wallet before sending
        try {
            await this.walletService.debitWallet(userId, totalCost, `Direct Email to ${body.to}`, undefined, 'email');
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Insufficient balance or wallet error.'
            };
        }

        return await this.sendGridService.sendEmail(body);
    }

    @Post('send')
    async sendEmail(@Req() req: Request, @Body() body: {
        campaignName?: string;
        subject: string;
        body: string;
        group?: string;
        contactIds?: string[];
        media?: any[]
    }) {
        const userId = (req.user as any).userId;
        let recipients: string[] = [];

        if (body.contactIds && body.contactIds.length > 0) {
            // Fetch specific contacts
            const contacts = await this.contactsService.getContacts(userId, 1, 1000);
            recipients = contacts.records
                .filter(c => body.contactIds.includes(c._id.toString()))
                .map(c => c.email)
                .filter(e => !!e);
            console.log(`[EmailCampaign] Found ${recipients.length} emails from ${body.contactIds.length} contact IDs`);
        } else if (body.group) {
            // Fetch contacts by group
            const groupName = body.group === "ALL" ? "All contacts" : body.group;
            const contacts = await this.contactsService.getContacts(userId, 1, 9999, groupName);

            recipients = contacts.records.map(c => c.email).filter(e => !!e);
            console.log(`[EmailCampaign] Found ${recipients.length} emails from ${contacts.total} contacts in group "${groupName}"`);
        }

        if (recipients.length === 0) {
            console.warn(`[EmailCampaign] Operation aborted: No recipients found for group "${body.group}"`);
            return { status: 'error', message: 'No recipients found with valid email addresses. Please ensure your contacts have email addresses.' };
        }

        return await this.userEmailService.triggerCampaign(userId, {
            campaignName: body.campaignName,
            subject: body.subject,
            body: body.body,
            recipients,
            group: body.group ?? undefined,
            media: body.media
        });
    }

    @Post('schedule')
    async scheduleEmail(@Req() req: Request, @Body() body: any) {
        const userId = (req.user as any).userId;
        let recipients = body.recipients || [];

        if (body.group && (!recipients || recipients.length === 0)) {
            const query: any = { userId };
            if (body.group !== 'All contacts') {
                query.group = body.group;
            }
            if (body.contactIds && body.contactIds.length > 0) {
                query._id = { $in: body.contactIds };
            }
            const contacts = await this.contactsService.getContacts(userId, 1, 100000, body.group);
            recipients = contacts.records.map(c => c.email).filter(e => !!e);
        }

        return await this.userEmailService.scheduleCampaign(userId, {
            campaignName: body.campaignName,
            subject: body.subject,
            body: body.body,
            scheduledAt: new Date(body.scheduledAt),
            group: body.group,
            contactIds: body.contactIds,
            media: body.media,
            sourceType: body.sourceType
        });
    }

    @Get('history')
    async getHistory(@Req() req: Request) {
        return this.userEmailService.getHistory((req.user as any).userId);
    }

    @Get('stats')
    async getStats(@Req() req: Request) {
        const stats = await this.userEmailService.getStats((req.user as any).userId);
        return { status: 'success', ...stats };
    }

    @Get('analytics/latest')
    async getLatestStats(@Req() req: Request) {
        const stats = await this.userEmailService.getLatestStats((req.user as any).userId);
        return { status: 'success', data: stats };
    }

    // --- Template Management ---

    @Post('templates')
    async saveTemplate(@Req() req: Request, @Body() body: any) {
        const userId = (req.user as any).userId;
        const template = await this.userEmailService.createTemplate(userId, body);
        return { status: 'success', data: template };
    }

    @Get('templates')
    async getRawTemplates(@Req() req: Request) {
        const userId = (req.user as any).userId;
        const templates = await this.userEmailService.getRawTemplates(userId);
        return { status: 'success', data: templates };
    }

    @Get('templates/history')
    async getTemplates(@Req() req: Request) {
        const userId = (req.user as any).userId;
        const templates = await this.userEmailService.getTemplates(userId);
        return { status: 'success', data: templates };
    }
}
