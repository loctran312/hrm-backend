import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AppConfigService } from './config/env.config';
import { PrismaService } from './database/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get(AppConfigService);

  app.use(helmet());
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: true,
  });
  app.use(compression());

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Swagger
  if (appConfig.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HRM Backend API')
      .setDescription('API documentation cho hệ thống Human Resource Management')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(appConfig.port);

  console.log(`🚀 HRM Backend đang chạy tại: http://localhost:${appConfig.port}`);
  if (appConfig.swaggerEnabled) {
    console.log(`📚 Swagger docs tại: http://localhost:${appConfig.port}/api/docs`);
  }
}

void bootstrap();
