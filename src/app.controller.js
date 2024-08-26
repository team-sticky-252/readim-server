import {
  Controller,
  Dependencies,
  Get,
  Bind,
  Req,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { v4 as uuid } from "uuid";

import { AppService } from "./app.service";

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

    const formattedURL = this.appService.formatHttpURL(url);

    const { headElement, bodyElement } =
      await this.appService.getHtmlElement(formattedURL);

    const mainContent = this.appService.getMainContent(
      bodyElement,
      formattedURL,
    );

    const readingTime = this.appService.calculateReadingTime(mainContent, wpm);

    const siteOpenGraph = this.appService.getSiteOpenGraph(
      headElement,
      formattedURL,
    );

    return response.status(HttpStatus.OK).send({
      statusCode: HttpStatus.OK,
      data: {
        id: uuid(),
        readingTime,
        mainContent,
        ...siteOpenGraph,
        createDate: new Date().toISOString(),
      },
    });
  }

  @Get("/article")
  @Bind(Req(), Res())
  async getArticle(request, response) {
    const { url } = request.query;

    const formattedURL = this.appService.formatHttpURL(url);

    const { bodyElement } = await this.appService.getHtmlElement(formattedURL);

    const article = this.appService.getMainContent(bodyElement, formattedURL);

    return response.status(HttpStatus.OK).send({
      statusCode: HttpStatus.OK,
      data: {
        article,
      },
    });
  }
}
