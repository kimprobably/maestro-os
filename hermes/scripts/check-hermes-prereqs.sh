#!/usr/bin/env bash
set -u

status=0

need_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    printf 'ok command %s present\n' "$name"
  else
    printf 'missing command %s\n' "$name"
    status=1
  fi
}

want_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    printf 'ok optional command %s present\n' "$name"
  else
    printf 'warn optional command %s missing\n' "$name"
  fi
}

need_var() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    printf 'ok env %s present\n' "$name"
  else
    printf 'missing env %s\n' "$name"
    status=1
  fi
}

want_var() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    printf 'ok optional env %s present\n' "$name"
  else
    printf 'warn optional env %s missing\n' "$name"
  fi
}

need_cmd hermes
need_cmd fabro
need_cmd git
want_cmd codex
want_cmd sqlite3
want_cmd jq

need_var SLACK_BOT_TOKEN
need_var SLACK_APP_TOKEN
need_var SLACK_HOME_CHANNEL
need_var FABRO_SERVER

if [ -n "${SLACK_ALLOWED_USERS:-}" ]; then
  printf 'ok env SLACK_ALLOWED_USERS present\n'
elif [ "${GATEWAY_ALLOW_ALL_USERS:-}" = "true" ]; then
  printf 'warn env GATEWAY_ALLOW_ALL_USERS=true; acceptable for smoke only\n'
else
  printf 'missing env SLACK_ALLOWED_USERS or smoke-only GATEWAY_ALLOW_ALL_USERS=true\n'
  status=1
fi

want_var DAYTONA_API_KEY
want_var DAYTONA_ORGANIZATION_ID
want_var OPENROUTER_API_KEY
want_var FABRO_DEV_TOKEN

if command -v fabro >/dev/null 2>&1; then
  if fabro mcp --help >/dev/null 2>&1; then
    printf 'ok fabro mcp present\n'
  else
    printf 'missing fabro mcp; install Fabro from upstream main/nightly before starting Hermes\n'
    status=1
  fi
fi

memory_seed="hermes/memory/MEMORY.seed.md"
user_seed="hermes/memory/USER.seed.md"

if [ -f "$memory_seed" ]; then
  memory_chars=$(wc -c < "$memory_seed" | tr -d ' ')
  if [ "$memory_chars" -le 2200 ]; then
    printf 'ok MEMORY seed size %s/2200 chars\n' "$memory_chars"
  else
    printf 'fail MEMORY seed size %s/2200 chars\n' "$memory_chars"
    status=1
  fi
fi

if [ -f "$user_seed" ]; then
  user_chars=$(wc -c < "$user_seed" | tr -d ' ')
  if [ "$user_chars" -le 1375 ]; then
    printf 'ok USER seed size %s/1375 chars\n' "$user_chars"
  else
    printf 'fail USER seed size %s/1375 chars\n' "$user_chars"
    status=1
  fi
fi

if rg -q 'C_[A-Z_]*' hermes/config/config.example.yaml 2>/dev/null; then
  printf 'warn config still contains placeholder Slack channel IDs\n'
fi

exit "$status"
