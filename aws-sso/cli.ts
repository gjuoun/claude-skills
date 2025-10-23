#!/usr/bin/env bun
import { $ } from "bun";
import { command, option, run, string, subcommands } from "cmd-ts";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from the script's directory
config({ path: resolve(import.meta.dir, ".env") });

// Okta authentication command - runs the setup project
const oktaCommand = command({
  name: "okta",
  description: "🔐 Authenticate with Okta and save auth state",
  args: {},
  handler: async () => {
    console.log("🔐 Starting Okta authentication...");

    const proc = Bun.spawn(
      ["bunx", "playwright", "test", "--project=setup", "tests/okta.spec.ts"],
      {
        cwd: import.meta.dir,
        env: process.env,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      }
    );

    const exitCode = await proc.exited;
    if (exitCode === 0) {
      console.log("✅ Okta authentication completed successfully");
    }
    process.exit(exitCode);
  },
});

// AWS SSO login command - runs the chromium project with profile
const loginCommand = command({
  name: "login",
  description: "🔑 Login to AWS SSO with specified profile(s)",
  args: {
    profile: option({
      type: string,
      long: "profile",
      description:
        "AWS profile to use (dev, qa, prod, or all). 'all' runs all profiles",
    }),
  },
  handler: async ({ profile }) => {
    if (profile === "all") {
      console.log("🔐 Running AWS SSO login for all profiles concurrently...");

      const profiles = ["dev", "qa", "prod"];

      // Spawn all processes concurrently
      const processes = profiles.map((p) => {
        console.log(`🔑 Starting login for profile: ${p}`);
        return {
          profile: p,
          proc: Bun.spawn(
            [
              "bun",
              "run",
              "test",
              "--project=chromium",
            ],
            {
              cwd: import.meta.dir,
              env: { ...process.env, AWS_PROFILE: p },
              stdin: "inherit",
              stdout: "inherit",
              stderr: "inherit",
            }
          ),
        };
      });

      // Wait for all processes to complete
      const results = await Promise.all(
        processes.map(async ({ profile: p, proc }) => {
          const exitCode = await proc.exited;
          return { profile: p, exitCode };
        })
      );

      // Check results
      console.log("\n📊 Login Results:");
      let hasFailures = false;
      for (const { profile: p, exitCode } of results) {
        if (exitCode === 0) {
          console.log(`✅ Successfully logged in to profile: ${p}`);
        } else {
          console.error(`❌ Failed to login to profile: ${p}`);
          hasFailures = true;
        }
      }

      if (hasFailures) {
        process.exit(1);
      }
    } else {
      console.log(`🔐 Starting AWS SSO login for profile: ${profile}`);

      const proc = Bun.spawn(
        [
          "bun",
          "run",
          "test",
          "--project=chromium",
        ],
        {
          cwd: import.meta.dir,
          env: { ...process.env, AWS_PROFILE: profile },
          stdin: "inherit",
          stdout: "inherit",
          stderr: "inherit",
        }
      );

      const exitCode = await proc.exited;
      if (exitCode === 0) {
        console.log(`✅ Successfully logged in to profile: ${profile}`);
      }
      process.exit(exitCode);
    }
  },
});

// Helper function for ECR login
async function runEcrLogin() {
  const { ECR_AWS_REGION, ECR_AWS_PROFILE, ECR_REGISTRY_URL } = process.env;

  if (!ECR_AWS_REGION || !ECR_AWS_PROFILE || !ECR_REGISTRY_URL) {
    console.error("❌ Missing required environment variables for ECR login:");
    if (!ECR_AWS_REGION) console.error("  - ECR_AWS_REGION");
    if (!ECR_AWS_PROFILE) console.error("  - ECR_AWS_PROFILE");
    if (!ECR_REGISTRY_URL) console.error("  - ECR_REGISTRY_URL");
    process.exit(1);
  }

  console.log(`🐳 Logging into ECR registry: ${ECR_REGISTRY_URL}`);

  try {
    const result = await $`
      aws ecr get-login-password --region ${ECR_AWS_REGION} --profile ${ECR_AWS_PROFILE} | \
      docker login --username AWS --password-stdin ${ECR_REGISTRY_URL}
    `.text();

    console.log(result);
    console.log("✅ ECR login successful");
  } catch (error) {
    console.error("❌ ECR login failed:", error);
    process.exit(1);
  }
}

// ECR login command
const ecrLoginCommand = command({
  name: "ecr-login",
  description: "🐳 Login to AWS ECR Docker registry",
  args: {},
  handler: async () => {
    await runEcrLogin();
  },
});

// Main app with all commands
const app = subcommands({
  name: "aws-sso",
  description: "🔐 AWS SSO and ECR authentication tool",
  version: "1.0.0",
  cmds: {
    okta: oktaCommand,
    login: loginCommand,
    "ecr-login": ecrLoginCommand,
  },
});

run(app, process.argv.slice(2));
