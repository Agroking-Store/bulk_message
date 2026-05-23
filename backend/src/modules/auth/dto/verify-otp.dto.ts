import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'The 6-digit OTP sent to the email', example: '123456' })
    @IsString()
    @Length(6, 6)
    @IsNotEmpty()
    otp: string;
}
