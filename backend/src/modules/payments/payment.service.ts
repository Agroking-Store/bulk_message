import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Order } from './schemas/order.schema';
import { Payment } from './schemas/payment.schema';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private razorpay: any;

    constructor(
        private readonly configService: ConfigService,
        private readonly walletService: WalletService,
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    ) {
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (!keyId || !keySecret) {
            this.logger.error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment variables');
        }

        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }

    async createOrder(userId: string, amountRupees: number, serviceType: 'whatsapp' | 'email' = 'whatsapp') {
        const amountPaise = Math.round(amountRupees * 100);
        
        try {
            const options = {
                amount: amountPaise,
                currency: 'INR',
                receipt: `receipt_${Date.now()}`,
            };
 
            const order = await this.razorpay.orders.create(options);

            await new this.orderModel({
                userId,
                razorpayOrderId: order.id,
                amount: amountPaise,
                currency: 'INR',
                status: 'created',
                serviceType: serviceType
            }).save();

            return order;
        } catch (error : any) {
            this.logger.error(`Error creating Razorpay order: ${error.message}`);
            throw new BadRequestException('Could not create payment order');
        }
    }

    async verifyPayment(userId: string, paymentData: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

        // 1. Verify signature
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            this.logger.warn(`Invalid signature for order ${razorpay_order_id}`);
            throw new BadRequestException('Invalid payment signature');
        }

        // 2. Check if payment already processed (Idempotency)
        const existingPayment = await this.paymentModel.findOne({ razorpayPaymentId: razorpay_payment_id });
        if (existingPayment) {
            return { status: 'already_processed', balance: await this.walletService.getBalance(userId) };
        }

        // 3. Find order
        const order = await this.orderModel.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            throw new BadRequestException('Order not found');
        }

        // 4. Update order status
        order.status = 'paid';
        await order.save();

        // 5. Log payment
        // Note: In real app, you might want to fetch payment details from Razorpay to get the method
        const payment = new this.paymentModel({
            userId,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            signature: razorpay_signature,
            amount: order.amount,
            method: 'razorpay', // Simplified, should ideally fetch from razorpay.payments.fetch(payment_id)
            status: 'captured',
            serviceType: order.serviceType
        });
        await payment.save();

        // 6. Credit wallet
        const amountRupees = order.amount / 100;
        const result = await this.walletService.creditWallet(userId, amountRupees, `${order.serviceType === 'whatsapp' ? 'WhatsApp' : 'Email'} Wallet Recharge`, razorpay_order_id, order.serviceType as any);

        return { status: 'success', balance: result.balance, serviceType: order.serviceType };
    }

    async getPaymentHistory(userId: string) {
        return this.paymentModel.find({ userId, status: 'captured' }).sort({ createdAt: -1 }).exec();
    }
}
