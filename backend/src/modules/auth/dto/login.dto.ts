import { IsEmail, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user@gmail.com' })
    @IsEmail()
    @Matches(/^[a-z0-9._%+&-]+@gmail\.com$/, { message: 'Email must be in lowercase and only gmail.com domain is allowed' })
    email: string;

    @ApiProperty({ example: 'Password123!' })
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
        message: 'Password must follow the required complexity rules (Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 symbol)'
    })
    password: string;
}
