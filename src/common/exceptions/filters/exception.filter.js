import { HttpStatus, Logger, Catch } from "@nestjs/common";

import AppError from "../app-error";

@Catch()
export default class ExceptionFilter {
  constructor() {
    this.logger = new Logger(ExceptionFilter.name);
  }

  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal Server Error";
    let errorCode = "INTERNAL_SERVER_ERROR";

    if (exception instanceof AppError) {
      status = exception.statusCode;
      message = exception.message;
      errorCode = exception.errorCode;
    } else if (exception instanceof Error) {
      this.logger.error(`Exception: ${message}`, exception.stack);

      message = exception.message;
    }

    response.status(status).send({
      statusCode: status,
      errorCode,
      message,
    });
  }
}
