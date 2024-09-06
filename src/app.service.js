import { Injectable, Dependencies } from "@nestjs/common";
import jsdom from "jsdom";

import { ErrorService } from "./common/exceptions/error.service";

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
@Dependencies(ErrorService)
export class AppService {
  constructor(errorService) {
    this.errorService = errorService;
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
      throw this.errorService.handleBadUrlError();
    }
  }

  getMainContent(bodyElement, url) {
    const mainContent = this.getSemanticMainContent(bodyElement);

    if (mainContent !== "") return mainContent;

    if (url.includes("velog.io")) {
      return this.getVelogMainContent(bodyElement);
    }

    if (url.includes("tistory.com")) {
      return this.getTistoryMainContent(bodyElement);
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

      if (EXCLUDED_TAGS_REGEX.test(tagName)) {
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
    const stack = Array.from(element.children).reverse();

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
}
