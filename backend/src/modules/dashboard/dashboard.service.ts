import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact } from '../contacts/schemas/contact.schema';
import { MessageHistory } from '../message-history/schemas/message-history.schema';
import { Campaign } from '../whatsapp/schemas/campaign.schema';
import { EmailCampaign } from '../email/schemas/email-campaign.schema';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(Contact.name) private contactModel: Model<Contact>,
        @InjectModel(MessageHistory.name) private messageHistoryModel: Model<MessageHistory>,
        @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
        @InjectModel(EmailCampaign.name) private emailCampaignModel: Model<EmailCampaign>,
        @InjectModel('User') private userModel: Model<any>,
    ) { }

    async getAnalytics(userId: string, range: string = 'last30days'): Promise<any> {
        try {
            const user = await this.userModel.findById(userId).lean();

            // Calculate date filter
            const startDate = new Date();
            if (range === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (range === 'last7days') {
                startDate.setDate(startDate.getDate() - 7);
            } else {
                // Default to 30 days
                startDate.setDate(startDate.getDate() - 30);
            }

            const userIdStr = String(userId);
            const dateQuery = { userId: userIdStr, createdAt: { $gte: startDate } };
            const historyDateQuery = { userId: userIdStr, timestamp: { $gte: startDate } };

            const totalContacts = await this.contactModel.countDocuments(dateQuery);
            const messagesSent = await this.messageHistoryModel.countDocuments({ ...historyDateQuery, status: 'sent' });
            const failedMessages = await this.messageHistoryModel.countDocuments({ ...historyDateQuery, status: 'failed' });

            // Email Stats - Robust aggregation
            const emailStats = await this.emailCampaignModel.aggregate([
                { 
                    $match: {
                        userId: userIdStr,
                        createdAt: { $gte: startDate }
                    } 
                },
                {
                    $group: {
                        _id: null,
                        emailsSent: { $sum: { $ifNull: ['$sentCount', 0] } },
                        emailsOpened: { $sum: { $ifNull: ['$openedCount', 0] } },
                        failedEmails: { 
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

            const stats = emailStats[0] || { emailsSent: 0, emailsOpened: 0, failedEmails: 0 };
            const openRate = stats.emailsSent > 0 
                ? Math.round((stats.emailsOpened / stats.emailsSent) * 100) 
                : 0;

            // Show only actual scheduled or pending campaigns that are still "live"
            const waScheduled = await this.campaignModel.countDocuments({
                userId,
                status: { $in: ['scheduled', 'pending'] }
            });

            const emailScheduled = await this.emailCampaignModel.countDocuments({
                userId,
                status: { $in: ['scheduled', 'pending'] }
            });

            const totalScheduled = waScheduled + emailScheduled;

            const recentContacts = await this.contactModel.find({ userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            // Combined scheduled messages
            const waRecentScheduled = await this.campaignModel.find({
                userId,
                status: { $in: ['scheduled', 'pending'] }
            })
                .sort({ scheduledTime: 1 })
                .limit(5)
                .lean()
                .then(campaigns => campaigns.map(c => ({
                    ...c,
                    type: 'whatsapp',
                    campaignName: (c as any).campaignName,
                    time: (c as any).scheduledTime ? new Date((c as any).scheduledTime).toLocaleString() : 'Pending'
                })));

            const emailRecentScheduled = await this.emailCampaignModel.find({
                userId,
                status: { $in: ['scheduled', 'pending'] }
            })
                .sort({ scheduledTime: 1 })
                .limit(5)
                .lean()
                .then(campaigns => campaigns.map(c => ({
                    ...c,
                    type: 'email',
                    campaignName: (c as any).campaignName || (c as any).subject,
                    time: (c as any).scheduledTime ? new Date((c as any).scheduledTime).toLocaleString() : 'Pending'
                })));

            const scheduledMessagesList = [...waRecentScheduled, ...emailRecentScheduled]
                .sort((a, b) => {
                    const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : Infinity;
                    const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : Infinity;
                    return timeA - timeB;
                })
                .slice(0, 5);

            const waPerformance = await this.messageHistoryModel.aggregate([
                {
                    $match: {
                        userId: userIdStr,
                        timestamp: { $gte: startDate },
                        status: { $in: ['sent', 'failed'] }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            const emailPerformance = await this.emailCampaignModel.aggregate([
                {
                    $match: {
                        userId: userIdStr,
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        sent: { $sum: { $ifNull: ['$sentCount', 0] } },
                        failed: { $sum: { $add: [{ $ifNull: ['$failedCount', 0] }, { $ifNull: ['$bouncedCount', 0] }, { $ifNull: ['$spamCount', 0] }] } }
                    }
                },
                { $sort: { "_id": 1 } }
            ]);

            // Combine both datasets
            const dateMap = new Map();

            waPerformance.forEach(day => {
                dateMap.set(day._id, {
                    name: day._id,
                    waSent: day.sent,
                    waFailed: day.failed,
                    emailSent: 0,
                    emailFailed: 0
                });
            });

            emailPerformance.forEach(day => {
                const existing = dateMap.get(day._id) || {
                    name: day._id,
                    waSent: 0,
                    waFailed: 0
                };
                dateMap.set(day._id, {
                    ...existing,
                    emailSent: day.sent,
                    emailFailed: day.failed
                });
            });

            const campaignPerformance = Array.from(dateMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));

            // Fill all days in the range to avoid empty gaps in graph
            const daysToFill = range === 'today' ? 1 : (range === 'last7days' ? 7 : 30);
            const filledPerformance = [];
            for (let i = daysToFill - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const existing = campaignPerformance.find((day: any) => day.name === dateStr);
                
                filledPerformance.push(existing || {
                    name: dateStr,
                    waSent: 0,
                    waFailed: 0,
                    emailSent: 0,
                    emailFailed: 0
                });
            }

            console.log(`[DashboardService] Generated performance data for ${filledPerformance.length} days`);

            return {
                user: {
                    fullName: (user as any)?.name || 'User',
                },
                totalContacts,
                messagesSent,
                failedMessages,
                emailsSent: stats.emailsSent,
                failedEmails: stats.failedEmails,
                openRate,
                scheduledMessages: totalScheduled,
                recentContacts,
                recentScheduledMessages: scheduledMessagesList,
                campaignStats: filledPerformance
            };
        } catch (error) {
            throw error;
        }
    }
}
