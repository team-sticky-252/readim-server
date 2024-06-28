import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.SERVER_PORT || 8080;
  app.enableCors({
    origin: ["http://localhost:5173", "https://testreadim.netlify.app/"],
    methods: "GET",
  });

  await app.listen(port);
}

bootstrap();
