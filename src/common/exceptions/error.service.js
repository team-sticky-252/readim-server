import { HttpStatus, Injectable } from "@nestjs/common";

import AppError from "./app-error";

const PARSE_ERROR = 512;

@Injectable()
export class ErrorService {
  handleBadUrlError() {
    throw new AppError("Invalid URL", "BAD_URL", HttpStatus.BAD_REQUEST);
  }

  handleParseError() {
    throw new AppError(
      "Failed To Parse The Article",
      "PARSE_ERROR",
      PARSE_ERROR,
    );
  }
}
