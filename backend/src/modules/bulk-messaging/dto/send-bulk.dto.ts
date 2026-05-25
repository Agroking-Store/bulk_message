import { IsString, IsOptional } from 'class-validator';

export class SendBulkDto {
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    campaignId?: string;

    @IsOptional()
    @IsString()
    group?: string;

    @IsOptional()
    @IsString({ each: true })
    contactIds?: string[];

    @IsOptional()
    media?: { url: string; type: string; originalName?: string }[];

    @IsOptional()
    @IsString()
    templateType?: string; // 'utility' | 'marketing'

    @IsOptional()
    @IsString()
    templateName?: string;

    @IsOptional()
    templateParams?: any;
}
