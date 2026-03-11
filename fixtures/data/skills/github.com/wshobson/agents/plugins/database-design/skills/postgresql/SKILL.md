---
name: postgresql-table-design
description: "Design a PostgreSQL-specific schema. Covers best-practices, data types, indexing, constraints, performance patterns, and advanced features."
_from: skill-mill/sk-database-patterns@5cccdc6fca40e9616f7d31d5bd3f4c9c4ad08a90
---

# PostgreSQL Table Design

## Core Rules

1. Every table MUST have a primary key
2. Use `uuid` or `bigint` for IDs (prefer `gen_random_uuid()`)
3. Always add `created_at timestamptz NOT NULL DEFAULT now()`
4. Use `timestamptz` not `timestamp` — always store with timezone
5. Prefer `text` over `varchar(n)` unless you need a hard limit

## Data Types

- **IDs**: `uuid DEFAULT gen_random_uuid()` or `bigint GENERATED ALWAYS AS IDENTITY`
- **Strings**: `text` for variable length, `char(n)` only for fixed-width codes
- **Time**: `timestamptz` always, `date` for date-only, `interval` for durations
- **JSON**: `jsonb` not `json` — supports indexing and operators
- **Money**: `numeric(19,4)` not `money` type

## Indexing

- Primary keys are automatically indexed
- Add indexes for columns used in WHERE, JOIN, ORDER BY
- Use partial indexes for common filter patterns
- Use GIN indexes for `jsonb`, array, and full-text search columns
- Avoid over-indexing — each index slows writes

## Row Level Security

Enable RLS for multi-tenant tables:

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```
