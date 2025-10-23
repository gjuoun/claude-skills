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

### 3. Environment Variables

Create a `.env` file with the following variables:

```bash
# Okta Configuration
OKTA_HOME_PAGE=https://your-okta-domain.okta.com
OKTA_USERNAME=your-username

# AWS ECR Configuration
ECR_AWS_REGION=us-east-1
ECR_AWS_PROFILE=your-profile
ECR_REGISTRY_URL=123456789.dkr.ecr.us-east-1.amazonaws.com
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

### 4. Link CLI Tool Globally

Link the CLI tool globally to use `aws-sso` command from anywhere:

```bash
bun link
```

## Usage

### 1. Okta Authentication

Authenticate with Okta and save auth state:

```bash
aws-sso okta
```

### 2. AWS SSO Login

Login to AWS SSO with a specific profile:

```bash
# Login to dev profile
aws-sso login --profile dev

# Login to qa profile
aws-sso login --profile qa

# Login to prod profile
aws-sso login --profile prod

# Login to all profiles concurrently (dev, qa, prod)
aws-sso login --profile all
```

### 3. ECR Docker Registry Login

Login to AWS ECR registry:

```bash
aws-sso ecr-login
```

### Help

Get help for any command:

```bash
aws-sso --help
aws-sso login --help
aws-sso ecr-login --help
```

## How It Works

### Okta Authentication (`aws-sso okta`)
1. Runs Playwright setup project
2. Authenticates with Okta credentials
3. Saves authentication state to `auth-state.json`
4. Reuses cached auth state on subsequent runs

### AWS SSO Login (`aws-sso login`)
1. Runs AWS CLI SSO login command with `--no-browser`
2. Captures the device authorization URL
3. Automates browser login using cached Okta auth
4. Completes the authentication flow
5. When using `--profile all`, runs all profiles concurrently

### ECR Login (`aws-sso ecr-login`)
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

Bun automatically loads `.env` files. If you still have issues, ensure your `.env` file is in the correct directory and properly formatted.

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
