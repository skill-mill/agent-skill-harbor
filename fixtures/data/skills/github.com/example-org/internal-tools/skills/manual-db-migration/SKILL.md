---
name: manual-db-migration
description: Generate raw SQL migration scripts for direct execution against production databases.
license: UNLICENSED
metadata:
  author: data-team
  version: 0.9.0
_from: example-org/data-team-tools@d1e2f3a
---

# Manual Database Migration

Generate SQL migration scripts for schema changes.

## Migration Template

```sql
-- Migration: <description>
-- Author: <name>
-- Date: <YYYY-MM-DD>

BEGIN;

-- Forward migration
ALTER TABLE users ADD COLUMN department_id INTEGER;
CREATE INDEX idx_users_department ON users(department_id);

COMMIT;
```

## Rollback Template

```sql
BEGIN;

-- Rollback migration
DROP INDEX IF EXISTS idx_users_department;
ALTER TABLE users DROP COLUMN IF EXISTS department_id;

COMMIT;
```

## Rules

- Always wrap migrations in a transaction
- Always provide a rollback script
- Test on staging before production
- Include `IF EXISTS` / `IF NOT EXISTS` guards
