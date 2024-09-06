const puppeteer = require("puppeteer-core");
const { join } = require("path");

(async () => {
  const browserFetcher = puppeteer.createBrowserFetcher();
  const revisionInfo = await browserFetcher.download("r128.0.6613.119");
  console.log("Puppeteer installed Chrome path:", revisionInfo.executablePath);
})();
