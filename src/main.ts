import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';

import AppModule from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors({
    origin: '*',
  });
  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
