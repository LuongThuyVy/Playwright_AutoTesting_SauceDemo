# Playwright Automation Testing

This project contains automated UI tests using **Playwright + TypeScript**.

The tests are executed using **Brave Browser** instead of Playwright's bundled Chromium.

Test website:

https://www.saucedemo.com/

---

# 1. Tech Stack

- Playwright
- TypeScript
- Node.js
- Brave Browser
- VS Code

---

# 2. Project Structure

```text
playwright1_project/
│
├── helpers/
│   ├── screenshot.ts
│   └── step.ts
│
├── tests/
│   └── Login/
│       └── list_validation_admin.spec.ts
│
├── screenshots/
│   └── Login/
│       ├── Login_List_Validation_Admin_TC01_Step1_Navigate_To_Login_Page.png
│       ├── Login_List_Validation_Admin_TC01_Step2_Enter_Valid_Username.png
│       ├── Login_List_Validation_Admin_TC01_Step3_Enter_Valid_Password.png
│       ├── Login_List_Validation_Admin_TC01_Step4_Click_Login_Button.png
│       └── Login_List_Validation_Admin_TC01_Step5_Verify_Products_Page.png
│
├── codegen.js
├── playwright.config.ts
├── package.json
├── package-lock.json
└── README.md
```

## File / Folder Responsibilities

| File / Folder | Purpose |
|---|---|
| `tests/` | Contains automated test cases |
| `tests/Login/` | Contains login-related test cases |
| `*.spec.ts` | Contains individual test cases |
| `helpers/step.ts` | Custom wrapper for `test.step()` with automatic screenshots |
| `helpers/screenshot.ts` | Creates screenshots and generates screenshot filenames |
| `screenshots/` | Stores screenshots captured after successful test steps |
| `codegen.js` | Launches Brave for Playwright Codegen / Inspector |
| `playwright.config.ts` | Playwright test configuration |
| `package.json` | Project dependencies and scripts |
| `README.md` | Project documentation |

---

# 3. Playwright Test Hierarchy

The basic structure of a Playwright test suite is:

```text
Test Suite
│
└── test.describe()
    │
    ├── test()
    │   │
    │   ├── step()
    │   ├── step()
    │   ├── step()
    │   └── expect()
    │
    ├── test()
    │   │
    │   ├── step()
    │   ├── step()
    │   └── expect()
    │
    └── test()
        │
        ├── step()
        ├── step()
        └── expect()
```

## `test.describe()`

Used to group related test cases into a test suite.

```ts
test.describe('Login Test Suite', () => {

});
```

## `test()`

Represents one individual test case.

```ts
test(
  'TC01 - Login successfully with valid username and valid password',
  async ({ page }) => {

  }
);
```

## `step()`

This project uses a custom `step()` helper instead of calling `test.step()` directly.

The custom `step()` wraps Playwright's `test.step()` and automatically takes a screenshot after the step completes successfully.

```ts
await step(
  page,
  '1. Navigate to Login page',
  async () => {
    await page.goto('https://www.saucedemo.com/');
  }
);
```

The execution flow is:

```text
step()
  │
  ▼
test.step()
  │
  ▼
action()
  │
  ├── Failed
  │     │
  │     └── No screenshot
  │
  └── Successful
        │
        ▼
    capture()
        │
        ▼
    Screenshot
```

Therefore, screenshots are captured **only after successful steps**.

## `expect()`

Used to verify the expected result.

```ts
await expect(page).toHaveURL(/inventory/);
```

---

# 4. Automatic Screenshot System

The project uses two helper files:

```text
helpers/
├── step.ts
└── screenshot.ts
```

## `helpers/step.ts`

The `step()` helper wraps Playwright's `test.step()` and automatically calls `capture()` after the action succeeds.

```ts
import { Page, test } from '@playwright/test';
import { capture } from './screenshot';

export async function step(
  page: Page,
  name: string,
  action: () => Promise<void>
) {
  await test.step(name, async () => {
    await action();
    await capture(page, name);
  });
}
```

The test file does not need to call `capture()` manually.

Instead of:

```ts
await test.step('Enter username', async () => {
  await page.getByPlaceholder('Username').fill('standard_user');
  await capture(page);
});
```

use:

```ts
await step(page, '2. Enter valid username', async () => {
  await page.getByPlaceholder('Username').fill('standard_user');
});
```

---

# 5. Screenshot Helper

## `helpers/screenshot.ts`

The screenshot helper is responsible for:

- Getting the test file path
- Getting the test folder name
- Getting the test filename
- Getting the test case ID
- Getting the step number
- Getting the step name
- Creating the screenshot directory
- Creating the screenshot filename
- Taking the screenshot

```ts
import { Page, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export async function capture(
  page: Page,
  stepName: string
) {
  const testInfo = test.info();

  // -----------------------------------------
  // Get test file
  // -----------------------------------------

  const testFilePath = testInfo.file;

  // -----------------------------------------
  // Get test folder name
  // -----------------------------------------

  const testFolderPath = path.dirname(testFilePath);

  const folderName = toPascalCase(
    path.basename(testFolderPath)
  );

  // -----------------------------------------
  // Get test filename
  // -----------------------------------------

  let fileName = path.basename(
    testFilePath,
    path.extname(testFilePath)
  );

  fileName = fileName
    .replace(/\.spec$/, '')
    .replace(/\.test$/, '');

  // Remove TC number from filename
  //
  // Example:
  // list_tc1_validation_admin
  //
  // becomes:
  // list_validation_admin

  fileName = fileName
    .replace(/(^|_)tc\d+(?=_|$)/i, '')
    .replace(/^_+|_+$/g, '');

  const cleanFileName = toPascalCase(fileName);

  // -----------------------------------------
  // Get test case ID
  // -----------------------------------------

  // Example:
  // TC01 - Login successfully with valid credentials
  //
  // becomes:
  // TC01

  const testCaseMatch =
    testInfo.title.match(/^(TC\d+)/i);

  const testCaseName = testCaseMatch
    ? testCaseMatch[1].toUpperCase()
    : 'TC';

  // -----------------------------------------
  // Get step number
  // -----------------------------------------

  // Example:
  // 2. Enter valid username
  //
  // becomes:
  // Step2

  const stepNumberMatch =
    stepName.match(/^(\d+)\./);

  const stepNumber = stepNumberMatch
    ? `Step${stepNumberMatch[1]}`
    : 'Step';

  // -----------------------------------------
  // Get clean step name
  // -----------------------------------------

  // Example:
  // 2. Enter valid username
  //
  // becomes:
  // Enter_Valid_Username

  const cleanStepName = toPascalCase(
    stepName.replace(/^\d+\.\s*/, '')
  );

  // -----------------------------------------
  // Create screenshot folder
  // -----------------------------------------

  const screenshotFolder = path.join(
    process.cwd(),
    'screenshots',
    folderName
  );

  fs.mkdirSync(screenshotFolder, {
    recursive: true,
  });

  // -----------------------------------------
  // Create screenshot filename
  // -----------------------------------------

  const screenshotName =
    `${folderName}_${cleanFileName}_${testCaseName}_${stepNumber}_${cleanStepName}.png`;

  const screenshotPath = path.join(
    screenshotFolder,
    screenshotName
  );

  // -----------------------------------------
  // Take screenshot
  // -----------------------------------------

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
}

// =====================================================
// Convert text to PascalCase words separated by "_"
// =====================================================

function toPascalCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => {
      return (
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      );
    })
    .join('_');
}
```

---

# 6. Screenshot Naming Convention

Screenshots follow this format:

```text
FolderName_FileName_TCNumber_StepNumber_StepName.png
```

For example:

```text
Login_List_Validation_Admin_TC01_Step2_Enter_Valid_Username.png
```

The filename is generated from:

```text
Login
│
├── Test folder
│
├── List_Validation_Admin
│   └── Test filename
│
├── TC01
│   └── Test case ID
│
├── Step2
│   └── Step number
│
└── Enter_Valid_Username
    └── Step name
```

---

# 7. Complete Test Example

The test file uses the custom `step()` helper.

```ts
import { test, expect } from '@playwright/test';
import { step } from '../../helpers/step';

test.describe('Login Test Suite', () => {

  test(
    'TC01 - Login successfully with valid username and valid password',
    async ({ page }) => {

      await step(
        page,
        '1. Navigate to Login page',
        async () => {
          await page.goto('https://www.saucedemo.com/');
        }
      );

      await step(
        page,
        '2. Enter valid username',
        async () => {
          await page
            .getByPlaceholder('Username')
            .fill('standard_user');
        }
      );

      await step(
        page,
        '3. Enter valid password',
        async () => {
          await page
            .getByPlaceholder('Password')
            .fill('secret_sauce');
        }
      );

      await step(
        page,
        '4. Click Login button',
        async () => {
          await page
            .getByRole('button', { name: 'Login' })
            .click();
        }
      );

      await step(
        page,
        '5. Verify Products page',
        async () => {
          await expect(page).toHaveURL(/inventory/);
        }
      );

    }
  );

});
```

This test contains five steps, so five screenshots will be created:

```text
screenshots/
└── Login/
    ├── Login_List_Validation_Admin_TC01_Step1_Navigate_To_Login_Page.png
    ├── Login_List_Validation_Admin_TC01_Step2_Enter_Valid_Username.png
    ├── Login_List_Validation_Admin_TC01_Step3_Enter_Valid_Password.png
    ├── Login_List_Validation_Admin_TC01_Step4_Click_Login_Button.png
    └── Login_List_Validation_Admin_TC01_Step5_Verify_Products_Page.png
```

---

# 8. Playwright Configuration

The project is configured to use **Brave Browser**.

`playwright.config.ts`:

```ts
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
```

## Why `browserName: 'chromium'`?

Brave is based on Chromium.

Playwright uses the Chromium browser engine while `executablePath` tells Playwright to launch the installed Brave executable.

Therefore:

```text
browserName: 'chromium'
        │
        ▼
Chromium browser engine
        │
        ▼
executablePath
        │
        ▼
Brave Browser
```

This allows the project to run using the installed Brave browser without requiring Playwright's bundled Chromium.

---

# 9. Install Dependencies

After creating or cloning the project, install the required dependencies:

```bash
npm install
```

If Node.js type definitions are required by the helper files:

```bash
npm install -D @types/node
```

---

# 10. Run the Tests

This project does not have a local application server.

The tests run directly against:

```text
https://www.saucedemo.com/
```

To run all automated tests:

```bash
npx playwright test
```

Because the configuration contains:

```ts
headless: false
```

Brave will open while the tests are running.

---

# 11. Run a Specific Test File

For example:

```bash
npx playwright test tests/Login/list_validation_admin.spec.ts
```

---

# 12. Run Playwright Codegen

Playwright Codegen can be used to interact with a website and generate Playwright actions and locators.

Normally, Codegen can be started with:

```bash
npx playwright codegen https://www.saucedemo.com/
```

However, the normal Codegen command attempts to use Playwright's downloaded browser.

This project uses the installed **Brave Browser** instead.

Because Playwright's bundled browser download may not be available, this project uses a custom Codegen script to launch Brave.

---

# 13. Codegen with Brave

The project contains:

```text
codegen.js
```

Contents:

```js
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
})();
```

Run Codegen with:

```bash
node codegen.js
```

This launches:

```text
Brave
  │
  ▼
SauceDemo
  │
  ▼
Playwright Inspector
```

`page.pause()` pauses the page and opens Playwright Inspector.

The Inspector can be used to:

- Pick elements
- Inspect locators
- Generate Playwright actions
- Experiment with selectors
- Debug interactions

---

# 14. Codegen Workflow

The typical workflow is:

```text
Run Codegen
     │
     ▼
node codegen.js
     │
     ▼
Brave opens SauceDemo
     │
     ▼
Playwright Inspector opens
     │
     ▼
Interact with the website
     │
     ▼
Pick elements
     │
     ▼
Inspect / generate locators
     │
     ▼
Copy useful code
     │
     ▼
Add code to *.spec.ts
     │
     ▼
Run the test
     │
     ▼
npx playwright test
```

---

# 15. Example Locators

Playwright Codegen may generate locators such as:

```ts
page.getByPlaceholder('Username')
```

```ts
page.getByPlaceholder('Password')
```

```ts
page.getByRole('button', { name: 'Login' })
```

These can be used in the actual test:

```ts
await page
  .getByPlaceholder('Username')
  .fill('standard_user');

await page
  .getByPlaceholder('Password')
  .fill('secret_sauce');

await page
  .getByRole('button', { name: 'Login' })
  .click();
```

---

# 16. SauceDemo Login Test Cases

The Login test suite contains multiple scenarios:

```text
Login
│
├── TC01 - Valid username + valid password
│
├── TC02 - Blank username + valid password
│
├── TC03 - Valid username + blank password
│
├── TC04 - Blank username + blank password
│
├── TC05 - Wrong username + valid password
│
├── TC06 - Valid username + wrong password
│
├── TC07 - Wrong username + wrong password
│
└── TC08 - Locked-out user
```

These test cases can be grouped inside:

```ts
test.describe('Login Test Suite', () => {

});
```

Each scenario becomes an individual:

```ts
test()
```

Each test can then contain multiple:

```ts
step()
```

and assertions using:

```ts
expect()
```

---

# 17. Important Playwright Commands

## Install project dependencies

```bash
npm install
```

## Run all tests

```bash
npx playwright test
```

## Run a specific test file

```bash
npx playwright test tests/Login/list_validation_admin.spec.ts
```

## Run Codegen with Brave

```bash
node codegen.js
```

## Show the Playwright report

```bash
npx playwright show-report
```

---

# 18. Test Development Workflow

For a new feature, the general workflow is:

```text
1. Identify the test scenario
        │
        ▼
2. Open Codegen
        │
        ▼
3. Explore the website
        │
        ▼
4. Identify elements and locators
        │
        ▼
5. Create the test case
        │
        ▼
6. Add actions using Playwright
        │
        ▼
7. Organize actions into step()
        │
        ▼
8. Add assertions using expect()
        │
        ▼
9. Run the test
        │
        ▼
10. Review screenshots
        │
        ▼
11. Debug failures
        │
        ▼
12. Refine the test
```

---

# 19. Test Step and Screenshot Workflow

Each step follows this process:

```text
.spec.ts
    │
    ▼
step(page, stepName, action)
    │
    ▼
test.step()
    │
    ▼
Execute action
    │
    ├───────────────┐
    │               │
    ▼               ▼
  Failed         Success
    │               │
    ▼               ▼
Stop test       capture()
                    │
                    ▼
              Take screenshot
                    │
                    ▼
              Save screenshot
```

For example:

```ts
await step(
  page,
  '2. Enter valid username',
  async () => {
    await page
      .getByPlaceholder('Username')
      .fill('standard_user');
  }
);
```

If the action succeeds:

```text
Enter username
      ↓
fill()
      ↓
Success
      ↓
capture()
      ↓
Login_List_Validation_Admin_TC01_Step2_Enter_Valid_Username.png
```

If the action fails:

```text
Enter username
      ↓
fill()
      ↓
Failure
      ↓
Test stops
      ↓
No successful-step screenshot
```

---

# 20. Git / GitHub

The project can be version-controlled using Git and pushed to GitHub.

## Check Git status

```bash
git status
```

## Add changes

```bash
git add .
```

## Commit changes

```bash
git commit -m "Update Playwright tests"
```

## Push changes

```bash
git push
```

After making changes, the typical workflow is:

```text
Modify files
    │
    ▼
git status
    │
    ▼
git add .
    │
    ▼
git commit -m "commit message"
    │
    ▼
git push
```

---

# 21. Summary

The main Playwright workflow for this project is:

```text
                         Playwright
                              │
                ┌─────────────┴─────────────┐
                │                           │
             Codegen                    Test Suite
                │                           │
            codegen.js                test.describe()
                │                           │
              Brave                       test()
                │                           │
       Playwright Inspector               step()
                                            │
                                      test.step()
                                            │
                                         action
                                            │
                                      capture()
                                            │
                                      Screenshot
                                            │
                                         expect()
                                            │
                                          Brave
```

## Main Commands

```bash
# Install dependencies
npm install

# Run all tests
npx playwright test

# Run a specific test
npx playwright test tests/Login/list_validation_admin.spec.ts

# Start Codegen with Brave
node codegen.js

# Open test report
npx playwright show-report

# Check Git status
git status

# Push changes to GitHub
git push
```

## Core Project Pattern

The recommended test structure is:

```ts
import { test, expect } from '@playwright/test';
import { step } from '../../helpers/step';

test.describe('Login Test Suite', () => {

  test(
    'TC01 - Login successfully with valid username and valid password',
    async ({ page }) => {

      await step(
        page,
        '1. Navigate to Login page',
        async () => {
          await page.goto('https://www.saucedemo.com/');
        }
      );

      await step(
        page,
        '2. Enter valid username',
        async () => {
          await page
            .getByPlaceholder('Username')
            .fill('standard_user');
        }
      );

      await step(
        page,
        '3. Enter valid password',
        async () => {
          await page
            .getByPlaceholder('Password')
            .fill('secret_sauce');
        }
      );

      await step(
        page,
        '4. Click Login button',
        async () => {
          await page
            .getByRole('button', { name: 'Login' })
            .click();
        }
      );

      await step(
        page,
        '5. Verify Products page',
        async () => {
          await expect(page).toHaveURL(/inventory/);
        }
      );

    }
  );

});
```

This keeps the test case focused on **test actions and expected results**, while `step.ts` and `screenshot.ts` handle the automatic screenshot functionality.
