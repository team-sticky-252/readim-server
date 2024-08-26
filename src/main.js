import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import TransformInterceptor from "./common/interceptors/response.intercepter";
import ExceptionFilter from "./common/exceptions/filters/exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.SERVER_PORT || 8080;
  app.enableCors({
    origin: ["http://localhost:5173", "https://testreadim.netlify.app/"],
    methods: "GET",
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new ExceptionFilter());

  await app.listen(port);
}

bootstrap();
