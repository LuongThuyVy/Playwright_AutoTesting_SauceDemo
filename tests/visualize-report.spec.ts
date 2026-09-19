import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('visualize-report', async () => {

  // ==================================================
  // Paths
  // ==================================================

  // screenshots/
  const screenshotRoot = path.join(
    process.cwd(),
    'screenshots'
  );

  // report.html will be generated directly inside
  // screenshots/
  const outputFolder = screenshotRoot;

  if (!fs.existsSync(screenshotRoot)) {
    throw new Error(
      `Screenshot folder not found: ${screenshotRoot}`
    );
  }

  // ==================================================
  // Find ALL image files recursively
  // ==================================================

  const screenshots = findImages(screenshotRoot);

  if (screenshots.length === 0) {
    throw new Error(
      `No screenshots found inside ${screenshotRoot}`
    );
  }

  console.log(
    `Found ${screenshots.length} screenshots.`
  );

  // ==================================================
  // Parse screenshot filenames
  // ==================================================

  type StepData = {
    stepNumber: number;
    stepName: string;
    file: string;
  };

  type TestData = {
    testCase: string;
    testName: string;
    screen: string;
    steps: Map<number, StepData>;
  };

  /*
    IMPORTANT:

    The key is:

      screen + TC

    instead of just:

      TC

    This prevents:

      login/TC01

      product/TC01

    from being merged together.
  */

  const testCases = new Map<string, TestData>();

  // ==================================================
  // Keep track of all screens
  // ==================================================

  const screens = new Set<string>();

  // ==================================================
  // Read testcase names from Playwright test files
  // ==================================================

  const testNames = findTestNames(process.cwd());

  // ==================================================
  // Read every screenshot
  // ==================================================

  for (const filePath of screenshots) {

    const fileName = path.basename(filePath);

    const parsed = parseScreenshotName(fileName);

    if (!parsed) {
      console.log(
        `Skipping unrecognized filename: ${fileName}`
      );

      continue;
    }

    // --------------------------------------------------
    // SCREEN = actual parent folder
    //
    // Example:
    //
    // screenshots/login/image.png
    //
    // screen = login
    // --------------------------------------------------

    const relativeDirectory = path.relative(
      screenshotRoot,
      path.dirname(filePath)
    );

    const screen =
      relativeDirectory === ''
        ? 'root'
        : relativeDirectory.split(path.sep)[0];

    const {
      testCase,
      stepNumber,
      stepName,
    } = parsed;

    screens.add(screen);

    // --------------------------------------------------
    // Unique testcase key
    // --------------------------------------------------

    const testKey =
      `${screen}::${testCase}`;

    // --------------------------------------------------
    // Create testcase if necessary
    // --------------------------------------------------

    if (!testCases.has(testKey)) {
      testCases.set(testKey, {
        testCase,
        testName: testNames[testCase] ?? '',
        screen,
        steps: new Map(),
      });
    }

    const testData =
      testCases.get(testKey)!;

    // --------------------------------------------------
    // Add step
    // --------------------------------------------------

    testData.steps.set(stepNumber, {
      stepNumber,
      stepName,
      file: filePath,
    });
  }

  // ==================================================
  // Sort test cases
  // ==================================================

  const sortedTests =
    [...testCases.values()].sort((a, b) => {

      // First sort by screen
      const screenCompare =
        a.screen.localeCompare(b.screen);

      if (screenCompare !== 0) {
        return screenCompare;
      }

      // Then TC01, TC02, TC10...
      return compareTestCases(
        a.testCase,
        b.testCase
      );
    });

  // ==================================================
  // Sort screens
  // ==================================================

  const sortedScreens =
    [...screens].sort((a, b) =>
      a.localeCompare(b)
    );

  // ==================================================
  // Generate test case HTML
  // ==================================================

  const testCasesHTML =
    sortedTests
      .map((testData, index) => {

        const stepsHTML =
          [...testData.steps.values()]
            .sort(
              (a, b) =>
                a.stepNumber -
                b.stepNumber
            )
            .map((step) => {

              // ==================================================
              // IMPORTANT IMAGE PATH LOGIC
              // ==================================================
              //
              // report.html:
              //
              // screenshots/report.html
              //
              // image:
              //
              // screenshots/login/image.png
              //
              // Result:
              //
              // login/image.png
              // ==================================================

              const relativeImagePath =
                path.relative(
                  outputFolder,
                  step.file
                );

              /*
                Convert Windows "\\" to "/" so
                the path works correctly in HTML.
              */

              const imageSrc =
                relativeImagePath
                  .split(path.sep)
                  .map(
                    segment =>
                      encodeURIComponent(segment)
                  )
                  .join('/');

              return `
                <div
                  class="step"
                  data-screen="${escapeHTML(
                    testData.screen
                  )}"
                >

                  <div class="step-header">

                    <span class="step-number">
                      Step ${step.stepNumber}
                    </span>

                    <span class="step-name">
                      ${escapeHTML(
                        step.stepName
                      )}
                    </span>

                  </div>

                  <div class="image-container">

                    <img
                      src="${imageSrc}"
                      alt="${escapeHTML(
                        step.stepName
                      )}"
                      onclick="openImage(this.src)"
                      onerror="handleImageError(this)"
                    />

                    <div class="image-error">

                      Unable to load screenshot:

                      <code>
                        ${escapeHTML(
                          relativeImagePath
                        )}
                      </code>

                    </div>

                  </div>

                </div>
              `;
            })
            .join('');

        return `
          <section
            class="test-case"
            data-screen="${escapeHTML(
              testData.screen
            )}"
          >

            <div class="test-header">

              <div class="test-number">
                ${index + 1}
              </div>

              <div>

                <!-- Screen -->
                <div class="folder">

                  Screen:

                  <code>
                    ${escapeHTML(
                      testData.screen
                    )}
                  </code>

                </div>

                <!-- Test case -->
                <h2>

                  <span class="test-case-number">
                    ${escapeHTML(
                      testData.testCase
                    )}
                  </span>

                  <span class="test-case-name">
                    ${escapeHTML(
                      testData.testName
                    )}
                  </span>

                </h2>

              </div>

            </div>

            <div class="steps">
              ${stepsHTML}
            </div>

          </section>
        `;
      })
      .join('');

  // ==================================================
  // Screen dropdown options
  // ==================================================

  const screenOptions =
    sortedScreens
      .map(
        (screen) => `
          <option value="${escapeHTML(
            screen
          )}">
            ${escapeHTML(screen)}
          </option>
        `
      )
      .join('');

  // ==================================================
  // Generate HTML
  // ==================================================

  const html = `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>Playwright Visual Report</title>

<style>

/* ==================================================
   Base
================================================== */

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 40px;
  background: #20242b;
  color: #e8eaed;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.container {
  max-width: 1400px;
  margin: auto;
}


/* ==================================================
   Header
================================================== */

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h1 {
  margin: 0 0 8px;
  font-size: 40px;
  color: #ffffff;
}

.summary {
  color: #aeb4be;
  margin-bottom: 25px;
}


/* ==================================================
   Screen Filter
================================================== */

.filter-container {
  background: #2b3038;
  border: 1px solid #3a414c;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 30px;
  box-shadow:
    0 4px 14px rgba(0,0,0,.25);
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-container label {
  font-size: 14px;
  font-weight: 600;
  color: #d8dce2;
}

#screenFilter {
  min-width: 320px;
  padding: 10px 14px;
  border: 1px solid #505865;
  border-radius: 8px;
  background: #20242b;
  color: #f1f3f5;
  font-size: 15px;
  cursor: pointer;
}

#screenFilter:focus {
  outline: none;
  border-color: #8b95a5;
}


/* ==================================================
   Test Case
================================================== */

.test-case {
  background: #303640;
  border: 1px solid #424a56;
  border-radius: 16px;
  margin-bottom: 30px;
  padding: 25px;
  box-shadow:
    0 5px 18px rgba(0,0,0,.22);
}

.test-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 25px;
}

.test-number {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: #667085;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-top: 5px;
}


/* ==================================================
   Screen
================================================== */

.folder {
  color: #ffffff;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 8px;
}

.folder code {
  background: #20242b;
  color: #ffffff;
  padding: 4px 10px;
  border-radius: 8px;
  font: inherit;
}


/* ==================================================
   Testcase Name
================================================== */

.test-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 500;
  color: #c4c9d1;
}

.test-case-number {
  background: #667085;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.test-case-name {
  color: #c4c9d1;
}


/* ==================================================
   Steps
================================================== */

.step {
  background: #252a32;
  border-top:
    1px solid #424a56;
  padding: 25px 20px;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.step-number {
  font-size: 13px;
  font-weight: 600;
  background: #3b424d;
  color: #dce1e7;
  padding: 5px 9px;
  border-radius: 6px;
}

.step-name {
  font-size: 16px;
  font-weight: 500;
  color: #e6e9ed;
}


/* ==================================================
   Screenshot
================================================== */

.image-container {
  width: 100%;
}

.image-container img {
  max-width: 100%;
  max-height: 700px;
  border-radius: 8px;
  border:
    1px solid #505865;
  cursor: pointer;
  display: block;
}

.image-container img:hover {
  opacity: .9;
}

.image-error {
  display: none;
  margin-top: 10px;
  padding: 12px;
  background: #252a32;
  border:
    1px dashed #596270;
  border-radius: 8px;
  color: #aeb4be;
  font-size: 13px;
}

.image-error code {
  word-break: break-all;
}


/* ==================================================
   Empty State
================================================== */

.empty-state {
  display: none;
  background: #303640;
  border: 1px solid #424a56;
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  color: #aeb4be;
}

.empty-state h2 {
  margin-bottom: 8px;
  color: #ffffff;
}


/* ==================================================
   Image Viewer
================================================== */

.viewer {
  display: none;
  position: fixed;
  inset: 0;
  background:
    rgba(0,0,0,.94);
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 40px;
}

.viewer img {
  max-width: 95%;
  max-height: 90%;
  object-fit: contain;
}

.close {
  position: fixed;
  top: 20px;
  right: 30px;
  color: white;
  font-size: 40px;
  cursor: pointer;
}

</style>

</head>

<body>

<div class="container">

  <!-- ==================================================
       Header
  ================================================== -->

  <div class="header">

    <h1>
      Playwright Visual Report
    </h1>

    <div class="summary">

      ${sortedTests.length}
      test cases ·

      ${screenshots.length}
      screenshots ·

      ${sortedScreens.length}
      screens

    </div>

  </div>


  <!-- ==================================================
       Screen Filter
  ================================================== -->

  <div class="filter-container">

    <label for="screenFilter">
      Screen:
    </label>

    <select id="screenFilter">

      <option value="all">
        All Screens
      </option>

      ${screenOptions}

    </select>

  </div>


  <!-- ==================================================
       Test Cases
  ================================================== -->

  <div id="reportContent">

    ${testCasesHTML}

  </div>


  <!-- ==================================================
       Empty State
  ================================================== -->

  <div
    id="emptyState"
    class="empty-state"
  >

    <h2>
      No screenshots found
    </h2>

    <p>
      There are no screenshots
      for this screen.
    </p>

  </div>

</div>


<!-- ==================================================
     Image Viewer
================================================== -->

<div
  class="viewer"
  id="viewer"
  onclick="closeImage()"
>

  <span
    class="close"
    onclick="closeImage()"
  >

    &times;

  </span>

  <img
    id="viewerImage"
    onclick="event.stopPropagation()"
  >

</div>


<script>

/* ==================================================
   Screen Filter
================================================== */

const screenFilter =
  document.getElementById(
    'screenFilter'
  );

const testCases =
  document.querySelectorAll(
    '.test-case'
  );

const emptyState =
  document.getElementById(
    'emptyState'
  );


screenFilter.addEventListener(
  'change',
  function() {

    const selectedScreen =
      this.value;

    let visibleCount = 0;


    testCases.forEach(
      function(testCase) {

        const screen =
          testCase.dataset.screen;


        if (
          selectedScreen === 'all' ||
          screen === selectedScreen
        ) {

          testCase.style.display =
            'block';

          visibleCount++;

        } else {

          testCase.style.display =
            'none';

        }

      }
    );


    if (visibleCount === 0) {

      emptyState.style.display =
        'block';

    } else {

      emptyState.style.display =
        'none';

    }

  }
);


/* ==================================================
   Image Error Handler
================================================== */

function handleImageError(image) {

  image.style.display =
    'none';

  const errorMessage =
    image.parentElement.querySelector(
      '.image-error'
    );

  if (errorMessage) {

    errorMessage.style.display =
      'block';

  }

}


/* ==================================================
   Image Viewer
================================================== */

function openImage(src) {

  const viewer =
    document.getElementById(
      'viewer'
    );

  const image =
    document.getElementById(
      'viewerImage'
    );

  image.src = src;

  viewer.style.display =
    'flex';

}


function closeImage() {

  document.getElementById(
    'viewer'
  ).style.display =
    'none';

  document.getElementById(
    'viewerImage'
  ).src = '';

}


/* ==================================================
   ESC to Close
================================================== */

document.addEventListener(
  'keydown',
  function(event) {

    if (event.key === 'Escape') {

      closeImage();

    }

  }
);

</script>

</body>

</html>
`;

  // ==================================================
  // Write report.html
  // ==================================================

  const reportPath =
    path.join(
      outputFolder,
      'report.html'
    );

  fs.writeFileSync(
    reportPath,
    html,
    'utf8'
  );

  // ==================================================
  // Console output
  // ==================================================

  console.log('');

  console.log(
    '======================================'
  );

  console.log(
    ' Visual report generated successfully'
  );

  console.log(
    '======================================'
  );

  console.log(
    `Test cases: ${sortedTests.length}`
  );

  console.log(
    `Screenshots: ${screenshots.length}`
  );

  console.log(
    `Screens: ${sortedScreens.length}`
  );

  console.log('');

  console.log(
    `Report: ${reportPath}`
  );

  console.log('');

  console.log(
    `Open: file://${reportPath}`
  );

  console.log('');

});


/* ==================================================
   Find images recursively
================================================== */

function findImages(
  folder: string
): string[] {

  const results: string[] = [];

  const entries =
    fs.readdirSync(
      folder,
      {
        withFileTypes: true,
      }
    );

  for (const entry of entries) {

    const fullPath =
      path.join(
        folder,
        entry.name
      );

    if (entry.isDirectory()) {

      results.push(
        ...findImages(fullPath)
      );

    } else if (
      /\.(png|jpg|jpeg|webp)$/i.test(
        entry.name
      )
    ) {

      results.push(fullPath);

    }

  }

  return results;
}


/* ==================================================
   Find testcase names from Playwright test files
================================================== */

function findTestNames(
  folder: string
): Record<string, string> {

  const testNames: Record<string, string> = {};

  function scanDirectory(
    directory: string
  ) {

    const entries =
      fs.readdirSync(
        directory,
        {
          withFileTypes: true,
        }
      );

    for (const entry of entries) {

      const fullPath =
        path.join(
          directory,
          entry.name
        );

      // Skip folders that are not relevant
      if (
        entry.isDirectory() &&
        (
          entry.name === 'node_modules' ||
          entry.name === 'screenshots' ||
          entry.name === 'test-results' ||
          entry.name === 'playwright-report'
        )
      ) {
        continue;
      }

      if (entry.isDirectory()) {

        scanDirectory(fullPath);

        continue;
      }

      // Only inspect Playwright/TypeScript test files
      if (
        !(
          entry.name.endsWith('.spec.ts') ||
          entry.name.endsWith('.test.ts')
        )
      ) {
        continue;
      }

      const content =
        fs.readFileSync(
          fullPath,
          'utf8'
        );

      /*
        Example:

        test(
          'TC01 - Login successfully with valid username and valid password',
          async ({ page }) => {
        )

        Extracts:

          testCase = TC01

          testName =
            Login successfully with valid username and valid password
      */

      const regex =
        /test\s*\(\s*(['"])(.*?)\1\s*,/gs;

      let match;

      while (
        (match = regex.exec(content)) !== null
      ) {

        const title =
          match[2].trim();

        const separatorIndex =
          title.indexOf(' - ');

        if (separatorIndex === -1) {
          continue;
        }

        const testCase =
          title
            .substring(
              0,
              separatorIndex
            )
            .trim()
            .toUpperCase();

        const testName =
          title
            .substring(
              separatorIndex + 3
            )
            .trim();

        if (
          /^TC\d+$/i.test(testCase)
        ) {

          testNames[testCase] =
            testName;

        }

      }

    }

  }

  scanDirectory(folder);

  return testNames;
}


/* ==================================================
   Parse screenshot filename
================================================== */

function parseScreenshotName(
  fileName: string
) {

  /*
    Example filename:

    Login_List_Validation_Admin_TC02_Step1_Leave_Username_Blank.png

    We extract:

      TC02
      Step 1
      Leave Username Blank

    We DO NOT use "Login_List_Validation_Admin"
    as the screen.

    The screen comes from the actual folder:

      screenshots/login/

    This is important because your real structure
    uses the parent folder as the screen.
  */

  const extensionRemoved =
    fileName.replace(
      /\.[^/.]+$/,
      ''
    );

  const match =
    extensionRemoved.match(
      /^(.*?)_(TC\d+)_Step(\d+)_(.+)$/i
    );

  if (!match) {
    return null;
  }

  const testCase =
    match[2].toUpperCase();

  const stepNumber =
    Number(match[3]);

  const stepName =
    match[4]
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  return {
    testCase,
    stepNumber,
    stepName,
  };
}


/* ==================================================
   Sort TC01, TC02, TC10 correctly
================================================== */

function compareTestCases(
  a: string,
  b: string
) {

  const aNumber =
    Number(
      a.replace(/\D/g, '')
    );

  const bNumber =
    Number(
      b.replace(/\D/g, '')
    );

  return aNumber - bNumber;
}


/* ==================================================
   Escape HTML
================================================== */

function escapeHTML(
  value: string
): string {

  return value
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}