import { IsString, IsOptional, IsDateString } from 'class-validator';

export class ScheduleMessageDto {
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    campaignId?: string;

    @IsOptional()
    @IsString()
    group?: string;

    @IsOptional()
    media?: { url: string; type: string; originalName?: string }[];

    @IsOptional()
    @IsString({ each: true })
    contactIds?: string[];

    @IsDateString()
    scheduledAt: string;

    @IsOptional()
    @IsString()
    sourceType?: string;

    @IsOptional()
    @IsString()
    templateType?: string; // 'utility' | 'marketing'

    @IsOptional()
    @IsString()
    templateName?: string;

    @IsOptional()
    templateParams?: any;
}
