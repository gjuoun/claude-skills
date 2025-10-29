import { expect, type Page, test as setup } from "@playwright/test";
import { existsSync, readFileSync } from "fs";
import path from "node:path";

const authFile = path.resolve(__dirname, "../auth-state.json");

const OKTA_HOME_PAGE = process.env.OKTA_HOME_PAGE || "";
const OKTA_USERNAME = process.env.OKTA_USERNAME || "";

if (!OKTA_HOME_PAGE || !OKTA_USERNAME) {
  console.error("Required environment variables are not set:");
  if (!OKTA_HOME_PAGE) console.error("  - OKTA_HOME_PAGE");
  if (!OKTA_USERNAME) console.error("  - OKTA_USERNAME");
  process.exit(1);
}

async function isAuthStateValid(page: Page) {
  if (!existsSync(authFile)) {
    console.log("Auth state file doesn't exist, running authentication...");
    return false;
  }

  try {
    const authState = JSON.parse(readFileSync(authFile, "utf8"));

    // Check if auth state has required structure
    if (!authState.cookies || !authState.origins) {
      console.log("Auth state file is malformed, running authentication...");
      return false;
    }

    // Create a new context with the existing auth state to test if it's valid
    const context = await page.context()?.browser()?.newContext({
      storageState: authFile,
    });
    const testPage = await context?.newPage();

    try {
      // Try to navigate to the protected page
      await testPage?.goto(OKTA_HOME_PAGE, {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      // Check if we're still logged in by looking for the user button
      const myApps = testPage?.getByRole('link', { name: 'My Apps' })
      const isLoggedIn = await myApps?.isVisible({ timeout: 5000 });

      await context?.close();

      if (isLoggedIn) {
        console.log("Auth state is valid, skipping authentication...");
        return true;
      } else {
        console.log("Auth state is expired, running authentication...");
        return false;
      }
    } catch (error) {
      console.log("Auth state validation failed, running authentication...");
      await context?.close();
      return false;
    }
  } catch (error) {
    console.log("Error reading auth state file, running authentication...");
    return false;
  }
}

setup("authenticate", async ({ page }) => {
  // Check if auth state is valid before running authentication
  const isValid = await isAuthStateValid(page);

  if (isValid) {
    console.log("✅ Authentication skipped - using existing valid auth state");
    return;
  }

  console.log("🔐 Running authentication...");

  // Perform login
  await page.goto(OKTA_HOME_PAGE);

  await page.getByRole("textbox", { name: "Username" }).fill(OKTA_USERNAME);
  await page.getByText("Keep me signed in").click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("link", { name: "Select to get a push" }).click();
  await page.waitForURL(OKTA_HOME_PAGE);
  await expect(page.getByRole('link', { name: 'My Apps' })).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
  console.log("✅ Authentication completed and saved");
});
