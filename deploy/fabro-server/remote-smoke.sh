#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH='' cd -- "$script_dir/../.." && pwd)

if [ -f "$script_dir/env.server" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$script_dir/env.server"
  set +a
fi

server="${FABRO_REMOTE_URL:-${FABRO_WEB_URL:-}}"
token="${FABRO_REMOTE_DEV_TOKEN:-${FABRO_DEV_TOKEN:-}}"

if [ -z "$server" ]; then
  printf 'FABRO_REMOTE_URL or FABRO_WEB_URL is required\n' >&2
  exit 2
fi
if [ -z "$token" ]; then
  printf 'FABRO_REMOTE_DEV_TOKEN or FABRO_DEV_TOKEN is required\n' >&2
  exit 2
fi

server="${server%/}"
out_dir="$repo_root/.workflow"
mkdir -p "$out_dir"

curl -fsS "$server/health" >/dev/null
curl -fsS -H "Authorization: Bearer $token" "$server/api/v1/system/info" \
  > "$out_dir/remote-system-info.json"
curl -fsS -H "Authorization: Bearer $token" "$server/api/v1/settings" \
  > "$out_dir/remote-settings.json"
curl -fsS -H "Authorization: Bearer $token" "$server/api/v1/workflows" \
  > "$out_dir/remote-workflows.json"

node -e "
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$out_dir/remote-settings.json', 'utf8'));
const workflows = JSON.parse(fs.readFileSync('$out_dir/remote-workflows.json', 'utf8'));
const github = settings?.server?.server?.integrations?.github;
const slack = settings?.server?.server?.integrations?.slack;
const methods = settings?.server?.server?.auth?.methods || [];
if (!Array.isArray(methods) || !methods.includes('dev-token')) {
  throw new Error('remote dev-token auth is not enabled');
}
if (!github || github.enabled !== true || github.strategy !== 'token') {
  throw new Error('remote GitHub token integration is not enabled');
}
if (!slack || slack.enabled !== true) {
  throw new Error('remote Slack integration is not enabled');
}
const data = Array.isArray(workflows.data) ? workflows.data : [];
fs.writeFileSync(
  '$out_dir/remote-fabro-server-smoke.json',
  JSON.stringify({
    server: '$server',
    github_strategy: github.strategy,
    slack_enabled: slack.enabled,
    workflow_count: data.length
  }, null, 2) + '\\n'
);
"

cat "$out_dir/remote-fabro-server-smoke.json"
