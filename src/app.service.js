import { Injectable, Dependencies } from "@nestjs/common";
import jsdom from "jsdom";
import puppeteer from "puppeteer";

import { ErrorService } from "./common/exceptions/error.service";
import CustomLoggerService from "./common/customLogger/custom-logger.service";

const EXCLUDED_TAGS_REGEX =
  /^(button|img|nav|aside|footer|audio|canvas|embed|iframe|map|area|noscript|object|option|optgroup|picture|progress|script|select|source|style|svg|meta)$/i;
const EXCLUDED_CLASS_NAMES_REGEX =
  /\b(button|btn|nav|footer|summary|author|comment|sns|share|card|activity|relate|another|reply|sr-only|post-switch|loof|revenue|act|direction|og|notice|rpost|list-unstyled)\b/i;
const EXCLUDED_ID_REGEX = /(paging|player|sidebar)/i;
const MAIN_CONTENT_TAGS_REGEX = /^(main|article|section)$/i;
const MAIN_CONTENT_CSS_REGEX =
  /(tt_article_useless_p_margin|area_view|contents_style|article_skin)/i;
const MAIN_CONTENT_SELECTOR_NAME = [
  "#article-view",
  "#mArticle",
  ".tt_article_useless_p_margin",
  ".area_view",
  ".contents_style",
  ".article_skin",
];
const ENTER_REGEX = /[\n]/g;
const TAB_REGEX = /[\t]/g;
const WHITESPACE_REGEX = /\s+/g;
const SITE_NAME_REGEX = /https?:\/\/(?:www\.)?([^\.\/]+)/;
const NODE = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
};

@Injectable()
@Dependencies(ErrorService, CustomLoggerService)
export class AppService {
  constructor(errorService, customLoggerService) {
    this.errorService = errorService;
    this.logger = customLoggerService;
  }

  async getHtmlElement(url) {
    try {
      const { JSDOM } = jsdom;
      const dom = await JSDOM.fromURL(url);
      const { document } = dom.window;

      return {
        headElement: document.documentElement.querySelector("head"),
        bodyElement: document.documentElement.querySelector("body"),
      };
    } catch (error) {
      this.logger.error(`in getHtmlElement: ${error.message}, ${error.stack}`);
      throw this.errorService.handleBadUrlError();
    }
  }

  async getMainContent(bodyElement, url) {
    if (url.includes("velog.io")) {
      return this.getVelogMainContent(bodyElement);
    }

    if (url.includes("tistory.com")) {
      return this.getTistoryMainContent(bodyElement);
    }

    const mainContent = this.getSemanticMainContent(bodyElement);

    if (mainContent !== "" && mainContent.length > 200) {
      return mainContent;
    }

    const bestElement = await this.extractMainContent(url);

    if (bestElement || mainContent.length <= 200) {
      return bestElement;
    }

    throw this.errorService.handleParseError();
  }

  calculateReadingTime(articleBody, wpm) {
    const numOfWords = articleBody.split(" ").length;
    const readingTimeMs = Math.floor((numOfWords / wpm) * 60 * 1000);

    return readingTimeMs;
  }

  getSemanticMainContent(bodyElement) {
    const mainContentElements = this.reduceSemanticMainContent(bodyElement);

    const contents = mainContentElements.reduce((acc, element) => {
      this.removeExcludedTags(element);
      this.convertElementsWithRules(element);

      return acc.concat(this.parseElementIntoTextContent(element));
    }, []);

    return contents.join(" ");
  }

  removeExcludedTags(element) {
    const stack = Array.from(element.children).reverse();

    while (stack.length > 0) {
      const currentElement = stack.pop();
      const tagName = currentElement.tagName.toLowerCase();
      const { className, id } = currentElement;

      if (EXCLUDED_TAGS_REGEX.test(tagName) && id !== "mainFrame") {
        const { parentElement } = currentElement;

        parentElement.removeChild(currentElement);
      } else if (EXCLUDED_ID_REGEX.test(id)) {
        const { parentElement } = currentElement;

        parentElement.removeChild(currentElement);
      } else if (EXCLUDED_CLASS_NAMES_REGEX.test(className)) {
        const { parentElement } = currentElement;

        parentElement.removeChild(currentElement);
      } else {
        const reversedChildren = Array.from(currentElement.children).reverse();

        stack.push(...reversedChildren);
      }
    }
  }

  convertElementsWithRules(element) {
    if (!element) return;

    const stack = [element];

    while (stack.length > 0) {
      const currentElement = stack.pop();

      this.addSpaceBetweenTags(currentElement);
      this.convertCodeTagToText(currentElement);

      const reversedChildren = Array.from(currentElement.children).reverse();

      stack.push(...reversedChildren);
    }
  }

  addSpaceBetweenTags(element) {
    if (!element || !element.nextSibling) {
      return;
    }

    const { nextSibling } = element;

    if (
      nextSibling.nodeType === NODE.TEXT_NODE &&
      nextSibling.textContent === "\n"
    ) {
      element.innerHTML += " ";
    } else if (
      element.nodeType === NODE.ELEMENT_NODE &&
      nextSibling.nodeType === NODE.ELEMENT_NODE
    ) {
      element.innerHTML += " ";
    }
  }

  convertCodeTagToText(element) {
    if (!element) return;

    const tagName = element.tagName.toLowerCase();

    if (tagName === "pre" || tagName === "code") {
      const text = this.convertCodeToText(element.textContent);

      element.innerHTML = text;
    }
  }

  reduceSemanticMainContent(bodyElement) {
    const mainContentElements = [];
    const stack = Array.from(bodyElement.children).reverse();

    while (stack.length > 0) {
      const currentElement = stack.pop();
      const tagName = currentElement.tagName.toLowerCase();

      if (MAIN_CONTENT_TAGS_REGEX.test(tagName)) {
        const articleElementsInMain = Array.from(
          currentElement.querySelectorAll("main article"),
        );
        const hasArticleInMain = articleElementsInMain.length > 0;

        if (tagName === "main" && hasArticleInMain) {
          const mainContentCandidates = [];

          for (let i = 0; i < articleElementsInMain.length; i += 1) {
            const isChildElement = mainContentCandidates.some((element) =>
              element.contains(articleElementsInMain[i]),
            );

            if (!isChildElement) {
              mainContentCandidates.push(articleElementsInMain[i]);
            }
          }

          mainContentElements.push(...mainContentCandidates);
        } else {
          mainContentElements.push(currentElement);
        }
      } else if (!EXCLUDED_TAGS_REGEX.test(tagName)) {
        const reversedChildren = Array.from(currentElement.children).reverse();

        stack.push(...reversedChildren);
      }
    }

    return mainContentElements;
  }

  reduceNonSemanticMainContent(bodyElement) {
    const mainContentElements = [];
    const stack = Array.from(bodyElement.children).reverse();

    while (stack.length > 0) {
      const currentElement = stack.pop();
      const { className } = currentElement;
      const selectors = MAIN_CONTENT_SELECTOR_NAME.join(", ");

      const articleElementsInMain = Array.from(
        bodyElement.querySelectorAll(selectors),
      );

      if (MAIN_CONTENT_CSS_REGEX.test(className)) {
        const mainContentCandidates = [];

        for (let i = 0; i < articleElementsInMain.length; i += 1) {
          const isChildElement = mainContentCandidates.some((element) =>
            element.contains(articleElementsInMain[i]),
          );

          if (!isChildElement) {
            mainContentCandidates.push(articleElementsInMain[i]);
          }
        }

        mainContentElements.push(...mainContentCandidates);
      }

      const reversedChildren = Array.from(currentElement.children).reverse();
      stack.push(...reversedChildren);
    }

    return mainContentElements;
  }

  parseElementIntoTextContent(element) {
    return element.textContent
      .replace(ENTER_REGEX, " ")
      .replace(TAB_REGEX, " ")
      .replace(WHITESPACE_REGEX, " ");
  }

  convertCodeToText(code) {
    const codeText = code
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[{}\[\]\(\)<>\/;┤├┌─┐└┘┬┴┼│\./"/'/`@,:=\-_!|+?$*\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return codeText;
  }

  getSiteOpenGraph(headElement, url) {
    const title =
      this.getOpenGraph(headElement, "title") ||
      headElement.querySelector("title")?.textContent;
    const faviconUrl = headElement.querySelector("link[rel*='icon']")?.href;
    const siteMatchName = url.match(SITE_NAME_REGEX);
    const siteName =
      this.getOpenGraph(headElement, "site_name", "article:author") ||
      this.getOpenGraph(headElement, "twitter:site")?.split("@")[1] ||
      (siteMatchName && siteMatchName[1]);

    return {
      title,
      siteName,
      url,
      faviconUrl,
    };
  }

  getOpenGraph(headElement, ...properties) {
    return properties
      .map(
        (property) =>
          headElement.querySelector(
            `meta[property='og:${property}'], meta[name='${property}']`,
          )?.content,
      )
      .find((content) => content !== undefined);
  }

  formatHttpURL(url) {
    return url.replace(/^(?!https?:\/\/)/, "https://");
  }

  getVelogMainContent(bodyElement) {
    const VELOG_TITLE_CLASS_NAME = "tbwpx";
    const VELOG_MAIN_CLASS_NAME = "dftzxp";
    const allElements = Array.from(bodyElement.querySelectorAll("*"));

    const titleElement = allElements.find((element) => {
      return (
        typeof element.className === "string" &&
        element.className.toLowerCase().includes(VELOG_TITLE_CLASS_NAME)
      );
    });

    const mainElements = allElements.filter((element) => {
      return (
        typeof element.className === "string" &&
        element.className.toLowerCase().includes(VELOG_MAIN_CLASS_NAME)
      );
    });

    const velogMainArticle = titleElement
      ? [titleElement, ...mainElements]
      : mainElements;

    const velogMainContent = velogMainArticle.reduce((acc, element) => {
      this.convertElementsWithRules(element);

      return acc.concat(this.parseElementIntoTextContent(element));
    }, []);

    return velogMainContent.join(" ");
  }

  getTistoryMainContent(bodyElement) {
    let mainContentElements = this.reduceSemanticMainContent(bodyElement);

    if (mainContentElements.length === 0) {
      mainContentElements = this.reduceNonSemanticMainContent(bodyElement);
    }

    const mainArticle = mainContentElements.reduce((acc, element) => {
      this.removeExcludedTags(element);
      this.convertElementsWithRules(element);

      return acc.concat(this.parseElementIntoTextContent(element));
    }, []);

    return mainArticle.join(" ").trim().replace(/\\/g, "");
  }

  gatherElementData(rootElement) {
    const elementsData = [];

    const traverse = (element, depth) => {
      if (depth > 20 || !element) {
        return;
      }

      const textLength = element.textContent.trim().length;
      const allElements = element.querySelectorAll("*");
      const linkElements = element.querySelectorAll("a");
      const linkRatio = linkElements.length / (allElements.length + 1);

      if (textLength === 0) {
        return;
      }

      const elementData = {
        element,
        textLength,
        linkRatio,
      };

      elementsData.push(elementData);

      for (let i = 0; i < element.children.length; i += 1) {
        traverse(element.children[i], depth + 1);
      }
    };

    for (let i = 0; i < rootElement.children.length; i += 1) {
      traverse(rootElement.children[i], 0);
    }

    return elementsData;
  }

  assignRelativeScores(elementsData) {
    const maxTextLength = Math.max(
      ...elementsData.map((data) => data.textLength),
    );

    elementsData.forEach((data) => {
      const allElements = elementsData.length;
      const childrenElements = data.element.childElementCount + 1;
      const elementRatio = 1 - childrenElements / allElements;
      const tagName = data.element.tagName.toLowerCase();
      const className = data.element.className.toLowerCase();
      const id = data.element.id.toLowerCase();

      data.textLengthScore =
        ((data.textLength * (1 - data.linkRatio)) / maxTextLength) * 100;

      if (tagName === "main") {
        data.tagNameScore = 10;
      } else if (tagName === "article") {
        data.tagNameScore = 30;
      } else if (tagName === "section") {
        data.tagNameScore = 30;
      } else {
        data.tagNameScore = 0;
      }

      if (className.includes("article")) {
        data.classNameScore = 30;
      } else {
        data.classNameScore = 0;
      }

      if (id.includes("article")) {
        data.idScore = 30;
      } else {
        data.idScore = 0;
      }

      const linkPenalty = data.linkRatio * -100;

      data.totalScore =
        (data.textLengthScore * 0.1 +
          data.tagNameScore * 0.7 +
          data.classNameScore * 0.5 +
          data.idScore * 0.5 +
          linkPenalty) *
        elementRatio;
    });
  }

  async extractMainContent(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle0" });

    const iframeElement = await page.$("iframe#mainFrame");
    let html;

    if (iframeElement) {
      const frame = await iframeElement.contentFrame();
      html = await frame.content();
    } else {
      html = await page.content();
    }

    await browser.close();

    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const bodyElement = dom.window.document.body;

    if (!bodyElement) {
      this.logger.error("Body element is undefined");

      throw this.errorService.handleParseError();
    }

    this.removeExcludedTags(bodyElement);
    this.convertElementsWithRules(bodyElement);

    const elementsData = this.gatherElementData(bodyElement);

    this.assignRelativeScores(elementsData);

    let bestElement = null;
    let bestScore = 0;

    elementsData.forEach((data) => {
      const totalLinkElements = data.element.querySelectorAll("a").length;
      const totalElements = data.element.querySelectorAll("*").length + 1;
      const linkRatio = totalLinkElements / totalElements;

      if (
        linkRatio < 0.7 &&
        data.totalScore > bestScore &&
        data.element.tagName !== "A"
      ) {
        bestScore = data.totalScore;
        bestElement = data.element;
      }
    });

    if (bestElement) {
      this.logger.log(`best: ${bestElement.tagName}, Score: ${bestScore}`);

      const mainText = this.parseElementIntoTextContent(bestElement);

      return mainText;
    }

    this.logger.error("No best element found.");

    throw this.errorService.handleParseError();
  }
}
