import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['https://tibiarise.app', 'http://localhost:3000'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
