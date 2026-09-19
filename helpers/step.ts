import { Page, test } from '@playwright/test';
import { capture } from './screenshot';

export async function step(
  page: Page,
  name: string,
  action: () => Promise<void>
) {
  await test.step(name, async () => {
    try {
      await action();
    } finally {
      await capture(page, name);
    }
  });
}