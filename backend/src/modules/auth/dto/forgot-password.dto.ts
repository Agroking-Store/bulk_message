import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    @Matches(/@gmail\.com$/, { message: 'Only @gmail.com addresses are allowed' })
    email: string;
}
