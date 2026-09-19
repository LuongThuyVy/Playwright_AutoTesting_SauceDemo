import { Page, test } from '@playwright/test';
import { capture } from './screenshot';

export async function step(
  page: Page,
  name: string,
  action: () => Promise<void>
) {
  await test.step(name, async () => {
    await action();

    // Screenshot only if the step succeeded
    await capture(page, name);
  });
}