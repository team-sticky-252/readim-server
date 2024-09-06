const { Injectable, Logger } = require("@nestjs/common");

@Injectable()
export default class CustomLoggerService {
  constructor() {
    this.logger = new Logger(CustomLoggerService.name);
  }

  log(message) {
    this.logger.log(message);
  }

  error(message, trace) {
    this.logger.error(message, trace);
  }

  warn(message) {
    this.logger.warn(message);
  }

  debug(message) {
    this.logger.debug(message);
  }

  verbose(message) {
    this.logger.verbose(message);
  }
}
