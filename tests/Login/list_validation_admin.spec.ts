import { test, expect } from '@playwright/test';
import { step } from '../../helpers/step';

test.describe('Login Test Suite', () => {

  test(
    'TC01 - Login successfully with valid credentials',
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