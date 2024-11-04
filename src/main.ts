import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Bootstraps the application and sets up Swagger documentation.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation for incoming requests
  app.useGlobalPipes(new ValidationPipe({ transform: true })); // Enable transform

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('GeoTools API')
    .setDescription('Finds the nearest big city for a given lat/lng')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start listening on specified port
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
