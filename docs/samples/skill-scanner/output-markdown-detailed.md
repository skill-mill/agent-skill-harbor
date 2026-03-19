# Agent Skill Security Scan Report

**Skill:** algorithmic-art
**Directory:** /Users/xxxx/agent-skill-harbor/data/skills/github.com/skill-mill/sk-frontend-kit/skills/algorithmic-art
**Status:** [OK] SAFE
**Max Severity:** MEDIUM
**Scan Duration:** 1.09s
**Timestamp:** 2026-03-19T16:14:26.369128+00:00

## Summary

- **Total Findings:** 1
- **Critical:** 0
- **High:** 0
- **Medium:** 1
- **Low:** 0
- **Info:** 0

## Findings

### MEDIUM Severity

#### [MEDIUM] Moderate analyzability score

**Severity:** MEDIUM
**Category:** policy_violation
**Rule ID:** LOW_ANALYZABILITY

**Description:** Only 76% of skill content could be analyzed. 1 of 4 files are opaque to the scanner. Some content could not be verified as safe.

**Remediation:** Review opaque files and replace with inspectable formats where possible.

## Analyzers

The following analyzers were used:

- static_analyzer
- bytecode
- pipeline
