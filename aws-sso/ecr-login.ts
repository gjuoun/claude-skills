#!/usr/bin/env bun
import { $ } from "bun";

const { ECR_AWS_REGION, ECR_AWS_PROFILE, ECR_REGISTRY_URL } = process.env;

console.log(`🔐 Logging into ECR registry: ${ECR_REGISTRY_URL}`);

// Use Bun.spawn with inherited stdio for real-time output
const result = await $`
aws ecr get-login-password --region ${ECR_AWS_REGION} --profile ${ECR_AWS_PROFILE} | \
docker login --username AWS --password-stdin ${ECR_REGISTRY_URL}
`.text();

console.log(result);
