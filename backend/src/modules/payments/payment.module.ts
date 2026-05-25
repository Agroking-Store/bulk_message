import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: Payment.name, schema: PaymentSchema },
        ]),
        WalletModule,
    ],
    providers: [PaymentService],
    controllers: [PaymentController],
})
export class PaymentModule { }
