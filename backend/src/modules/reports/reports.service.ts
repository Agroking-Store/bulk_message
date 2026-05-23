import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign } from '../whatsapp/schemas/campaign.schema';
import { Contact } from '../contacts/schemas/contact.schema';
import { MessageHistory } from '../message-history/schemas/message-history.schema';
import { EmailCampaign } from '../email/schemas/email-campaign.schema';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
        @InjectModel(Contact.name) private contactModel: Model<Contact>,
        @InjectModel(MessageHistory.name) private historyModel: Model<MessageHistory>,
        @InjectModel(EmailCampaign.name) private emailCampaignModel: Model<EmailCampaign>,
    ) { }

    async getStats(userId: string, days?: number) {
        const cutoff = new Date();
        if (days) cutoff.setDate(cutoff.getDate() - days);
        else cutoff.setDate(cutoff.getDate() - 30); // Default to 30

        const userIdStr = String(userId);

        // WhatsApp Stats
        const waQuery: any = { userId: userIdStr, sourceType: 'campaign', createdAt: { $gte: cutoff } };
        const waCampaigns = await this.campaignModel.find(waQuery).exec();

        let totalSent = 0;
        let totalFailed = 0;
        waCampaigns.forEach(c => {
            totalSent += (c.sentCount || 0);
            totalFailed += (c.failedCount || 0);
        });
        const totalAttempted = totalSent + totalFailed;
        const engagementRate = totalAttempted > 0 ? ((totalSent / totalAttempted) * 100).toFixed(1) : "0.0";

        // Email Stats - Use String(userId) for robust aggregation matching
        const emailStats = await this.emailCampaignModel.aggregate([
            { 
                $match: {
                    userId: userIdStr,
                    createdAt: { $gte: cutoff }
                } 
            },
            {
                $group: {
                    _id: null,
                    sent: { $sum: { $ifNull: ['$sentCount', 0] } },
                    opened: { $sum: { $ifNull: ['$openedCount', 0] } },
                    clicked: { $sum: { $ifNull: ['$clickedCount', 0] } },
                    failed: { 
                        $sum: { 
                            $add: [
                                { $ifNull: ['$failedCount', 0] }, 
                                { $ifNull: ['$bouncedCount', 0] },
                                { $ifNull: ['$spamCount', 0] }
                            ] 
                        } 
                    }
                }
            }
        ]);

        const eStats = emailStats[0] || { sent: 0, opened: 0, clicked: 0, failed: 0 };
        const totalEmailAttempted = eStats.sent + eStats.failed;
        const emailSuccessRate = totalEmailAttempted > 0 ? ((eStats.sent / totalEmailAttempted) * 100).toFixed(1) : "0.0";
        const openRate = eStats.sent > 0 ? ((eStats.opened / eStats.sent) * 100).toFixed(1) : "0.0";
        const clickRate = eStats.sent > 0 ? ((eStats.clicked / eStats.sent) * 100).toFixed(1) : "0.0";

        return {
            // WhatsApp
            totalSent,
            totalAttempted,
            totalFailed,
            engagementRate: engagementRate + "%",
            
            // Email
            emailSent: eStats.sent,
            emailFailed: eStats.failed,
            emailAttempted: totalEmailAttempted,
            emailSuccessRate: emailSuccessRate + "%",
            openRate: openRate + "%",
            clickRate: clickRate + "%"
        };
    }

    async getTrends(userId: string, days = 7) {
        const lastDays = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            lastDays.push(d);
        }

        const trends = await Promise.all(lastDays.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const campaigns = await this.campaignModel.find({
                userId,
                createdAt: { $gte: date, $lt: nextDay },
                sourceType: 'campaign'
            }).exec();

            let sent = 0;
            let failed = 0;

            campaigns.forEach(c => {
                sent += (c.sentCount || 0);
                failed += (c.failedCount || 0);
            });

            return {
                date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
                sent,
                failed
            };
        }));

        return trends;
    }

    async getEmailTrends(userId: string, days = 7) {
        const lastDays = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            lastDays.push(d);
        }

        const trends = await Promise.all(lastDays.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const campaigns = await this.emailCampaignModel.find({
                userId,
                createdAt: { $gte: date, $lt: nextDay }
            }).exec();

            let sent = 0;
            let failed = 0;

            campaigns.forEach(c => {
                sent += (c.sentCount || 0);
                failed += (c.failedCount || 0) + (c.bouncedCount || 0);
            });

            return {
                date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
                sent,
                failed
            };
        }));

        return trends;
    }

    async getGroupDistribution(userId: string) {
        const distribution = await this.contactModel.aggregate([
            {
                $match: { userId }
            },
            {
                $group: {
                    _id: "$group",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: { $ifNull: ["$_id", "Unassigned"] },
                    count: 1,
                    _id: 0
                }
            }
        ]);

        return distribution;
    }

    async getTopCampaigns(userId: string, days?: number) {
        const query: any = { userId, sourceType: 'campaign' };
        if (days) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            query.createdAt = { $gte: cutoff };
        }

        const campaigns = await this.campaignModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(3)
            .exec();

        return campaigns.map(c => {
            const total = (c.sentCount || 0) + (c.failedCount || 0);
            return {
                id: c._id,
                name: c.campaignName,
                group: c.group,
                totalSent: c.sentCount,
                successRate: total > 0 ? ((c.sentCount / total) * 100).toFixed(1) + "%" : "0.0%"
            };
        });
    }

    async generateCampaignReportCsv(userId: string, campaignId: string) {
        // Try WhatsApp Campaign first
        const campaign = await this.campaignModel.findOne({ _id: campaignId, userId }).exec();
        
        if (campaign) {
            const history = await this.historyModel.find({ campaignId, userId }).sort({ timestamp: 1 }).exec();
            let csv = 'Phone,Status,Timestamp\n';
            history.forEach(h => {
                const date = h.timestamp ? new Date(h.timestamp).toLocaleString() : '';
                csv += `${h.phone},${h.status},${date}\n`;
            });
            return csv;
        }

        throw new Error('Campaign not found');
    }
}
