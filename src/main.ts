import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    abortOnError: false,
  });
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  const isProduction = process.env.NODE_ENV === 'production';
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true' || !isProduction;

  // Enable compression middleware
  app.use(compression());

  // Set global prefix for routes
  app.setGlobalPrefix('api/v1');

  // Enable CORS for all origins
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('EXETAT Mastery API')
      .setDescription('API for EXETAT Prep App - NestJS with Sequelize')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup('api/v1/docs', app, document);
  } else {
    logger.log('Swagger is disabled in production startup');
  }

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason instanceof Error ? reason.stack : String(reason));
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error.stack);
  });

  await app.listen(port, host);
  logger.log(`Server running on http://${host}:${port}`);
}
void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Application bootstrap failed',
    error instanceof Error ? error.stack : String(error),
  );
});
