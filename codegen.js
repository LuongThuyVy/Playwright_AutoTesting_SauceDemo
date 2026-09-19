const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath:
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.saucedemo.com/');

  await page.pause();

  await browser.close();
})();

//run: node codegen.js