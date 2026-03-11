---
name: mcp-builder
description: "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools."
license: Complete terms in LICENSE.txt
_from: skill-mill/sk-mcp-toolkit@f563876de3c1b2356695b7f375c475652f3621d6
---

# MCP Server Builder

Build MCP servers in 4 phases:

## Phase 1: Research & Planning
- Identify the external service API
- Design tool schemas with clear descriptions
- Plan authentication and error handling

## Phase 2: Implementation
- Use TypeScript with the `@modelcontextprotocol/sdk` package
- Implement tools with proper input validation
- Add comprehensive error messages

## Phase 3: Review & Test
- Test each tool individually
- Verify error handling paths
- Check rate limiting behavior

## Phase 4: Documentation
- Write clear tool descriptions
- Document required environment variables
- Provide usage examples
