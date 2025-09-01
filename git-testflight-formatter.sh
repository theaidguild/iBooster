#!/bin/zsh

# git-testflight-formatter.sh
# Description: Collect today's git commit messages, format a TestFlight-ready prompt, and copy to clipboard.
# Platform: macOS (uses pbcopy), Shell: zsh-compatible
#
# Defaults: collects commits since "today 00:00" local time.
# Overrides (precedence high -> low):
#   1) --last "DURATION"            e.g.,  --last "1 hour"  (interpreted as "1 hour ago")
#   2) --since "EXPR"               e.g.,  --since "2025-08-31 10:00" or "2 hours ago"
#   3) TODAY=YYYY-MM-DD              e.g.,  TODAY=2025-08-31
#   4) Default: today at 00:00
#
# Env equivalents (optional):
#   LAST="1 hour" | SINCE="2 hours ago" | INCLUDE_MERGES=1 | VERBOSE=1

set -euo pipefail

# Colors for user feedback (optional)
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_NAME="${0##*/}"

print_usage() {
  cat <<USAGE
Usage: ${SCRIPT_NAME} [options]

Options:
  -l, --last "DURATION"     Collect commits since DURATION ago (e.g., "1 hour", "90 minutes").
                            If "ago" is missing, it will be appended. Example: --last "1 hour" -> "1 hour ago".
  -s, --since "EXPR"        Collect commits since the given git date expression (passed directly to git --since).
                            Examples: --since "2025-08-31 10:00" or --since "2 hours ago".
  -m, --include-merges      Include merge commits (default: excluded).
  -v, --verbose             Include short commit hashes in the list.
  -h, --help                Show this help message and exit.

Environment (alternative to CLI flags):
  LAST, SINCE, INCLUDE_MERGES=1, VERBOSE=1, TODAY=YYYY-MM-DD

Precedence (highest first): --last > --since > TODAY/env > default(today 00:00)
USAGE
}

# Ensure we're inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "${RED}Error:${NC} Not in a git repository. Run this script from within your repo." >&2
  exit 1
fi

# Parse CLI options (zsh-compatible)
LAST_INPUT="${LAST:-}"
SINCE_INPUT="${SINCE:-}"
include_merges="${INCLUDE_MERGES:-}"
verbose="${VERBOSE:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -l|--last)
      [[ $# -lt 2 ]] && { echo "${RED}Error:${NC} --last requires a value" >&2; exit 2; }
      LAST_INPUT="$2"; shift 2;
      ;;
    -s|--since)
      [[ $# -lt 2 ]] && { echo "${RED}Error:${NC} --since requires a value" >&2; exit 2; }
      SINCE_INPUT="$2"; shift 2;
      ;;
    -m|--include-merges)
      include_merges=1; shift;
      ;;
    -v|--verbose)
      verbose=1; shift;
      ;;
    -h|--help)
      print_usage; exit 0;
      ;;
    *)
      echo "${RED}Unknown option:${NC} $1" >&2
      print_usage
      exit 2
      ;;
  esac
done

# Determine --since expression according to precedence
since_expr=""
if [[ -n "$LAST_INPUT" ]]; then
  if [[ "$LAST_INPUT" == *ago* ]]; then
    since_expr="$LAST_INPUT"
  else
    since_expr="$LAST_INPUT ago"
  fi
elif [[ -n "$SINCE_INPUT" ]]; then
  since_expr="$SINCE_INPUT"
elif [[ -n "${TODAY:-}" ]]; then
  since_expr="${TODAY} 00:00"
else
  # macOS BSD date supports -v modifiers
  since_expr="$(date +"%Y-%m-%d") 00:00"
fi

# Collect today's commit subjects, excluding merge commits by default.
# You can set INCLUDE_MERGES=1 to include merges.
# Build git log options
log_opts=(--since "$since_expr")
if [[ -z "$include_merges" ]]; then
  log_opts+=(--no-merges)
fi
if [[ -n "$verbose" ]]; then
  log_opts+=(--pretty=format:"- %h %s")
else
  log_opts+=(--pretty=format:"- %s")
fi

commits=$(git log "${log_opts[@]}")

if [[ -z "$commits" ]]; then
  echo "${RED}No commits found for today since $since_date.${NC}" >&2
  exit 0
fi

# Optionally include commit hashes and PR numbers (heuristic). Set VERBOSE=1 to include hashes.
# Note: verbose and include-merges are already handled in log_opts above.

output=$(cat <<'EOF'
Given the below commit messages:

```
__COMMITS__
```

Write a set of instructions for testers that I can paste into TestFlight.

Formatting requirements (strict):
- Plain text only.
- Do NOT use any Markdown formatting: no headings (#), no bold/italics (** or _), no code blocks (```), no inline code (`), no links with [text](url), and no lists using -, *, or numbered lists.
- Keep the level of detail to a minimum, and avoid jargon, but provide enough context for the tester to understand what to look for.
- Always return the content wrapped between ```.
EOF
)

# Inject the commits into the template safely
output=${output/__COMMITS__/$commits}

# Copy to clipboard (macOS)
if command -v pbcopy >/dev/null 2>&1; then
  printf "%s" "$output" | pbcopy
  echo "${GREEN}Formatted text copied to clipboard.${NC}"
else
  echo "${RED}pbcopy not found.${NC} Printing output below instead:" >&2
  echo
  echo "$output"
fi
