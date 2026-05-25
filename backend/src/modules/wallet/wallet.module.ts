import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletTransaction, WalletTransactionSchema } from './schemas/wallet-transaction.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: WalletTransaction.name, schema: WalletTransactionSchema },
        ]),
        AuthModule, // To get access to User model and JwtAuthGuard if needed
    ],
    providers: [WalletService],
    controllers: [WalletController],
    exports: [WalletService],
})
export class WalletModule { }
