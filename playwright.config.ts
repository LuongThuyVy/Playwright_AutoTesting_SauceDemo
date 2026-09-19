import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    headless: false,
    browserName: 'chromium',

    launchOptions: {
      executablePath:
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    },
  },
});