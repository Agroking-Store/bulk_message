// Shared queue processor types and job payload interfaces.

export const BULK_QUEUE = 'bulk-messaging';
export const SCHEDULER_QUEUE = 'scheduler-messaging';
export const AUTH_QUEUE = 'auth-email';
export const EMAIL_BULK_QUEUE = 'email-bulk-messaging';

export interface BulkJobPayload {
    userId: string;
    messageId: string;
    campaignId: string;
    historyId: string;
    contactId: string;
    phone: string;
    contactName: string;
    message: string;
    media?: { url: string; type: string; originalName?: string }[];
    costPerMsg?: number;
    templateName?: string;
    templateParams?: any;
}

export interface EmailBulkJobPayload {
    userId: string;
    campaignId: string;
    recipient: string;
    subject: string;
    body: string;
    media?: { url: string; originalName?: string }[];
}

export interface SchedulerJobPayload {
    userId: string;
    campaignId: string;
    message: string;
    type?: 'whatsapp' | 'email';
    subject?: string;
    group?: string;
    contactIds?: string[];
    media?: { url: string; type: string; originalName?: string }[];
    sourceType?: string;
    templateName?: string;
    templateParams?: any;
}

export interface AuthEmailPayload {
    to: string;
    type: 'otp' | 'password-changed';
    otp?: string;
}
