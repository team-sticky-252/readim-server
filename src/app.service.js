import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello() {
    return "Hello World!";
  }

  getReadingTime(articleBody, userWPM) {
    const numOfWords = articleBody.split(" ").length;
    const rawReadingTime = (numOfWords / userWPM) * 60 * 1000;
    let readingMinute = Math.floor(rawReadingTime / 1000 / 60);
    let readingSeconds =
      Math.round((rawReadingTime / 1000 - readingMinute * 60) * 0.1) * 10;

    if (readingSeconds >= 45) {
      readingMinute += 1;
      readingSeconds = 0;
    } else if (readingSeconds >= 15) {
      readingSeconds = 30;
    } else {
      readingSeconds = 0;
    }

    const readingTimePerMs = readingMinute * 60 * 1000 + readingSeconds * 1000;

    return readingTimePerMs;
  }
}
