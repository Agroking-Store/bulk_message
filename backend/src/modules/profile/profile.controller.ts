import { Controller, Get, Put, Post, Body, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../../services/cloudinary.service';
import { memoryStorage } from 'multer';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(
        private readonly profileService: ProfileService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @ApiOperation({ summary: 'Get profile details' })
    @Get()
    async getProfile(@Request() req) {
        return this.profileService.getProfile(req.user.userId);
    }

    @ApiOperation({ summary: 'Update profile details' })
    @Put()
    async updateProfile(@Request() req, @Body() updateData: any) {
        return this.profileService.updateProfile(req.user.userId, updateData);
    }

    @ApiOperation({ summary: 'Change password' })
    @Post('change-password')
    async changePassword(@Request() req, @Body() data: any) {
        return this.profileService.changePassword(req.user.userId, data);
    }

    @ApiOperation({ summary: 'Send 2FA OTP' })
    @Post('2fa/send-otp')
    async send2FAOTP(@Request() req) {
        return this.profileService.send2FAOTP(req.user.userId);
    }

    @ApiOperation({ summary: 'Verify 2FA OTP' })
    @Post('2fa/verify')
    async verify2FA(@Request() req, @Body('code') code: string) {
        return this.profileService.verify2FA(req.user.userId, code);
    }

    @ApiOperation({ summary: 'Upload profile avatar' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
        }
    }))
    async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            const uploadResult = await this.cloudinaryService.uploadImage(file, 'avatars');
            
            // Get current user profile to check if they have an existing avatar
            const currentProfile = await this.profileService.getProfile(req.user.userId);
            
            // If user has an existing avatar with a Cloudinary URL, delete it
            if (currentProfile.avatar && currentProfile.avatar.includes('cloudinary')) {
                try {
                    // Extract public_id from Cloudinary URL
                    const urlParts = currentProfile.avatar.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = `avatars/${filename.split('.')[0]}`;
                    await this.cloudinaryService.deleteImage(publicId);
                } catch (error) {
                    // Ignore error on deletion
                }
            }
            
            const result = await this.profileService.updateAvatar(req.user.userId, uploadResult.url);
            return result;
        } catch (error) {
            throw new Error(`Failed to upload avatar: ${error.message}`);
        }
    }
}
