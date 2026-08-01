import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import { Reflector } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { RolesGuard } from './auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,

      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));

  const config = new DocumentBuilder()

    .setTitle('Khairat Bladna API')

    .setDescription('Backend API documentation')

    .setVersion('1.0')

    .addBearerAuth()

    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}

bootstrap();
