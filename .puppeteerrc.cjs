const { join } = require("path");

module.exports = {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
  executablePath:
    "/opt/render/.cache/puppeteer/chrome/linux-<version>/chrome-linux64/chrome",
  headless: true,
};
