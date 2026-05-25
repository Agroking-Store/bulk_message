import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('order')
    async createOrder(@Request() req, @Body('amount') amount: number, @Body('serviceType') serviceType?: 'whatsapp' | 'email') {
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }
        const order = await this.paymentService.createOrder(req.user.userId, amount, serviceType || 'whatsapp');
        return { status: 'success', data: order };
    }

    @Post('verify')
    async verifyPayment(@Request() req, @Body() paymentData: any) {
        const result = await this.paymentService.verifyPayment(req.user.userId, paymentData);
        return { status: 'success', data: result };
    }

    @Get('history')
    async getPaymentHistory(@Request() req) {
        const userId = req.user.userId;
        const result = await this.paymentService.getPaymentHistory(userId);
        return { status: 'success', data: result };
    }
}
