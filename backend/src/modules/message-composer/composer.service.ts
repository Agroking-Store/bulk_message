import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ComposerService {
    constructor(@InjectModel('Template') private templateModel: Model<any>) { }

    async createTemplate(userId: string, data: { name: string; message: string; media?: any[] }) {
        return this.templateModel.create({ ...data, userId });
    }

    async getTemplate(userId: string, id: string) {
        const template = await this.templateModel.findById(id).exec();
        if (!template) {
            throw new NotFoundException('Template not found');
        }
        if (template.userId !== userId) {
            throw new ForbiddenException('You do not have permission to view this template');
        }
        return template;
    }

    async getTemplates(userId: string) {
        return this.templateModel.find({ userId }).exec();
    }

    async deleteTemplate(userId: string, id: string) {
        const template = await this.templateModel.findById(id).exec();
        if (!template) {
            throw new NotFoundException('Template not found');
        }
        if (template.userId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this template');
        }
        return this.templateModel.findByIdAndDelete(id).exec();
    }
}
