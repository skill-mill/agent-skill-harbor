#!/usr/bin/env python3
"""Quick validator for SKILL.md files."""

import sys
import re
from pathlib import Path


def validate_skill(path: str) -> list[str]:
    """Validate a SKILL.md file and return a list of issues."""
    issues = []
    content = Path(path).read_text()

    # Check frontmatter
    if not content.startswith("---"):
        issues.append("Missing frontmatter (must start with ---)")
        return issues

    parts = content.split("---", 2)
    if len(parts) < 3:
        issues.append("Incomplete frontmatter (missing closing ---)")
        return issues

    frontmatter = parts[1].strip()

    # Check required fields
    if not re.search(r"^name:", frontmatter, re.MULTILINE):
        issues.append("Missing required field: name")
    if not re.search(r"^description:", frontmatter, re.MULTILINE):
        issues.append("Missing required field: description")

    # Check name format
    name_match = re.search(r"^name:\s*(.+)$", frontmatter, re.MULTILINE)
    if name_match:
        name = name_match.group(1).strip().strip("\"'")
        if not re.match(r"^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$", name):
            issues.append(f"Invalid name format: '{name}' (must be lowercase, hyphens only)")

    # Check body
    body = parts[2].strip()
    if not body:
        issues.append("Empty body (add instructions after frontmatter)")
    elif len(body.splitlines()) > 500:
        issues.append(f"Body too long ({len(body.splitlines())} lines, recommended max 500)")

    return issues


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: quick_validate.py <SKILL.md>")
        sys.exit(1)
    issues = validate_skill(sys.argv[1])
    if issues:
        for issue in issues:
            print(f"  ⚠ {issue}")
        sys.exit(1)
    else:
        print("  ✓ Valid")
