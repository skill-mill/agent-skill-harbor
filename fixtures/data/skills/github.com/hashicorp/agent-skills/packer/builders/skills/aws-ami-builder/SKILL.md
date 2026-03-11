---
name: aws-ami-builder
description: "Build Amazon Machine Images (AMIs) with Packer using the amazon-ebs builder. Use when creating custom AMIs for EC2 instances."
_from: skill-mill/sk-devops-handbook@ddf642a6cc111a2f427e31b17d75291be71dbe08
---

# AWS AMI Builder

Build custom AMIs using Packer's `amazon-ebs` builder.

## Basic Template

```hcl
source "amazon-ebs" "base" {
  ami_name      = "my-app-{{timestamp}}"
  instance_type = "t3.micro"
  region        = "us-east-1"

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }

  ssh_username = "ubuntu"
}
```

## Best Practices

- Always use `source_ami_filter` instead of hardcoded AMI IDs
- Tag AMIs with build metadata (commit SHA, timestamp)
- Use `ami_regions` for multi-region distribution
- Set `force_deregister = true` for development builds
- Configure `launch_block_device_mappings` for custom root volume size
