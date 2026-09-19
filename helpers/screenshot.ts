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
  // Example:
  // list_tc1_validation_admin
  // → list_validation_admin

  fileName = fileName
    .replace(/(^|_)tc\d+(?=_|$)/i, '')
    .replace(/^_+|_+$/g, '');

  const cleanFileName = toPascalCase(fileName);

  // -----------------------------------------
  // Get test case ID
  // -----------------------------------------

  // Example:
  // TC01 - Login successfully with valid credentials
  // → TC01

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
  // → Step2

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
  // → Enter_Valid_Username

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
  `${folderName}_${testCaseName}_${stepNumber}_${cleanStepName}_${cleanFileName}.png`;

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