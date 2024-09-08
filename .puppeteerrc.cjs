const { join } = require("path");

module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  headless: "true",
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--single-process",
    "--no-first-run",
    "--disable-gpu",
  ],
};
