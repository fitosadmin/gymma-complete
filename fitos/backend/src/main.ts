import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: isDev ? true : (process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000']),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`FITOS API listening on port ${port}`);
}

// Last-resort safety net — Nest's global exception filter catches everything
// thrown inside the request lifecycle, so this shouldn't fire in practice,
// but an uncaught error outside that lifecycle would otherwise silently
// crash the process (and every in-flight request for every user) with no
// log line explaining why. Exit so the platform restarts a clean instance.
process.on('uncaughtException', (err) => {
  console.error('uncaughtException — exiting', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection — exiting', reason);
  process.exit(1);
});

bootstrap();
