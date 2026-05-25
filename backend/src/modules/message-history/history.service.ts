import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageHistory } from './schemas/message-history.schema';

@Injectable()
export class HistoryService {
    constructor(
        @InjectModel(MessageHistory.name)
        private readonly historyModel: Model<MessageHistory>,
    ) { }

    async create(data: {
        userId: string;
        campaignId: string;
        contactId: string | any;
        phone: string;
        message: string;
        status: string;
        sourceType?: string;
    }) {
        let { sourceType, campaignId } = data;

        // Infer sourceType if not provided
        if (!sourceType) {
            // If campaignId is a valid MongoDB ObjectId (24 hex chars) and not a dummy like 'adhoc'
            if (campaignId && campaignId.length === 24 && /^[0-9a-fA-F]+$/.test(campaignId)) {
                sourceType = 'campaign';
            } else {
                sourceType = 'message';
            }
        }

        return this.historyModel.create({ ...data, sourceType });
    }

    async findAll(userId: string, campaignId?: string, page = 1, limit = 10, sourceType?: string) {
        const filter: any = { userId };
        if (campaignId) filter.campaignId = campaignId;
        if (sourceType) filter.sourceType = sourceType;
        
        // CRITICAL: Filter out 'pending' status from UI views
        filter.status = { $ne: 'pending' };

        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            this.historyModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
            this.historyModel.countDocuments(filter),
        ]);
        return { total, page, limit, records };
    }

    async updateByContactAndCampaign(userId: string, campaignId: string, contactId: string, updateData: any) {
        return this.historyModel.findOneAndUpdate(
            { userId, campaignId, contactId },
            updateData,
            { new: true }
        );
    }

    async updateById(id: string, updateData: any) {
        return this.historyModel.findByIdAndUpdate(id, updateData, { new: true });
    }
}
