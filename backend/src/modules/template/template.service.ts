import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Template,
  TemplateDocument,
} from './template.schema';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name)
    private templateModel: Model<TemplateDocument>,
  ) {}

  

  async getAllTemplates(status?: string) {

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    return this.templateModel
      .find(query)
      .sort({ createdAt: -1 });
  }

  

  async getCounts() {

    const all =
      await this.templateModel.countDocuments();

    const approved =
      await this.templateModel.countDocuments({
        status: 'APPROVED',
      });

    const pending =
      await this.templateModel.countDocuments({
        status: 'PENDING',
      });

    const rejected =
      await this.templateModel.countDocuments({
        status: 'REJECTED',
      });

    return {
      all,
      approved,
      pending,
      rejected,
    };
  }

  

  async updateTemplateStatus(
    id: string,
    status: string,
  ) {

    const template =
      await this.templateModel.findByIdAndUpdate(
        id,
        {
          status: status.toUpperCase(),
        },
        { new: true },
      );

    if (!template) {
      throw new NotFoundException(
        'Template not found',
      );
    }

    return template;
  }

  

  async getTemplateById(id: string) {

    const template =
      await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException(
        'Template not found',
      );
    }

    return template;
  }

 

  async updateTemplate(
    id: string,
    dto: any,
  ) {

    const template =
      await this.templateModel.findByIdAndUpdate(
        id,
        dto,
        { new: true },
      );

    if (!template) {
      throw new NotFoundException(
        'Template not found',
      );
    }

    return template;
  }

  

  async deleteTemplate(id: string) {

    const template =
      await this.templateModel.findByIdAndDelete(
        id,
      );

    if (!template) {
      throw new NotFoundException(
        'Template not found',
      );
    }

    return {
      message:
        'Template deleted successfully',
    };
  }

  

  async syncTemplates() {

    return {
      message:
        'Templates synced successfully',
    };
  }
}