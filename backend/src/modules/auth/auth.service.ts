import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordReset } from './schemas/password-reset.schema';
import { QueueService } from '../queue/queue.service';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('User') private userModel: Model<any>,
        @InjectModel(PasswordReset.name) private readonly passwordResetModel: Model<PasswordReset>,
        private jwtService: JwtService,
        private readonly queueService: QueueService,
    ) { }

    async signup(dto: SignupDto) {
        const existing = await this.userModel.findOne({ email: dto.email });
        if (existing) throw new ConflictException('Email already in use');

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.userModel.create({
            name: dto.name,
            email: dto.email,
            password: hashedPassword
        });

        return { message: 'User created successfully', userId: user._id };
    }

    async login(dto: LoginDto) {
        const user = await this.userModel.findOne({ email: dto.email });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user._id, email: user.email };

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return { access_token: this.jwtService.sign(payload) };
    }

    async forgotPassword(dto: ForgotPasswordDto, clientIp: string, userAgent: string) {
        const email = dto.email.trim().toLowerCase();

        // Find existing record to rate limit (15m window handled by TTL or date logic)
        const recentRequest = await this.passwordResetModel.findOne({ email, isUsed: false });
        if (recentRequest && recentRequest.expiresAt > new Date()) {
            throw new HttpException('A reset request was already sent recently. Please check your email.', HttpStatus.TOO_MANY_REQUESTS);
        }

        const user = await this.userModel.findOne({ email });
        // Prevent Account Enumeration
        if (!user) {
            return { message: 'If an account exists, a reset code has been sent.' };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Expire any existing ones explicitly
        await this.passwordResetModel.deleteMany({ email });

        await this.passwordResetModel.create({
            userId: user._id,
            email,
            otpHash,
            expiresAt,
            attempts: 0,
            isUsed: false,
            ipAddress: clientIp,
            userAgent
        });

        await this.queueService.addAuthEmailJob('send-otp', {
            to: email,
            type: 'otp',
            otp,
        });

        return { message: 'If an account exists, a reset code has been sent.' };
    }

    async verifyOtp(dto: VerifyOtpDto) {
        const email = dto.email.trim().toLowerCase();
        const record = await this.passwordResetModel.findOne({ email, isUsed: false });

        if (!record) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        if (record.expiresAt < new Date()) {
            throw new UnauthorizedException('OTP expired');
        }

        if (record.attempts >= 5) {
            throw new HttpException('Too many attempts. Please request a new OTP.', HttpStatus.TOO_MANY_REQUESTS);
        }

        const isValid = await bcrypt.compare(dto.otp, record.otpHash);

        if (!isValid) {
            record.attempts += 1;
            await record.save();
            throw new UnauthorizedException('Invalid OTP');
        }

        // OTP is valid
        record.isUsed = true;
        await record.save();

        const payload = {
            sub: record.userId,
            email,
            type: 'password-reset'
        };

        const resetToken = this.jwtService.sign(payload, {
            secret: jwtConfig.secret,
            expiresIn: '10m',
            audience: 'password-reset'
        });

        return { resetToken };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const email = dto.email.trim().toLowerCase();

        try {
            const decoded = this.jwtService.verify(dto.resetToken, {
                secret: jwtConfig.secret,
                audience: 'password-reset'
            });

            if (decoded.email !== email || decoded.type !== 'password-reset') {
                throw new BadRequestException('Invalid token payload');
            }
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        const result = await this.userModel.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount === 0) {
            throw new BadRequestException('Failed to update password');
        }

        // Clean up password resets
        await this.passwordResetModel.deleteMany({ email });

        // Send confirmation email asynchronously
        await this.queueService.addAuthEmailJob('password-changed', {
            to: email,
            type: 'password-changed'
        });

        return { message: 'Your password has been changed successfully.' };
    }
}
