import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendGridService } from '../email/services/sendgrid.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly sendGridService: SendGridService,
    ) {}

    async sendOTPEmail(to: string, otp: string) {
        const subject = 'Your 2FA Verification Code';
        const text = `Your verification code is: ${otp}. It will expire in 10 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #075E54;">Security Verification</h2>
                <p>Hello,</p>
                <p>Your verification code for the WhatsApp Bulk Messaging system is:</p>
                <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">&copy; 2026 Admin Panel. All rights reserved.</p>
            </div>
        `;

        try {
            await this.sendGridService.sendEmail({ to, subject, text, html });
            this.logger.log(`OTP sent to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send OTP to ${to}`, error.stack);
            return false;
        }
    }

    async sendPasswordChangeConfirmation(to: string) {
        const subject = 'Password Changed Successfully';
        const text = `Your password has been changed successfully.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #075E54;">Security Update</h2>
                <p>Hello,</p>
                <p>This is to confirm that the password for your account has been changed successfully.</p>
                <p>If you did not perform this action, please contact support immediately.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">&copy; 2026 Admin Panel. All rights reserved.</p>
            </div>
        `;

        try {
            await this.sendGridService.sendEmail({ to, subject, text, html });
            this.logger.log(`Password change confirmation sent to ${to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send password change confirmation to ${to}`, error.stack);
            return false;
        }
    }
}
