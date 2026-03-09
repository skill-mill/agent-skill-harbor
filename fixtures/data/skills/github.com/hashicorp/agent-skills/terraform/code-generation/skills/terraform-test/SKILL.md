---
name: terraform-test
description: "Comprehensive guide for writing and running Terraform tests. Use when creating test files (.tftest.hcl), writing test scenarios with run blocks, validating infrastructure behavior with assertions, mocking providers and data sources."
metadata:
  copyright: Copyright IBM Corp. 2026
  version: "0.0.1"
_from: example-org/infra-skills@f7a8b9c
---

# Terraform Test Guide

## Test File Structure

Test files use `.tftest.hcl` extension:

```hcl
run "verify_vpc" {
  command = plan

  assert {
    condition     = aws_vpc.main.cidr_block == "10.0.0.0/16"
    error_message = "VPC CIDR block mismatch"
  }
}
```

## Test Types

- **Unit tests**: Use `command = plan` with mock providers
- **Integration tests**: Use `command = apply` against real infrastructure

## Mock Providers

```hcl
mock_provider "aws" {
  mock_data "aws_availability_zones" {
    defaults = {
      names = ["us-east-1a", "us-east-1b"]
    }
  }
}
```

## Running Tests

```bash
terraform test
terraform test -filter=tests/vpc.tftest.hcl
terraform test -verbose
```
