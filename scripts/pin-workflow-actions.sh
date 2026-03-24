#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DIFF_MODE="${1:-}"
REUSABLE_GH_DIR="$REPO_ROOT/.github"
TEMPLATE_GH_DIR="$REPO_ROOT/templates/init/.github"
ACTIONS_UP_MIN_AGE=7
ACTIONS_UP_MODE=minor
TEMPLATE_CALLER="$REPO_ROOT/templates/init/.github/workflows/collect-skills.yml"
TEMPLATE_CALLER_REF='uses: skill-mill/agent-skill-harbor/.github/workflows/collect.yml@wf-v0'

if [ -z "${GITHUB_TOKEN:-}" ] && [ -n "${GH_TOKEN:-}" ]; then
  export GITHUB_TOKEN="$GH_TOKEN"
fi

restore_template_caller_ref() {
  tmp_file=$(mktemp)
  awk -v ref="$TEMPLATE_CALLER_REF" '
    {
      sub(/uses: skill-mill\/agent-skill-harbor\/\.github\/workflows\/collect\.yml@[^\t ]+/, ref)
      print
    }
  ' "$TEMPLATE_CALLER" > "$tmp_file"
  mv "$tmp_file" "$TEMPLATE_CALLER"
}

case "$DIFF_MODE" in
  --diff)
    pnpm exec actions-up --dir "$REUSABLE_GH_DIR" --yes --min-age "$ACTIONS_UP_MIN_AGE" --mode "$ACTIONS_UP_MODE" --dry-run
    pnpm exec actions-up --dir "$TEMPLATE_GH_DIR" --yes --min-age "$ACTIONS_UP_MIN_AGE" --mode "$ACTIONS_UP_MODE" --dry-run -r
    printf '%s\n' '[notice] collect-skills.yml keeps wf-v0 intentionally; ignore any reusable workflow ref update above.'
    sh "$SCRIPT_DIR/check-pnpm-action-setup.sh"
    ;;
  *)
    pnpm exec actions-up --dir "$REUSABLE_GH_DIR" --yes --min-age "$ACTIONS_UP_MIN_AGE" --mode "$ACTIONS_UP_MODE"
    pnpm exec actions-up --dir "$TEMPLATE_GH_DIR" --yes --min-age "$ACTIONS_UP_MIN_AGE" --mode "$ACTIONS_UP_MODE" -r
    restore_template_caller_ref
    printf '%s\n' '[notice] pnpm/action-setup is not updated automatically. Review the latest v4 release and update the pinned SHA by hand when needed.'
    ;;
esac
