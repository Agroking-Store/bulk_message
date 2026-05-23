import { Module } from '@nestjs/common';
import { MongooseModule, Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ComposerController } from './composer.controller';
import { ComposerService } from './composer.service';

@Schema({ timestamps: true })
export class Template extends Document {
    @Prop({ required: true }) userId: string;
    @Prop({ required: true }) name: string;
    @Prop({ required: true }) message: string;
    @Prop({ type: [{ url: String, type: { type: String }, originalName: String }] }) media: { url: string; type: string; originalName?: string }[];
}
const TemplateSchema = SchemaFactory.createForClass(Template);

@Module({
    imports: [MongooseModule.forFeature([{ name: 'Template', schema: TemplateSchema }])],
    controllers: [ComposerController],
    providers: [ComposerService],
})
export class ComposerModule { }
