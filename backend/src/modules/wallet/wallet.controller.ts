import { Controller, Get, Post, UseGuards, Request, Body, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('balance')
    async getBalance(@Request() req, @Query('type') type?: 'whatsapp' | 'email') {
        const userId = req.user.userId;
        const balance = await this.walletService.getBalance(userId, type || 'whatsapp');
        return { status: 'success', data: { balance } };
    }

    @Get('balances')
    async getBalances(@Request() req) {
        const userId = req.user.userId;
        const balances = await this.walletService.getBalances(userId);
        return { status: 'success', data: balances };
    }

    @Get('transactions')
    async getTransactions(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: string,
    ) {
        const userId = req.user.userId;
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.walletService.getTransactions(userId, pageNum, limitNum, type);
    }
    //testing money 
    @Post('add-test-money')
    async addTestMoney(@Request() req, @Body('userId') targetUserId?: string) {
        return this.handleTestCredit(req, targetUserId);
    }

    @Post('test-credit')
    async testCredit(@Request() req, @Body('userId') targetUserId?: string) {
        return this.handleTestCredit(req, targetUserId);
    }

    private async handleTestCredit(req: any, targetUserId?: string) {
        const userId = targetUserId || req.user.userId;
        const amount = 100;

        const result = await this.walletService.creditWallet(
            userId,
            amount,
            'Manual Admin Credit (Testing)',
            'TEST_RECHARGE',
            'whatsapp'
        );

        return {
            status: 'success',
            message: `Successfully added ₹${amount} to user ${userId}`,
            newBalance: result.balance
        };
    }
}
