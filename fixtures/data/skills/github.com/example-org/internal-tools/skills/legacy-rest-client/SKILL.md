---
name: legacy-rest-client
description: Generate client code for the internal Platform API v1. Handles authentication, pagination, and error mapping for legacy endpoints.
license: UNLICENSED
metadata:
  author: platform-team
  version: 1.2.0
_from: example-org/dev-standards@b4c5d6e
---

# Legacy Platform API v1 Client

Use this skill when generating code that interacts with the internal Platform API v1.

## Authentication

All requests must include the `X-Internal-Token` header:

```python
import os
import requests

session = requests.Session()
session.headers["X-Internal-Token"] = os.environ["PLATFORM_API_TOKEN"]
session.headers["Content-Type"] = "application/json"
```

## Pagination

The v1 API uses offset-based pagination:

```python
def fetch_all(endpoint: str, session: requests.Session) -> list[dict]:
    results = []
    offset = 0
    limit = 100
    while True:
        resp = session.get(endpoint, params={"offset": offset, "limit": limit})
        resp.raise_for_status()
        data = resp.json()
        results.extend(data["items"])
        if len(data["items"]) < limit:
            break
        offset += limit
    return results
```

## Error Mapping

| HTTP Status | Meaning | Action |
|---|---|---|
| 401 | Token expired | Refresh via `/auth/rotate` |
| 429 | Rate limited | Retry after `Retry-After` header |
| 503 | Maintenance window | Wait and retry with exponential backoff |

## Important Notes

- Base URL: `https://api-v1.internal.example.com`
- Rate limit: 100 requests/minute per token
- **This API is scheduled for deprecation.** Prefer Platform API v2 for all new integrations.
