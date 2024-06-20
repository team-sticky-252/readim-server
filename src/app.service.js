import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  convertCodeToText(code) {
    const CodeText = code
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[{}\[\]\(\)<>\/;┤├┌─┐└┘┬┴┼│\./"/'/`@,:=\-_!|+?$*\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return CodeText;
  }
}
