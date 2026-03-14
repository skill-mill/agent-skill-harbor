# Audit Guide

Agent Skill Harbor can audit collected skills for potentially risky instructions after `harbor collect`.

The audit workflow is designed to work with both the built-in `static` engine and user-defined engines.

## What Gets Audited

`harbor audit` works on cached skill content under `data/skills/`.

- Each skill is identified by its `skill_key`
- The engine resolves the cached `SKILL.md` from `data/skills/<skill_key>`
- Related Markdown files in the same skill directory can also be inspected

By default, only repositories owned by your organization are audited.

## Configuration

Audit settings are defined in `config/harbor.yaml`.

```yaml
audit:
  fail_on: fail
  exclude_community_repos: true
  engines:
    - id: static
    - id: company-policy
      command: ['python3', 'scripts/company-policy-audit.py']
      timeout_sec: 10
```

### Fields

- `fail_on`: Exit with status `1` when the strongest audit result is at or above this level
- `exclude_community_repos`: When `true`, only skills from your own org are audited
- `engines`: Ordered list of audit engines to run

### Engine Rules

- `id` is required for every engine
- `static` is the built-in engine name
- Built-in engines do not need `command`
- User-defined engines must provide `command`
- `timeout_sec` is optional and applies per engine invocation for one skill
- User-defined engines default to `30` seconds when `timeout_sec` is omitted
- `timeout_sec` must be between `1` and `300`

## Preparing User-Defined Engine Environments

Harbor only executes the configured engine command. It does not install Python, pip packages, or other runtime dependencies for user-defined engines.

If your engine needs an additional runtime, prepare it in the environment that runs `harbor audit`.

### GitHub Actions Example

If you use a Python-based engine in GitHub Actions, add setup steps to `CollectAndAuditSkills` before `npx harbor audit`:

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'

- name: Install Python audit dependencies
  run: pip install -r scripts/audit-requirements.txt

- name: Collect skills
  id: collect
  run: npx harbor collect

- name: Audit collected skills
  run: npx harbor audit --history-id "${{ steps.collect.outputs.history_id }}"
```

### Local Execution

For local runs, install the required runtime and dependencies yourself before calling `harbor audit`.

Examples:

- `python3` + `pip install -r scripts/audit-requirements.txt`
- `uv run python scripts/company-policy-audit.py`
- `node scripts/company-policy-audit.mjs`

## Running Audit

```bash
harbor collect
harbor audit
```

Available options:

```bash
harbor audit --force
harbor audit --engines static,company-policy
harbor audit --history-id 550e8400-e29b-41d4-a716-446655440000
```

- `--force`: Re-run audit even when `tree_sha` has not changed
- `--engines`: Override the configured engine list for this run
- `--history-id`: Attach the audit summary to an existing `collect-history.yaml` entry

`harbor audit` always updates `data/report.yaml`. History is updated only when `--history-id` is provided.

## Engine Contract

Harbor executes each engine from the project root and passes the `skill_key` on standard input.

Example stdin:

```text
github.com/example-org/internal-tools/skills/db-admin/SKILL.md
```

The engine must return JSON on stdout.

Minimum valid response:

```json
{
	"result": "warn"
}
```

Extended response:

```json
{
	"result": "warn",
	"summary": "Potential external exfiltration pattern detected",
	"findings": [
		{
			"level": "warn",
			"summary": "External URL upload instruction",
			"file": "SKILL.md",
			"line": 18,
			"category": "external_communication",
			"references": ["2026-ASI03", "2026-ASI09"]
		}
	]
}
```

### Response Fields

- `result`: Required. One of `pass`, `warn`, `fail`
- `summary`: Optional short explanation
- `findings`: Optional list of detected issues

### Finding Fields

- `level`: Optional. One of `warn`, `fail`
- `summary`: Recommended short explanation
- `file`: Optional relative path within the skill directory
- `line`: Optional 1-based line number
- `category`: Optional Harbor-side category label
- `references`: Optional external reference IDs such as `2026-ASI03`

## Output

Latest audit results are stored in `data/report.yaml`.

When `--history-id` is provided, a summary is also stored in the matching `collect-history.yaml` entry under `auditing` and `report`.

Each skill stores:

- `skill_key`
- `tree_sha`
- `engines.<id>.result`
- `engines.<id>.summary`
- `engines.<id>.findings`

The overall skill result is derived from stored engine results when needed:

- `fail > warn > pass`

## Timeout Behavior

`timeout_sec` is evaluated per engine invocation per skill, not for the whole audit run.

For example, if one engine has `timeout_sec: 30`, each skill can spend up to 30 seconds in that engine before Harbor treats it as a failure.

To avoid hanging workflows:

- Default timeout: `30` seconds
- Maximum timeout: `300` seconds

## Built-in Static Engine

The built-in `static` engine scans cached Markdown files for risky patterns and can emit:

- `category` values such as `permission_scope` or `external_communication`
- `references` values such as `2026-ASI03`

These fields are optional in the public engine contract, but the built-in engine uses them to make findings easier to understand.

### Static Audit Categories

The built-in `static` engine currently groups findings into the following categories.

| Category                 | What it checks                                                  | Typical matches                                                                  | Default level | References                 |
| ------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------- | -------------------------- |
| `instruction_safety`     | Attempts to override system/developer instructions              | `ignore previous`, `override system`, `<system>`, `you are now`                  | `warn`        | `2026-ASI01`, `2026-ASI02` |
| `capability_risk`        | Destructive commands or arbitrary code execution patterns       | `rm -rf`, `eval(`, `exec(`, `child_process`, `os.system`, `subprocess`           | `fail`        | `2026-ASI03`, `2026-ASI05` |
| `permission_scope`       | Privilege escalation or unsafe permission assumptions           | `sudo`, `chmod 777`, `--privileged`, `as root`                                   | `warn`        | `2026-ASI04`, `2026-ASI05` |
| `data_handling`          | Access to secrets, credentials, or sensitive local files        | `process.env`, `api_key`, `secret`, `token`, `password`, `.env`, `~/.ssh`        | `warn`        | `2026-ASI06`               |
| `external_communication` | Outbound communication or data transfer patterns                | `curl`, `wget`, `fetch(`, `https://`, `webhook`                                  | `warn`        | `2026-ASI03`, `2026-ASI09` |
| `provenance_trust`       | Provenance and supply-chain related references                  | `_from:`, `forked from`, `upstream`, `mirror`                                    | `warn`        | `2026-ASI07`, `2026-ASI09` |
| `transparency`           | Instructions that hide actions or skip user confirmation        | `do not tell`, `hide this`, `silently`, `without asking`, `without confirmation` | `warn`        | `2026-ASI10`               |
| `resource_abuse`         | Patterns likely to cause runaway retries or resource exhaustion | `while true`, `infinite loop`, `fork bomb`, `retry forever`, `until it works`    | `warn`        | `2026-ASI08`               |

Notes:

- These are simple pattern-based checks against cached Markdown files, not full semantic analysis.
- A finding is emitted per matching line, so one file can produce multiple findings in the same category.
- The built-in result becomes `fail` if any finding is `fail`; otherwise it becomes `warn` when at least one finding exists.
