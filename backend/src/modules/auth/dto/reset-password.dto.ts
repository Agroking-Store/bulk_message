import { IsEmail, IsJWT, IsNotEmpty, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'The JWT reset token received from verify-otp', example: 'eyJ...' })
    @IsJWT()
    @IsNotEmpty()
    resetToken: string;

    @ApiProperty({ description: 'The new password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)', example: 'Strong@123' })
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(50)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number or special character',
    })
    newPassword: string;
}
