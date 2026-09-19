import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'alaways' }],
  ],

  use: {
    headless: false,

    browserName: 'chromium',

    launchOptions: {
      executablePath:
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    },
  },
});

