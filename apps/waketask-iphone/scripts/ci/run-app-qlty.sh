#!/usr/bin/env bash
set -euo pipefail

QLTY_JOBS="${QLTY_JOBS:-1}"

run_qlty_here() {
  QLTY_TELEMETRY=off qlty check --all \
    --jobs "$QLTY_JOBS" \
    --skip-source-fetch \
    --no-progress \
    --summary \
    --no-upgrade-check
}

app_root="$(pwd -P)"
git_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -f ".qlty/qlty.toml" && -n "$git_root" && "$git_root" != "$app_root" ]]; then
  tmp_parent="${TMPDIR:-/tmp}"
  tmp_dir="$(mktemp -d "${tmp_parent%/}/waketask-qlty.XXXXXX")"
  cleanup() {
    rm -rf "$tmp_dir"
  }
  trap cleanup EXIT

  echo "[qlty] Running in isolated app snapshot to use .qlty/qlty.toml"
  tar \
    --exclude="./.build" \
    --exclude="./DerivedData" \
    --exclude="./reports/ios/*.xcresult" \
    --exclude="./*.xcresult" \
    -cf - . | tar -xf - -C "$tmp_dir"

  git -C "$tmp_dir" init -q
  git -C "$tmp_dir" config user.email "ci@example.invalid"
  git -C "$tmp_dir" config user.name "CI"
  git -C "$tmp_dir" add .
  git -C "$tmp_dir" commit -qm "qlty snapshot"

  (
    cd "$tmp_dir"
    run_qlty_here
  )
else
  run_qlty_here
fi
