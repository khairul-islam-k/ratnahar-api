import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // add prefix
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('ecommerce project')
    .setDescription('we sell every product by using it')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Application running on: http://localhost:${process.env.PORT ?? 3000}/api/v1`,
  );

  console.log(
    `Swagger running on: http://localhost:${process.env.PORT ?? 3000}/api/v1/docs`,
  );
}
bootstrap();
