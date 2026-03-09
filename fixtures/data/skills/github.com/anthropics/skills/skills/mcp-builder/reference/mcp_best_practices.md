# MCP Best Practices

## Tool Design

- **One tool, one action**: Each tool should do one thing well
- **Clear descriptions**: Write descriptions that help the LLM decide when to use the tool
- **Typed inputs**: Use JSON Schema for input validation
- **Structured outputs**: Return consistent, parseable responses

## Error Handling

- Return human-readable error messages
- Include error codes for programmatic handling
- Never expose internal stack traces
- Provide actionable suggestions when possible

## Authentication

- Use environment variables for API keys
- Support OAuth 2.0 for user-facing services
- Validate credentials at server startup, not per-request
- Handle token refresh transparently

## Performance

- Implement request timeouts (30s default)
- Cache frequently accessed data
- Use pagination for large result sets
- Stream responses when possible
