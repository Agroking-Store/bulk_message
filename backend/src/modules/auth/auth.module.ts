import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig } from '../../config/jwt.config';
import { MongooseModule, Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PasswordReset, PasswordResetSchema } from './schemas/password-reset.schema';
import { AuthProcessor } from './workers/auth.processor';
import { EmailService } from './email.service';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true }) name: string;
    @Prop({ required: true, unique: true }) email: string;
    @Prop({ required: true }) password: string;
    @Prop() dob: string;
    @Prop() gender: string;
    @Prop() mobileNumber: string;
    @Prop() avatar: string;
    @Prop({ default: 'Administrator' }) role: string;
    @Prop({ default: false }) is2FAEnabled: boolean;
    @Prop() twoFACode: string;
    @Prop() twoFAExpires: Date;
    @Prop() lastLogin: Date;
    @Prop({ default: 0 }) walletBalance: number;
    @Prop({ default: 0 }) whatsappBalance: number;
    @Prop({ default: 0 }) emailBalance: number;
}
export const UserSchema = SchemaFactory.createForClass(User);

import { SendGridService } from '../email/services/sendgrid.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'User', schema: UserSchema },
            { name: PasswordReset.name, schema: PasswordResetSchema }
        ]),
        PassportModule,
        JwtModule.register({
            secret: jwtConfig.secret,
            signOptions: { expiresIn: jwtConfig.expiresIn },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, EmailService, AuthProcessor, SendGridService],
    exports: [AuthService, MongooseModule],
})
export class AuthModule { }
