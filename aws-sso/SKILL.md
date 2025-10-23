---
name: AWS SSO
description: aws sso login to Okta and ECR with the built-in cli.
---

🔐 AWS SSO and ECR authentication CLI tool

## Available Commands

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

## Help

Get help for any command:
```bash
aws-sso --help
aws-sso login --help
aws-sso ecr-login --help
```
