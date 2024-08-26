import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ErrorService } from "./common/exceptions/error.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ErrorService],
})
export class AppModule {}
