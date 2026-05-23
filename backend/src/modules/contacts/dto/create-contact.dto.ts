import { IsString, IsOptional, IsArray, IsNotEmpty, Matches } from 'class-validator';


export class CreateContactDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

   @IsOptional()
@Matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, {
  message: 'Only valid gmail.com addresses are allowed',
})
email?: string;

    @IsString()
    @IsOptional()
    group?: string;
}
