import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AUTH_QUEUE, AuthEmailPayload } from '../../../queues/queue.processor';
import { EmailService } from '../email.service';

@Processor(AUTH_QUEUE)
export class AuthProcessor extends WorkerHost {
    private readonly logger = new Logger(AuthProcessor.name);

    constructor(private readonly emailService: EmailService) {
        super();
    }

    async process(job: Job<AuthEmailPayload, any, string>): Promise<any> {
        this.logger.debug(`Processing auth email job ${job.id} of type ${job.data.type}`);
        try {
            const { to, type, otp } = job.data;

            if (type === 'otp' && otp) {
                const result = await this.emailService.sendOTPEmail(to, otp);
                if (!result) {
                    throw new Error('Failed to send OTP email');
                }
            } else if (type === 'password-changed') {
                const result = await this.emailService.sendPasswordChangeConfirmation(to);
                if (!result) {
                    throw new Error('Failed to send password confirmation email');
                }
            }

            this.logger.debug(`Successfully processed auth email job ${job.id}`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Error processing auth email job ${job.id}:`, error.stack);
            throw error;
        }
    }
}
