#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  printf 'usage: hermes/scripts/prepare-railway-gateway-context.sh <context-dir>\n' >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
context_dir_raw="$1"

# Validate context_dir before any destructive operation.
# Operators invoke this script manually; an unchecked rm -rf on argv is a
# real data-loss hazard (typos, bad shell expansion, symlinks). We require
# the target to satisfy ALL of:
#   - non-empty
#   - not "/"
#   - not the user's $HOME
#   - not the repo root or an ancestor of it
#   - resolved path is inside an allowed parent (the repo, /tmp, or
#     /var/folders for macOS mktemp), OR carries a marker file
#     ".maestro-gateway-context" that opts the directory in to deletion
if [ -z "${context_dir_raw}" ]; then
  printf 'context-dir must not be empty\n' >&2
  exit 2
fi

# Resolve to an absolute path without requiring the path to exist.
# `realpath -m` exists on GNU coreutils; macOS realpath supports the same flag
# in recent versions. Fall back to Python if neither is available.
if context_dir="$(realpath -m "$context_dir_raw" 2>/dev/null)"; then
  :
else
  context_dir="$(python3 -c "import os, sys; print(os.path.abspath(sys.argv[1]))" "$context_dir_raw")"
fi

home_dir="$(cd "${HOME:-/nonexistent}" 2>/dev/null && pwd || true)"

# Reject obvious foot-guns.
case "$context_dir" in
  ""|/)
    printf 'refusing to operate on root or empty path: %s\n' "$context_dir" >&2
    exit 2
    ;;
esac
if [ -n "$home_dir" ] && [ "$context_dir" = "$home_dir" ]; then
  printf 'refusing to operate on $HOME: %s\n' "$context_dir" >&2
  exit 2
fi
if [ "$context_dir" = "$repo_root" ]; then
  printf 'refusing to operate on the repo root: %s\n' "$context_dir" >&2
  exit 2
fi
case "$repo_root/" in
  "$context_dir"/*)
    printf 'refusing to operate on an ancestor of the repo root: %s\n' "$context_dir" >&2
    exit 2
    ;;
esac

# Allowed parents: the repo build dir, /tmp, /var/folders (macOS mktemp),
# and Railway-style /workspace volumes. A directory carrying the marker
# file ".maestro-gateway-context" is also accepted (consents to delete).
allowed=0
for parent in "$repo_root/.build" "$repo_root/build" "$repo_root/dist" "/tmp" "/var/folders" "/workspace"; do
  case "$context_dir/" in
    "$parent"/*)
      allowed=1
      break
      ;;
  esac
done
if [ "$allowed" -eq 0 ] && [ -d "$context_dir" ] && [ ! -e "$context_dir/.maestro-gateway-context" ]; then
  printf 'refusing to delete %s: not under an allowed parent and missing marker file .maestro-gateway-context\n' "$context_dir" >&2
  printf 'pass a path under /tmp, /var/folders, /workspace, or %s/.build, or create %s/.maestro-gateway-context to opt in.\n' "$repo_root" "$context_dir" >&2
  exit 2
fi
if [ "$allowed" -eq 0 ] && [ ! -e "$context_dir" ]; then
  printf 'refusing to create %s outside an allowed parent. Use /tmp, /var/folders, /workspace, or %s/.build.\n' "$context_dir" "$repo_root" >&2
  exit 2
fi

rm -rf "$context_dir"
mkdir -p "$context_dir/docs" "$context_dir/hermes" "$context_dir/scripts" "$context_dir/workflows" "$context_dir/prompts"
# Mark the directory so subsequent runs can recognize it as a managed context
# even if it's later moved to a non-standard parent.
touch "$context_dir/.maestro-gateway-context"

rsync -a --delete "$repo_root/hermes/" "$context_dir/hermes/"
rsync -a --delete "$repo_root/scripts/hermes/" "$context_dir/scripts/hermes/"
rsync -a --delete "$repo_root/scripts/operator-ledger/" "$context_dir/scripts/operator-ledger/"
rsync -a --delete "$repo_root/scripts/fabro/" "$context_dir/scripts/fabro/"
rsync -a --delete "$repo_root/workflows/hermes/" "$context_dir/workflows/hermes/"
rsync -a --delete "$repo_root/prompts/hermes/" "$context_dir/prompts/hermes/"
rsync -a --delete "$repo_root/docs/operator/" "$context_dir/docs/operator/"
cp "$repo_root/hermes/deploy/railway-gateway/Dockerfile" "$context_dir/Dockerfile"
cp "$repo_root/docs/HERMES-DEPLOYMENT-RUNBOOK.md" "$context_dir/docs/HERMES-DEPLOYMENT-RUNBOOK.md"
cp "$repo_root/docs/HERMES-OPERATOR-ARCHITECTURE.md" "$context_dir/docs/HERMES-OPERATOR-ARCHITECTURE.md"
cp "$repo_root"/docs/FABRO*.md "$context_dir/docs/"

printf 'prepared Railway gateway context at %s\n' "$context_dir"
