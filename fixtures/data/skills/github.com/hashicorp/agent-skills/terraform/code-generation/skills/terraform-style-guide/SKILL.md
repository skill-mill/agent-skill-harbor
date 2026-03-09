---
name: terraform-style-guide
description: "Generate Terraform HCL code following HashiCorp's official style conventions and best practices."
_from: example-org/infra-skills@f7a8b9c
---

# Terraform Style Guide

## File Organization

- `main.tf` - Primary resources
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `versions.tf` - Required providers and Terraform version
- `locals.tf` - Local values
- `data.tf` - Data sources

## Naming Conventions

- Use `snake_case` for all resource names, variables, and outputs
- Prefix boolean variables with `enable_` or `is_`
- Use descriptive names: `web_server_sg` not `sg1`

## Code Style

- Use 2-space indentation
- One blank line between resource blocks
- Group related arguments together
- Always pin provider versions
- Use `terraform fmt` compatible formatting

## Security

- Never hardcode secrets in `.tf` files
- Use `sensitive = true` for secret variables
- Prefer data sources over hardcoded IDs
