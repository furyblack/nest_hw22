import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { CustomValidationPipe } from './pipes/customValidationPipe';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new CustomValidationPipe());
  app.use(cookieParser());
  appSetup(app);
  await app.listen(3000);
}
bootstrap();
