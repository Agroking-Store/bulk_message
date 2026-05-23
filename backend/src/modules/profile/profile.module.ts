import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User, UserSchema } from '../auth/auth.module';
import { EmailService } from '../auth/email.service';
import { CloudinaryConfig } from '../../config/cloudinary.config';
import { CloudinaryService } from '../../services/cloudinary.service';
import { SendGridService } from '../email/services/sendgrid.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    ],
    controllers: [ProfileController],
    providers: [ProfileService, EmailService, SendGridService, CloudinaryConfig, CloudinaryService],
})
export class ProfileModule { }
