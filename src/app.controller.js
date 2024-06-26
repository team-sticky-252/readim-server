import { Controller, Dependencies, Get, Bind, Req, Res } from "@nestjs/common";
import { v4 as uuid } from "uuid";

import { AppService } from "./app.service";
import { HttpError, HttpStatus } from "./utils/http";

@Controller()
@Dependencies(AppService)
export class AppController {
  constructor(appService) {
    this.appService = appService;
  }

  @Get("/articleSummary")
  @Bind(Req(), Res())
  async getArticleSummary(request, response) {
    const { url, wpm = 202 } = request.query;

    try {
      const formattedURL = this.appService.formatHttpURL(url);

      const { headElement, bodyElement } =
        await this.appService.getHtmlElement(formattedURL);
      const readingTime = this.appService.getReadingTime(bodyElement, wpm);
      const siteOpenGraph = this.appService.getSiteOpenGraph(
        headElement,
        formattedURL,
      );

      return response.status(HttpStatus.OK.statusCode).send({
        statusCode: HttpStatus.OK.statusCode,
        data: {
          id: uuid(),
          readingTime,
          ...siteOpenGraph,
          createDate: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        const { statusCode, message } = error.getError();

        return response.status(statusCode).send({ statusCode, message });
      }

      const { statusCode, message } = HttpStatus.INTERNAR_SERVER_ERROR;

      return response.status(statusCode).send({ statusCode, message });
    }
  }

  @Get("/article")
  @Bind(Req(), Res())
  async getArticle(request, response) {
    const { url } = request.query;

    try {
      const formattedURL = this.appService.formatHttpURL(url);

      const article = await this.appService.getMainContent(formattedURL);

      return response.status(HttpStatus.OK.statusCode).send({
        statusCode: HttpStatus.OK.statusCode,
        data: {
          article,
        },
      });
    } catch (error) {
      if (error instanceof HttpError) {
        const { statusCode, message } = error.getError();

        return response.status(statusCode).send({ statusCode, message });
      }

      const { statusCode, message } = HttpStatus.INTERNAR_SERVER_ERROR;

      return response.status(statusCode).send({ statusCode, message });
    }
  }
}
