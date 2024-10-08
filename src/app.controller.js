import { Controller, Dependencies, Get, Bind, Query } from "@nestjs/common";
import { v4 as uuid } from "uuid";

import { AppService } from "./app.service";

@Controller()
@Dependencies(AppService)
export class AppController {
  constructor(appService) {
    this.appService = appService;
  }

  @Get("/articleSummary")
  @Bind(Query())
  async getArticleSummary({ url, wpm = 202 }) {
    const formattedURL = this.appService.formatHttpURL(url);

    const { headElement, bodyElement } =
      await this.appService.getHtmlElement(formattedURL);

    const mainContent = await this.appService.getMainContent(
      bodyElement,
      formattedURL,
    );
    const readingTime = this.appService.calculateReadingTime(mainContent, wpm);
    const siteOpenGraph = this.appService.getSiteOpenGraph(
      headElement,
      formattedURL,
    );

    return {
      id: uuid(),
      readingTime,
      mainContent,
      ...siteOpenGraph,
      createDate: new Date().toISOString(),
    };
  }

  @Get("/article")
  @Bind(Query())
  async getArticle({ url }) {
    const formattedURL = this.appService.formatHttpURL(url);

    const { bodyElement } = await this.appService.getHtmlElement(formattedURL);

    const article = await this.appService.getMainContent(
      bodyElement,
      formattedURL,
    );

    return { article };
  }
}
