#!/usr/bin/env bun
const profile = process.argv[2] || "dev";

console.log(`🔐 Starting AWS SSO login for profile: ${profile}`);

// Use Bun.spawn with inherited stdio for real-time output
const proc = Bun.spawn(
  ["bunx", "playwright", "test", "--project=chromium", "tests/aws-sso.spec.ts"],
  {
    env: { ...process.env, AWS_PROFILE: profile },
    stdin: "inherit",  // Allow stdin passthrough
    stdout: "inherit", // Show output in real-time
    stderr: "inherit", // Show errors in real-time
  }
);

const exitCode = await proc.exited;
process.exit(exitCode);
