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

  getReadingTime(articleBody, userWPM) {
    const numOfWords = articleBody.split(" ").length;
    const rawReadingTime = (numOfWords / userWPM) * 60 * 1000;
    let readingMinutes = Math.floor(rawReadingTime / 1000 / 60);
    let readingSeconds =
      Math.round((rawReadingTime / 1000 - readingMinutes * 60) * 0.1) * 10;

    if (readingSeconds >= 45) {
      readingMinutes += 1;
      readingSeconds = 0;
    } else if (readingSeconds >= 15) {
      readingSeconds = 30;
    } else {
      readingSeconds = 0;
    }

    const readingTimePerMs = readingMinutes * 60 * 1000 + readingSeconds * 1000;

    return readingTimePerMs;
  }
}
