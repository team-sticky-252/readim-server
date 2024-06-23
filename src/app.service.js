import { Injectable } from "@nestjs/common";
import jsdom from "jsdom";

import { HttpError, HttpStatus } from "./utils/http";

const EXCLUDED_TAGS_REGEX =
  /^(button|img|nav|aside|footer|audio|canvas|embed|iframe|map|area|noscript|object|option|optgroup|picture|progress|script|select|source|style|svg|meta)$/i;
const MAIN_CONTENT_TAGS_REGEX = /^(main|article|section)$/i;
const ENTER_REGEX = /[\n]/g;
const TAB_REGEX = /[\t]/g;
const WHITESPACE_REGEX = /\s+/g;
const STIE_NAME_REGEX = /https?:\/\/(?:www\.)?([^\.\/]+)/;

@Injectable()
export class AppService {
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
      throw new HttpError(HttpStatus.BAD_URL);
    }
  }

  getReadingTime(bodyElement, wpm) {
    const mainContent = this.getMainContent(bodyElement);

    return this.calculateReadingTime(mainContent, wpm);
  }

  getMainContent(bodyElement) {
    const mainContentElements = this.reduceMainContentElements(bodyElement);

    const contents = mainContentElements.reduce((acc, element) => {
      this.removeExcludedTags(element);
      this.convertElementsWithRules(element);

      return acc.concat(this.parseElementIntoTextContent(element));
    }, []);

    if (contents.length === 0) {
      throw new HttpError(HttpStatus.PARSE_ERROR);
    }

    return contents.join(" ");
  }

  removeExcludedTags(element) {
    const stack = [];
    const descendingChildren = Array.from(element.children).reverse();

    stack.push(...descendingChildren);

    while (stack.length > 0) {
      const currentElement = stack.pop();
      const tagName = currentElement.tagName.toLowerCase();

      if (EXCLUDED_TAGS_REGEX.test(tagName)) {
        const { parentElement } = currentElement;

        parentElement.removeChild(currentElement);
      } else {
        const reversedChildren = Array.from(currentElement.children).reverse();

        stack.push(...reversedChildren);
      }
    }
  }

  convertElementsWithRules(element) {
    const stack = [];
    const descendingChildren = Array.from(element.children).reverse();

    stack.push(...descendingChildren);

    while (stack.length > 0) {
      const currentElement = stack.pop();

      this.addSpaceBetweenTags(currentElement);
      this.convertCodeTagToText(currentElement);

      const reversedChildren = Array.from(currentElement.children).reverse();

      stack.push(...reversedChildren);
    }
  }

  addSpaceBetweenTags(element) {
    if (!element.nextSibling) {
      return;
    }

    const { nextSibling } = element;

    if (nextSibling.nodeType === 3 && nextSibling.textContent === "\n") {
      element.innerHTML += " ";
    } else if (element.nodeType === 1 && nextSibling.nodeType === 1) {
      element.innerHTML += " ";
    }
  }

  convertCodeTagToText(element) {
    const tagName = element.tagName.toLowerCase();

    if (tagName === "pre") {
      const text = this.convertCodeToText(element.textContent);

      element.innerHTML = text;
    }
  }

  reduceMainContentElements(body) {
    const mainContentElements = [];
    const stack = [];
    const reversedBodyChildren = Array.from(body.children).reverse();

    stack.push(...reversedBodyChildren);

    while (stack.length > 0) {
      const currentElement = stack.pop();
      const tagName = currentElement.tagName.toLowerCase();

      if (MAIN_CONTENT_TAGS_REGEX.test(tagName)) {
        mainContentElements.push(currentElement);
      } else if (!EXCLUDED_TAGS_REGEX.test(tagName)) {
        const reversedChildren = Array.from(currentElement.children).reverse();

        stack.push(...reversedChildren);
      }
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
    const CodeText = code
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[{}\[\]\(\)<>\/;┤├┌─┐└┘┬┴┼│\./"/'/`@,:=\-_!|+?$*\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return CodeText;
  }

  calculateReadingTime(articleBody, wpm) {
    const numOfWords = articleBody.split(" ").length;
    const rawReadingTime = (numOfWords / wpm) * 60 * 1000;
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

  getSiteOpenGraph(headElement, url) {
    const title =
      this.getOpenGraph("title", headElement) ||
      headElement.querySelector("title")?.textContent;
    const adress =
      headElement.querySelector("link[rel*='canonical']")?.href || url;
    const siteMatchName = adress.match(STIE_NAME_REGEX);
    const siteName =
      this.getOpenGraph("site_name", headElement) ||
      (siteMatchName && siteMatchName[1]);

    return {
      title,
      siteName,
      url: adress,
      faviconUrl: headElement.querySelector("link[rel*='icon']").href,
    };
  }

  getOpenGraph(property, headElement) {
    const content = headElement.querySelector(
      `meta[property='og:${property}'], meta[name='${property}']`,
    )?.content;

    return content;
  }

  formatHttpURL(url) {
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      return `https://${url}`;
    }

    return url;
  }
}
