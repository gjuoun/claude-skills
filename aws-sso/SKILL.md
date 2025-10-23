---
name: AWS SSO
description: aws sso login to Okta and ECR with the built-in cli.
---

Follow the steps login to aws sso Okta, and login to ECR registry with the built-in cli.

Step 1. login to aws sso with the dev profile

```bash
./aws-sso.ts dev
```

Step 2. parallal login to aws sso with the prod, qa, and ops profile

```bash
./aws-sso.ts prod &
./aws-sso.ts qa &
./aws-sso.ts ops &
wait
```

Step 3. Login to ECR with the ops profile

```bash
./ecr-login.ts
```
