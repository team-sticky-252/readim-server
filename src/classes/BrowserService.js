import puppeteer from "puppeteer";

export default class BrowserService {
  constructor() {
    if (!BrowserService.instance) {
      this.headlessBrowser = null;
      this.browserCloseTimeout = null;
    }
  }

  static getInstance() {
    if (!BrowserService.instance) {
      BrowserService.instance = new BrowserService();
    }

    return BrowserService.instance;
  }

  async startBrowser() {
    if (!this.headlessBrowser || !this.headlessBrowser.isConnected()) {
      this.headlessBrowser = await puppeteer.launch();
    }
  }

  async visitPage(url) {
    await this.startBrowser();

    const page = await this.headlessBrowser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        ["image", "stylesheet", "font", "media"].includes(
          request.resourceType(),
        )
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, { waitUntil: "networkidle0" });

    const iframeElement = await page.$("iframe#mainFrame");

    let content;

    if (iframeElement) {
      const frame = await iframeElement.contentFrame();
      content = await frame.content();
    } else {
      content = await page.content();
    }

    return content;
  }

  startBrowserCloseTimer() {
    if (this.browserCloseTimeout) {
      clearTimeout(this.browserCloseTimeout);
    }

    this.browserCloseTimeout = setTimeout(async () => {
      if (this.headlessBrowser && this.headlessBrowser.isConnected()) {
        await this.headlessBrowser.close();
      }
    }, 300000);
  }
}
