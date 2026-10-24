import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Permite validar también JSON nulo o primitivo dentro del controlador.
  app.useBodyParser('json', { strict: false });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
