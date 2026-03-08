import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // Global prefix
  app.setGlobalPrefix('api')

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // web
      'http://localhost:3001', // admin
    ],
    credentials: true,
  })

  // Global pipes, filters, interceptors
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor())

  const port = process.env.PORT ?? 4000
  await app.listen(port)
  logger.log(`Spark API running on port ${port}`)
}

bootstrap()
