import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
    @ApiProperty({ example: 'Rahul Kumar' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'user@gmail.com' })
    @IsEmail()
    @Matches(/^[a-z0-9._%+&-]+@gmail\.com$/, { message: 'Email must be in lowercase and only gmail.com domain is allowed' })
    email: string;

    @ApiProperty({ example: 'Password123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&#)'
    })
    password: string;
}
