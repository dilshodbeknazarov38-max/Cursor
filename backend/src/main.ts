import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'f/:slug', method: RequestMethod.GET }],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.enableCors({
    origin:
      configService.get<string[]>('app.corsOrigins') ??
      configService.get<string>('app.frontendUrl'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 🔥 Render uchun to‘g‘rilangan port
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(
    `🚀 CPAMaRKeT.Uz API ${await app.getUrl()} manzilida ishlamoqda`,
  );
}

void bootstrap();
