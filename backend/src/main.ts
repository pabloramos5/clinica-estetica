import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`Servidor corriendo en: http://localhost:${port}`);
  console.log(`API disponible en: http://localhost:${port}/api`);
  console.log(`Health check en: http://localhost:${port}/api/health`);
}
bootstrap();