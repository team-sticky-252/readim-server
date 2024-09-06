const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch();
    console.log("Puppeteer is using Chrome from:", browser._process.spawnfile);
    await browser.close();
  } catch (error) {
    console.error("Error launching Puppeteer:", error);
  }
})();
