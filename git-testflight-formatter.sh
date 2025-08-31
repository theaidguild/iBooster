#!/bin/zsh

# git-testflight-formatter.sh
# Description: Collect today's git commit messages, format a TestFlight-ready prompt, and copy to clipboard.
# Platform: macOS (uses pbcopy), Shell: zsh-compatible

set -euo pipefail

# Colors for user feedback (optional)
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure we're inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "${RED}Error:${NC} Not in a git repository. Run this script from within your repo." >&2
  exit 1
fi

# Determine start of "today" in local time. Accept optional date override via env var TODAY (YYYY-MM-DD)
if [[ -n "${TODAY:-}" ]]; then
  since_date="${TODAY} 00:00"
else
  # macOS BSD date supports -v modifiers
  since_date="$(date +"%Y-%m-%d") 00:00"
fi

# Collect today's commit subjects, excluding merge commits by default.
# You can set INCLUDE_MERGES=1 to include merges.
log_opts=(--since "$since_date" --pretty=format:"• %s")
if [[ -z "${INCLUDE_MERGES:-}" ]]; then
  log_opts=(--no-merges $log_opts)
fi

commits=$(git log $log_opts)

if [[ -z "$commits" ]]; then
  echo "${RED}No commits found for today since $since_date.${NC}" >&2
  exit 0
fi

# Optionally include commit hashes and PR numbers (heuristic). Set VERBOSE=1 to include hashes.
if [[ -n "${VERBOSE:-}" ]]; then
  commits=$(git log --since "$since_date" ${INCLUDE_MERGES:+} --pretty=format:"• %h %s")
fi

read -r -d '' output <<EOF || true
Given the below commit messages:

$commits

Write a set of instructions for testers so I can paste into TestFlight.
EOF

# Copy to clipboard (macOS)
if command -v pbcopy >/dev/null 2>&1; then
  printf "%s" "$output" | pbcopy
  echo "${GREEN}Formatted text copied to clipboard.${NC}"
else
  echo "${RED}pbcopy not found.${NC} Printing output below instead:" >&2
  echo
  echo "$output"
fi
