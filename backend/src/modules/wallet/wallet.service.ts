import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { User } from '../auth/auth.module';
import { WalletTransaction } from './schemas/wallet-transaction.schema';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectModel(WalletTransaction.name) private readonly transactionModel: Model<WalletTransaction>,
    ) { }

    async getBalance(userId: string, type: 'whatsapp' | 'email' = 'whatsapp'): Promise<number> {
        const field = type === 'whatsapp' ? 'whatsappBalance' : 'emailBalance';
        const user = await this.userModel.findById(userId).select(field).exec();
        if (!user) throw new BadRequestException('User not found');
        return (user as any)[field] || 0;
    }

    async getBalances(userId: string) {
        const user = await this.userModel.findById(userId).select('whatsappBalance emailBalance').exec();
        if (!user) throw new BadRequestException('User not found');
        return {
            whatsapp: user.whatsappBalance || 0,
            email: user.emailBalance || 0
        };
    }

    async creditWallet(userId: string, amount: number, reason: string, referenceId?: string, type: 'whatsapp' | 'email' = 'whatsapp') {
        const field = type === 'whatsapp' ? 'whatsappBalance' : 'emailBalance';
        this.logger.log(`[creditWallet] User ${userId}, Amount: ${amount}, Type: ${type}, Reason: ${reason}`);
        
        const user = await this.userModel.findByIdAndUpdate(
            userId,
            { $inc: { [field]: amount } },
            { new: true }
        ).exec();

        if (!user) throw new BadRequestException('User not found');

        const balanceAfter = (user as any)[field];

        await new this.transactionModel({
            userId,
            type: 'credit',
            amount,
            reason,
            balanceAfter,
            referenceId,
            serviceType: type
        }).save();

        return { balance: balanceAfter };
    }

    async debitWallet(userId: string, amount: number, reason: string, referenceId?: string, type: 'whatsapp' | 'email' = 'whatsapp') {
        const field = type === 'whatsapp' ? 'whatsappBalance' : 'emailBalance';
        this.logger.log(`[debitWallet] User ${userId}, Amount: ${amount}, Type: ${type}, Reason: ${reason}`);

        // Atomic update with condition to prevent negative balance
        const user = await this.userModel.findOneAndUpdate(
            { _id: userId, [field]: { $gte: amount } },
            { $inc: { [field]: -amount } },
            { new: true }
        ).exec();

        if (!user) {
            const currentUser = await this.userModel.findById(userId).exec();
            if (!currentUser) throw new BadRequestException('User not found');
            const available = (currentUser as any)[field] || 0;
            throw new BadRequestException(`Insufficient ${type} balance. Available: ₹${available}, Required: ₹${amount}`);
        }

        const balanceAfter = (user as any)[field];

        await new this.transactionModel({
            userId,
            type: 'debit',
            amount,
            reason,
            balanceAfter,
            referenceId,
            serviceType: type
        }).save();

        return { balance: balanceAfter };
    }

    async getTransactions(userId: string, page = 1, limit = 10, type?: string) {
        const skip = (page - 1) * limit;
        const query: any = { userId };
        
        if (type && ['whatsapp', 'email'].includes(type)) {
            query.serviceType = type;
        }

        const [data, total] = await Promise.all([
            this.transactionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.transactionModel.countDocuments(query),
        ]);
        return { status: 'success', data, total, page, limit };
    }
}
