import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../auth/email.service';

@Injectable()
export class ProfileService {
    constructor(
        @InjectModel('User') private userModel: Model<any>,
        private readonly emailService: EmailService,
    ) { }

    async getProfile(userId: string) {
        const user = await this.userModel.findById(userId).select('-password -twoFACode');
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateProfile(userId: string, updateData: any) {
        // Filter out sensitive fields
        const { password, twoFACode, twoFAExpires, ...allowedData } = updateData;

        const user = await this.userModel.findByIdAndUpdate(userId, allowedData, { new: true }).select('-password -twoFACode');
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async changePassword(userId: string, data: any) {
        const { currentPassword, newPassword } = data;
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new UnauthorizedException('Current password incorrect');

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        await this.emailService.sendPasswordChangeConfirmation(user.email);

        return { message: 'Password changed successfully' };
    }

    async send2FAOTP(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.twoFACode = otp;
        user.twoFAExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();

        await this.emailService.sendOTPEmail(user.email, otp);

        return { message: 'OTP sent to your email' };
    }

    async verify2FA(userId: string, code: string) {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (!user.twoFACode || user.twoFACode !== code || user.twoFAExpires < new Date()) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        user.is2FAEnabled = !user.is2FAEnabled; // Toggle
        user.twoFACode = null;
        user.twoFAExpires = null;
        await user.save();

        return {
            message: user.is2FAEnabled ? '2FA enabled successfully' : '2FA disabled successfully',
            is2FAEnabled: user.is2FAEnabled
        };
    }

    async updateAvatar(userId: string, avatarPath: string) {
        const user = await this.userModel.findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true });
        if (!user) throw new NotFoundException('User not found');
        return { avatar: user.avatar };
    }
}
