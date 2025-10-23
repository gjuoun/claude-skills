# AWS SSO Login Automation

Automate AWS SSO login to Okta and ECR registry using Playwright and Bun.

## Prerequisites

- [Bun](https://bun.sh/) runtime installed
- AWS CLI configured with SSO profiles
- Docker installed (for ECR login)

## Installation

### 1. Install Dependencies

```bash
bun install
```

### 2. Install Playwright Browser

```bash
bunx playwright install chromium
```

Or use the npm script:

```bash
bun run preinstall
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Okta Configuration
OKTA_HOME_PAGE=https://your-org.okta.com/app/UserHome
OKTA_USERNAME=your.email@company.com

# AWS ECR Configuration
ECR_AWS_REGION=us-west-2
ECR_AWS_PROFILE=ops
ECR_REGISTRY_URL=123456789012.dkr.ecr.us-west-2.amazonaws.com
```

## Usage

### AWS SSO Login

Login to AWS SSO with a specific profile:

```bash
./aws-sso.ts dev
```

### Parallel SSO Login (Multiple Profiles)

Login to multiple profiles simultaneously:

```bash
./aws-sso.ts prod &
./aws-sso.ts qa &
./aws-sso.ts ops &
wait
```

### ECR Registry Login

Login to AWS ECR registry:

```bash
bun --env-file=.env run ecr-login.ts
```

Or make the file executable and run directly:

```bash
chmod +x ecr-login.ts
./ecr-login.ts
```

## How It Works

### AWS SSO Login (`aws-sso.ts`)
1. Runs AWS CLI SSO login command
2. Captures the device authorization URL
3. Automates browser login through Okta
4. Completes the authentication flow

### ECR Login (`ecr-login.ts`)
1. Loads credentials from environment variables
2. Gets ECR login password via AWS CLI
3. Authenticates Docker with ECR registry

## Troubleshooting

### Playwright Browser Issues

If you encounter browser issues, reinstall Playwright:

```bash
bunx playwright install --force chromium
```

### Authentication State

Authentication state is cached in `auth-state.json`. If you encounter login issues, delete this file:

```bash
rm auth-state.json
```

### Environment Variables Not Loading

Make sure to run ECR login with the `--env-file` flag:

```bash
bun --env-file=.env run ecr-login.ts
```

## Security Notes

- `.env` file contains sensitive information and is gitignored
- Never commit `.env` or `auth-state.json` to version control
- AWS credentials remain in `~/.aws/credentials` (not in `.env`)

## Development

Run tests:

```bash
bun test
```

Run tests with environment variables:

```bash
bun --env-file=.env run playwright test
```
