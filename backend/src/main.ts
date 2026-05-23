import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const { json, urlencoded } = await import('express');
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    const swaggerConfig = new DocumentBuilder()
        .setTitle('WhatsApp Bulk Messaging API')
        .setDescription('The WhatsApp Bulk Messaging API description')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors({
        origin: "http://localhost:3000",
        credentials: true,
    });
    
    // Enable graceful shutdown hooks
    app.enableShutdownHooks();

    const port = process.env.PORT || 4000;
    await app.listen(port);
}
bootstrap();
