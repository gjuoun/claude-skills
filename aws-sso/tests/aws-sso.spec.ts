import { expect, test } from "@playwright/test";
import { spawn } from "child_process";

test("AWS SSO Login Automation", async ({ page }) => {
  // Get AWS profile from environment variable, default to 'prod'
  const awsProfile = process.env.AWS_PROFILE || "prod";

  console.log(`🔧 Using AWS profile: ${awsProfile}`);

  // Step 1: Run aws sso login --profile <profile>
  const awsProcess = spawn(
    "aws",
    ["sso", "login", "--profile", awsProfile, "--no-browser"],
    {
      // stdin, stdout, stderr are all pipes (default)
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  let deviceUrl = "";

  // Capture output from AWS CLI
  let urlNavigated = false;

  const captureOutput = new Promise<void>((resolve, reject) => {
    let output = "";

    awsProcess.stdout.on("data", async (data) => {
      const text = data.toString();
      output += text;

      // Extract device URL with user_code parameter for autofill
      const urlMatch = text.match(/(https:\/\/[^\s]+user_code=[A-Z0-9-]+)/);
      if (urlMatch && !urlNavigated) {
        console.log("AWS CLI--------------------------------");
        console.log(text);
        console.log("---------------------------------------");

        deviceUrl = urlMatch[1];
        console.log("Extracted device URL with user_code:", deviceUrl);
        urlNavigated = true;

        // Navigate to the device URL immediately
        console.log("Navigating to AWS SSO device URL...");
        await page.goto(deviceUrl);

        // Wait for the page to load and code to be autofilled
        await page.waitForLoadState("networkidle");

        await page.getByRole("button", { name: "Accept all cookies" }).click();

        console.log("Click confirm and continue button...");

        await page
          .getByRole("button", { name: "Confirm and continue" })
          .click();

        console.log("Click allow access button...");

        await expect(page.getByTestId("allow-access-button")).toBeVisible();
        await page.getByRole("button", { name: "Allow access" }).click();

        // done
        console.log("Done - AWS SSO login completed successfully!");
        await page.waitForLoadState("networkidle");
      }
    });

    awsProcess.stderr.on("data", (data) => {
      console.error("AWS CLI Error:", data.toString());
    });

    awsProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`AWS CLI exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });

  // Wait for AWS CLI to provide and enter the verification code
  await captureOutput;
});
