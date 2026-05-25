import { Injectable } from '@nestjs/common';
import { MongooseOptionsFactory, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongoService implements MongooseOptionsFactory {
    constructor(private configService: ConfigService) { }

    createMongooseOptions(): MongooseModuleOptions {
        const mongodbUri = this.configService.get<string>('MONGO_URI');

        return {
            uri: mongodbUri,
        };
    }
}