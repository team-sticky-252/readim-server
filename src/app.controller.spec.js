import { Test } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let app;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe("Convert code to text", () => {
    it("should return a string of words with only words and spaces", () => {
      const appService = app.get(AppService);
      expect(appService.convertCodeToText("let {top, bottom, left, right} = Directions;")).toBe("let top bottom left right Directions");
    });

    it("should return a string of words with only words and spaces", () => {
      const appService = app.get(AppService);
      expect(appService.convertCodeToText(`<div className="mb-4 overflow-scroll font-sans"></div>`)).toBe("div class Name mb 4 overflow scroll font sans div");
    });
  });
});