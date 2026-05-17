#!/usr/bin/env bash
set -euo pipefail

export HERMES_HOME="${HERMES_HOME:-/data/.hermes}"
export FABRO_SERVER="${FABRO_SERVER:-https://fabro-maestro-production.up.railway.app/api/v1}"
export HERMES_ACCEPT_HOOKS="${HERMES_ACCEPT_HOOKS:-1}"
export GATEWAY_ALLOW_ALL_USERS="${GATEWAY_ALLOW_ALL_USERS:-false}"
export HERMES_TERMINAL_CWD="${HERMES_TERMINAL_CWD:-/app}"
export HERMES_REASONING_EFFORT="${HERMES_REASONING_EFFORT:-xhigh}"
export HERMES_GATEWAY_MAX_TURNS="${HERMES_GATEWAY_MAX_TURNS:-30}"
export HERMES_DELEGATION_MAX_ITERATIONS="${HERMES_DELEGATION_MAX_ITERATIONS:-30}"
export HERMES_MEMORY_NUDGE_INTERVAL="${HERMES_MEMORY_NUDGE_INTERVAL:-4}"
export HERMES_SKILL_NUDGE_INTERVAL="${HERMES_SKILL_NUDGE_INTERVAL:-4}"
export HERMES_CURATOR_INTERVAL_HOURS="${HERMES_CURATOR_INTERVAL_HOURS:-24}"
export HERMES_COMPRESSION_TARGET_RATIO="${HERMES_COMPRESSION_TARGET_RATIO:-0.10}"
export HERMES_COMPRESSION_PROTECT_LAST_N="${HERMES_COMPRESSION_PROTECT_LAST_N:-10}"
export HERMES_COMPRESSION_MESSAGE_LIMIT="${HERMES_COMPRESSION_MESSAGE_LIMIT:-150}"
export HERMES_AUX_COMPRESSION_TIMEOUT="${HERMES_AUX_COMPRESSION_TIMEOUT:-60}"
export HERMES_AUX_SESSION_SEARCH_TIMEOUT="${HERMES_AUX_SESSION_SEARCH_TIMEOUT:-20}"
export HERMES_SESSION_SEARCH_MAX_CONCURRENCY="${HERMES_SESSION_SEARCH_MAX_CONCURRENCY:-1}"
export HONCHO_ENVIRONMENT="${HONCHO_ENVIRONMENT:-production}"
export HONCHO_WORKSPACE="${HONCHO_WORKSPACE:-maestro}"
export HONCHO_RECALL_MODE="${HONCHO_RECALL_MODE:-hybrid}"
export MOBBIN_MCP_URL="${MOBBIN_MCP_URL:-https://api.mobbin.com/mcp}"
export STITCH_MCP_URL="${STITCH_MCP_URL:-https://stitch.googleapis.com/mcp}"
export PATH="/root/.local/bin:/root/.fabro/bin:/usr/local/bin:$PATH"

# Safety: allow-all gateway is a smoke-only mode. Refuse to boot if it is set
# without an explicit smoke flag in the current environment. This prevents a
# stale allow-all setting (whether in env or persisted .env) from silently
# leaving auth wide open in production.
if [ "${GATEWAY_ALLOW_ALL_USERS}" = "true" ] && [ "${HERMES_GATEWAY_SMOKE:-}" != "1" ]; then
  printf 'GATEWAY_ALLOW_ALL_USERS=true requires HERMES_GATEWAY_SMOKE=1 to be set this boot (refusing to start with allow-all in production)\n' >&2
  exit 1
fi

profile_name="${HERMES_GATEWAY_PROFILE:-maestro-operator}"
case "$profile_name" in
  maestro-operator|smith|johann|quill|quincy|joni)
    ;;
  *)
    printf 'unsupported HERMES_GATEWAY_PROFILE: %s\n' "$profile_name" >&2
    exit 1
    ;;
esac
export HERMES_PROFILE="$profile_name"
profile_dir="$HERMES_HOME/profiles/$profile_name"
env_file="$profile_dir/.env"
distribution_dir="/app/hermes/distribution/maestro-operator"

# Tighten umask before creating anything under HERMES_HOME so freshly created
# files default to owner-read-write only. The profile .env and adjacent state
# carry Slack tokens, Fabro dev tokens, GitHub tokens, and Linear keys; a
# default 0644 file on a shared Railway volume is too permissive.
umask 077

mkdir -p "$HERMES_HOME" /data/logs
chmod 700 "$HERMES_HOME" 2>/dev/null || true

if [ ! -f "$profile_dir/config.yaml" ]; then
  # config.yaml is missing. Never rm -rf the profile dir — that wipes
  # state/, memories/, .env, and the run ledger. Instead: if the profile
  # has data, back it up to a timestamped directory and restore the
  # durable files into a fresh profile dir before bootstrapping.
  if [ -d "$profile_dir" ] && find "$profile_dir" -mindepth 1 -print -quit 2>/dev/null | grep -q .; then
    backup_dir="${profile_dir}.broken-$(date +%Y%m%d%H%M%S)"
    printf 'config.yaml missing but profile_dir has data; backing up to %s\n' "$backup_dir" >&2
    mv "$profile_dir" "$backup_dir"
    mkdir -p "$profile_dir"
    for keep in state memories .env; do
      if [ -e "$backup_dir/$keep" ]; then
        cp -R "$backup_dir/$keep" "$profile_dir/$keep" 2>/dev/null || true
      fi
    done
  fi
  /app/hermes/scripts/bootstrap-external-host.sh --install-fabro
  /app/hermes/scripts/install-worker-profiles.sh
fi

if [ -f /app/hermes/scripts/install-worker-profiles.sh ]; then
  /app/hermes/scripts/install-worker-profiles.sh
fi

mkdir -p "$profile_dir/state" "$profile_dir/memories"
chmod 700 "$profile_dir" "$profile_dir/state" "$profile_dir/memories" 2>/dev/null || true

profile_soul_src="/app/hermes/profiles/$profile_name/SOUL.md"
if [ "$profile_name" = "maestro-operator" ] && [ -f "$distribution_dir/SOUL.md" ]; then
  cp "$distribution_dir/SOUL.md" "$profile_dir/SOUL.md"
elif [ -f "$profile_soul_src" ]; then
  cp "$profile_soul_src" "$profile_dir/SOUL.md"
fi

# config.yaml policy: copy from the distribution template only on first
# install. On subsequent boots, preserve operator edits (Slack channel IDs,
# MCP allowlists, disabled tools, hard-isolation policy). The targeted env
# overrides further down still apply on every boot. If the distribution
# template has drifted from what we last applied, log a warning so operators
# can review and merge intentionally.
if [ -f "$distribution_dir/config.yaml" ]; then
  template_hash="$(shasum -a 256 "$distribution_dir/config.yaml" | awk '{print $1}')"
  applied_marker="$profile_dir/.config.template.applied"
  if [ ! -f "$profile_dir/config.yaml" ]; then
    cp "$distribution_dir/config.yaml" "$profile_dir/config.yaml"
    echo "$template_hash" > "$applied_marker"
    printf 'config.yaml installed from template (first install)\n' >&2
  elif [ ! -f "$applied_marker" ] || [ "$(cat "$applied_marker")" != "$template_hash" ]; then
    printf 'WARN: distribution config.yaml differs from previously applied template. Operator edits in %s/config.yaml are preserved. To accept the new template: cp %s %s/config.yaml && echo %s > %s\n' \
      "$profile_dir" "$distribution_dir/config.yaml" "$profile_dir" "$template_hash" "$applied_marker" >&2
  fi
fi

if [ -d "$distribution_dir/skills" ]; then
  mkdir -p "$profile_dir/skills"
  cp -R "$distribution_dir/skills/." "$profile_dir/skills/"
fi

sync_managed_memory() {
  local src="$1"
  local dst="$2"
  local label="$3"
  local legacy_prefix="$4"

  if [ ! -f "$src" ]; then
    return 0
  fi

  python3 - "$src" "$dst" "$label" "$legacy_prefix" <<'PY'
import sys
from pathlib import Path

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
label = sys.argv[3]
legacy_prefix = sys.argv[4]

begin = f"<!-- maestro-managed-{label}-begin -->"
end = f"<!-- maestro-managed-{label}-end -->"
managed = f"{begin}\n{src.read_text().strip()}\n{end}\n"

dst.parent.mkdir(parents=True, exist_ok=True)
if not dst.exists():
    dst.write_text(managed)
    raise SystemExit(0)

old = dst.read_text()
if begin in old and end in old:
    before, rest = old.split(begin, 1)
    _, after = rest.split(end, 1)
    dst.write_text(before.rstrip() + "\n\n" + managed + after.lstrip())
elif old.strip().startswith(legacy_prefix):
    dst.write_text(managed)
else:
    preserved = old.strip()
    if preserved:
        dst.write_text(f"{managed}\n## Unmanaged Notes Before Managed Seed\n\n{preserved}\n")
    else:
        dst.write_text(managed)
PY
}

sync_managed_memory \
  "$distribution_dir/home/MEMORY.seed.md" \
  "$profile_dir/memories/MEMORY.md" \
  "memory" \
  "Maestro is Tim's B2B GTM education/tooling business."

sync_managed_memory \
  "$distribution_dir/home/USER.seed.md" \
  "$profile_dir/memories/USER.md" \
  "user" \
  "Tim prefers direct, high-signal engineering guidance."

if [ -f /app/hermes/run-ledger/schema.sql ] && command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$profile_dir/state/fabro-run-ledger.sqlite" < /app/hermes/run-ledger/schema.sql
fi
if [ -f /app/hermes/operator-ledger/schema.sql ] && command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$profile_dir/state/operator-ledger.sqlite" < /app/hermes/operator-ledger/schema.sql
fi
if [ -f /app/scripts/operator-ledger/plan-registry.mjs ] && [ -d /app/docs/operator ]; then
  node /app/scripts/operator-ledger/plan-registry.mjs index --root /app --home "$HERMES_HOME" --profile "$profile_name" >/tmp/plan-registry-index.log 2>&1 || {
    printf 'WARN: plan registry indexing failed; see /tmp/plan-registry-index.log\n' >&2
  }
fi

touch "$env_file"
chmod 600 "$env_file"
# Sync a managed env key into the profile .env. If the runtime env var is
# set, the key is written. If the runtime env var is unset or empty, the key
# is REMOVED from .env. This prevents stale values (e.g.
# GATEWAY_ALLOW_ALL_USERS=true left over from a smoke run, or rotated tokens)
# from silently persisting after they are removed from the deployment
# environment. We re-chmod after each write because Path.write_text() may
# recreate the file using the process umask; chmod is defense in depth.
persist_env_key() {
  _persist_env_key_inner "$@"
  chmod 600 "$env_file"
}
_persist_env_key_inner() {
  local key="$1"
  local value="${!key:-}"
  local has_value="0"
  if [ -n "$value" ]; then has_value="1"; fi
  PERSIST_KEY="$key" PERSIST_VALUE="$value" PERSIST_HAS_VALUE="$has_value" python3 - "$env_file" <<'PY'
import os
import sys
from pathlib import Path

path = Path(sys.argv[1])
key = os.environ["PERSIST_KEY"]
value = os.environ.get("PERSIST_VALUE", "")
has_value = os.environ.get("PERSIST_HAS_VALUE", "0") == "1"

lines = path.read_text().splitlines() if path.exists() else []
prefix = f"{key}="
existing_idx = None
for idx, line in enumerate(lines):
    if line.startswith(prefix):
        existing_idx = idx
        break

if has_value:
    if existing_idx is not None:
        lines[existing_idx] = f"{key}={value}"
    else:
        lines.append(f"{key}={value}")
else:
    if existing_idx is not None:
        lines.pop(existing_idx)

if lines:
    path.write_text("\n".join(lines) + "\n")
else:
    path.write_text("")
PY
}

persist_env_key SLACK_BOT_TOKEN
persist_env_key SLACK_APP_TOKEN
persist_env_key SLACK_ALLOWED_USERS
persist_env_key GATEWAY_ALLOW_ALL_USERS
persist_env_key SLACK_HOME_CHANNEL
persist_env_key DAYTONA_API_KEY
persist_env_key DAYTONA_ORGANIZATION_ID
persist_env_key DAYTONA_API_URL
persist_env_key OPENROUTER_API_KEY
persist_env_key HERMES_GATEWAY_MODEL_PROVIDER
persist_env_key HERMES_GATEWAY_MODEL
persist_env_key HERMES_REASONING_EFFORT
persist_env_key FABRO_SERVER
persist_env_key FABRO_DEV_TOKEN
persist_env_key GITHUB_TOKEN
persist_env_key GH_TOKEN
persist_env_key GITHUB_PLANNING_REPO
persist_env_key GITHUB_PLANNING_REPO_AUTH
persist_env_key GITHUB_PLANNING_REPO_SSH_KEY_B64
persist_env_key LINEAR_API_KEY
persist_env_key HONCHO_API_KEY
persist_env_key HONCHO_ENVIRONMENT
persist_env_key HONCHO_WORKSPACE
persist_env_key HONCHO_RECALL_MODE
persist_env_key HARVEST_API_KEY
persist_env_key MOBBIN_MCP_URL
persist_env_key MOBBIN_MCP_ENABLED
persist_env_key STITCH_API_KEY
persist_env_key STITCH_MCP_URL
persist_env_key STITCH_MCP_ENABLED

if [ -n "${FABRO_DEV_TOKEN:-}" ]; then
  fabro auth login --server "$FABRO_SERVER" --dev-token "$FABRO_DEV_TOKEN" >/tmp/fabro-auth-login.log 2>&1 || {
    printf 'fabro auth login failed; check FABRO_SERVER and FABRO_DEV_TOKEN\n' >&2
    exit 1
  }
fi

if [ -n "${HERMES_GATEWAY_MODEL_PROVIDER:-}" ] || [ -n "${HERMES_GATEWAY_MODEL:-}" ]; then
  python3 - "$profile_dir/config.yaml" <<'PY'
import os
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
provider = os.environ.get("HERMES_GATEWAY_MODEL_PROVIDER", "").strip()
model = os.environ.get("HERMES_GATEWAY_MODEL", "").strip()
model_block = re.search(r"(?ms)^model:\n(?P<body>(?:^[ \t]+.*\n)+)", text)
if model_block:
    body = model_block.group("body")
    if provider:
        body = re.sub(r"(?m)^  provider: .*$", f"  provider: {provider}", body, count=1)
    if model:
        body = re.sub(r"(?m)^  default: .*$", f"  default: {model}", body, count=1)
    text = text[:model_block.start("body")] + body + text[model_block.end("body"):]
path.write_text(text)
PY
fi

if [ -n "${HERMES_TERMINAL_CWD:-}" ]; then
  python3 - "$profile_dir/config.yaml" <<'PY'
import os
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
cwd = os.environ.get("HERMES_TERMINAL_CWD", "").strip()
if not cwd:
    raise SystemExit(0)

text = path.read_text()
terminal_block = re.search(r"(?ms)^terminal:\n(?P<body>(?:^[ \t]+.*\n)+)", text)
if terminal_block:
    body = terminal_block.group("body")
    if re.search(r"(?m)^  cwd: .*$", body):
        body = re.sub(r"(?m)^  cwd: .*$", f"  cwd: {cwd}", body, count=1)
    else:
        body += f"  cwd: {cwd}\n"
    text = text[:terminal_block.start("body")] + body + text[terminal_block.end("body"):]
else:
    text = text.rstrip() + f"\n\nterminal:\n  backend: local\n  cwd: {cwd}\n"
path.write_text(text)
PY
fi

if [ -n "${SLACK_HOME_CHANNEL:-}" ]; then
  python3 - "$profile_dir/config.yaml" <<'PY'
import os
import sys
from pathlib import Path

path = Path(sys.argv[1])
home = os.environ.get("SLACK_HOME_CHANNEL", "").strip()
if not home:
    raise SystemExit(0)

text = path.read_text()
if f'"{home}": |' not in text:
    text = text.replace('"C_AGENT_CONTROL": |', f'"{home}": |')
if f'- id: "{home}"' not in text:
    text = text.replace('- id: "C_AGENT_CONTROL"', f'- id: "{home}"')
path.write_text(text)
PY
fi

/usr/local/lib/hermes-agent/venv/bin/python3 - "$profile_dir/config.yaml" <<'PY'
import os
import sys
from pathlib import Path

import yaml

path = Path(sys.argv[1])
cfg = yaml.safe_load(path.read_text()) or {}
if not isinstance(cfg, dict):
    cfg = {}


def mapping(key):
    value = cfg.get(key)
    if not isinstance(value, dict):
        value = {}
        cfg[key] = value
    return value


def env_int(name, default):
    raw = os.environ.get(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError:
        return default


def env_float(name, default):
    raw = os.environ.get(name, str(default)).strip()
    try:
        return float(raw)
    except ValueError:
        return default


agent = mapping("agent")
agent["max_turns"] = env_int("HERMES_GATEWAY_MAX_TURNS", int(agent.get("max_turns") or 30))
agent["reasoning_effort"] = os.environ.get("HERMES_REASONING_EFFORT", "xhigh").strip() or "xhigh"

compression = mapping("compression")
compression["enabled"] = True
compression["threshold"] = float(compression.get("threshold") or 0.50)
compression["target_ratio"] = env_float("HERMES_COMPRESSION_TARGET_RATIO", float(compression.get("target_ratio") or 0.10))
compression["protect_last_n"] = env_int("HERMES_COMPRESSION_PROTECT_LAST_N", int(compression.get("protect_last_n") or 10))
compression["hygiene_hard_message_limit"] = env_int("HERMES_COMPRESSION_MESSAGE_LIMIT", int(compression.get("hygiene_hard_message_limit") or 150))

auxiliary = mapping("auxiliary")
for task_name in ("compression", "session_search"):
    task = auxiliary.get(task_name)
    if not isinstance(task, dict):
        task = {}
        auxiliary[task_name] = task
    task.setdefault("provider", "auto")
    task.setdefault("model", "")
    task.setdefault("extra_body", {})
auxiliary["compression"]["timeout"] = env_int("HERMES_AUX_COMPRESSION_TIMEOUT", int(auxiliary["compression"].get("timeout") or 60))
auxiliary["session_search"]["timeout"] = env_int("HERMES_AUX_SESSION_SEARCH_TIMEOUT", int(auxiliary["session_search"].get("timeout") or 20))
auxiliary["session_search"]["max_concurrency"] = env_int("HERMES_SESSION_SEARCH_MAX_CONCURRENCY", int(auxiliary["session_search"].get("max_concurrency") or 1))

memory = mapping("memory")
memory["memory_enabled"] = True
memory["user_profile_enabled"] = True
memory["memory_char_limit"] = int(memory.get("memory_char_limit") or 2200)
memory["user_char_limit"] = int(memory.get("user_char_limit") or 1375)
memory["nudge_interval"] = env_int("HERMES_MEMORY_NUDGE_INTERVAL", 4)
memory.setdefault("provider", "")
if os.environ.get("HONCHO_API_KEY", "").strip():
    memory["provider"] = "honcho"

skills = mapping("skills")
skills.setdefault("external_dirs", [])
skills["template_vars"] = True
skills["inline_shell"] = False
skills["inline_shell_timeout"] = int(skills.get("inline_shell_timeout") or 10)
skills["guard_agent_created"] = True
skills["creation_nudge_interval"] = env_int("HERMES_SKILL_NUDGE_INTERVAL", 4)

curator = mapping("curator")
curator["enabled"] = True
curator["interval_hours"] = env_int("HERMES_CURATOR_INTERVAL_HOURS", 24)
curator["min_idle_hours"] = int(curator.get("min_idle_hours") or 1)
curator["stale_after_days"] = int(curator.get("stale_after_days") or 30)
curator["archive_after_days"] = int(curator.get("archive_after_days") or 90)
backup = curator.get("backup")
if not isinstance(backup, dict):
    backup = {}
curator["backup"] = backup
backup["enabled"] = True
backup["keep"] = int(backup.get("keep") or 5)

delegation = mapping("delegation")
delegation["reasoning_effort"] = os.environ.get("HERMES_REASONING_EFFORT", "xhigh").strip() or "xhigh"
delegation["max_iterations"] = env_int("HERMES_DELEGATION_MAX_ITERATIONS", int(delegation.get("max_iterations") or 30))
delegation["child_timeout_seconds"] = int(delegation.get("child_timeout_seconds") or 900)
delegation["inherit_mcp_toolsets"] = True

slack = mapping("slack")
bindings = slack.get("channel_skill_bindings")
if not isinstance(bindings, list):
    bindings = []
slack["channel_skill_bindings"] = bindings


def merge_binding(channel_id, required_skills):
    if not channel_id:
        return
    row = None
    for candidate in bindings:
        if isinstance(candidate, dict) and candidate.get("id") == channel_id:
            row = candidate
            break
    if row is None:
        row = {"id": channel_id, "skills": []}
        bindings.append(row)
    current = row.get("skills")
    if not isinstance(current, list):
        current = []
    for skill in required_skills:
        if skill not in current:
            current.append(skill)
    row["skills"] = current


home_channel = os.environ.get("SLACK_HOME_CHANNEL", "").strip() or "C0AHCRH4EP4"
profile_name = os.environ.get("HERMES_PROFILE", "maestro-operator").strip() or "maestro-operator"
operator_skills = [
    "maestro-memory",
    "maestro-skill-governance",
    "maestro-integrations",
    "maestro-spec-planning",
    "fabro-babysitter",
]
specialist_skills = {
    "joni": [
        "linkedin-operator",
        "maestro-memory",
        "maestro-skill-governance",
        "maestro-spec-planning",
    ],
    "quincy": [
        "fabro-babysitter",
        "maestro-memory",
        "maestro-skill-governance",
        "maestro-spec-planning",
    ],
}
gateway_skills = specialist_skills.get(profile_name, operator_skills)
for channel_id in (home_channel, "C_AGENT_CONTROL", "C_MAESTRO"):
    merge_binding(channel_id, gateway_skills)
if profile_name == "maestro-operator":
    merge_binding("C_CODE", ["maestro-skill-governance", "maestro-integrations", "maestro-spec-planning", "fabro-babysitter"])

mcp_servers = mapping("mcp_servers")
mobbin = mcp_servers.get("mobbin")
if not isinstance(mobbin, dict):
    mobbin = {}
mcp_servers["mobbin"] = mobbin
mobbin["url"] = os.environ.get("MOBBIN_MCP_URL", "https://api.mobbin.com/mcp").strip() or "https://api.mobbin.com/mcp"
mobbin["auth"] = "oauth"
mobbin["connect_timeout"] = int(mobbin.get("connect_timeout") or 300)
mobbin["timeout"] = int(mobbin.get("timeout") or 180)
tools = mobbin.get("tools")
if not isinstance(tools, dict):
    tools = {}
mobbin["tools"] = tools
tools["resources"] = False
tools["prompts"] = False
enabled_env = os.environ.get("MOBBIN_MCP_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
# OAuth MCPs can block a headless Railway boot if cached tokens are stale or
# incomplete. Keep Mobbin opt-in so Slack uptime does not depend on an
# interactive OAuth refresh.
mobbin["enabled"] = bool(enabled_env)

stitch = mcp_servers.get("stitch")
if not isinstance(stitch, dict):
    stitch = {}
mcp_servers["stitch"] = stitch
stitch["url"] = os.environ.get("STITCH_MCP_URL", "https://stitch.googleapis.com/mcp").strip() or "https://stitch.googleapis.com/mcp"
headers = stitch.get("headers")
if not isinstance(headers, dict):
    headers = {}
stitch["headers"] = headers
headers["X-Goog-Api-Key"] = "${STITCH_API_KEY}"
stitch["connect_timeout"] = int(stitch.get("connect_timeout") or 300)
stitch["timeout"] = int(stitch.get("timeout") or 180)
tools = stitch.get("tools")
if not isinstance(tools, dict):
    tools = {}
stitch["tools"] = tools
tools["resources"] = False
tools["prompts"] = False
stitch_enabled_env = os.environ.get("STITCH_MCP_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
stitch["enabled"] = bool(stitch_enabled_env or os.environ.get("STITCH_API_KEY", "").strip())

path.write_text(yaml.safe_dump(cfg, sort_keys=False))
PY

/usr/local/lib/hermes-agent/venv/bin/python3 - "$HERMES_HOME" <<'PY'
import os
import sys
from pathlib import Path

import yaml

if not os.environ.get("HONCHO_API_KEY", "").strip():
    raise SystemExit(0)

home = Path(sys.argv[1])
for config_path in (home / "profiles").glob("*/config.yaml"):
    cfg = yaml.safe_load(config_path.read_text()) or {}
    if not isinstance(cfg, dict):
        cfg = {}
    memory = cfg.get("memory")
    if not isinstance(memory, dict):
        memory = {}
        cfg["memory"] = memory
    memory["memory_enabled"] = True
    memory["user_profile_enabled"] = True
    memory["provider"] = "honcho"
    config_path.write_text(yaml.safe_dump(cfg, sort_keys=False))
PY

node /app/scripts/hermes/render-honcho-config.mjs --home "$HERMES_HOME" --base-profile "$profile_name"

if ! fabro mcp --help >/dev/null 2>&1; then
  printf 'fabro mcp is missing; image build installed the wrong Fabro binary\n' >&2
  exit 1
fi

if [ -f /app/hermes/deploy/railway-gateway/patch-hermes-slack.py ]; then
  /usr/local/lib/hermes-agent/venv/bin/python3 /app/hermes/deploy/railway-gateway/patch-hermes-slack.py
fi

if [ -f /app/hermes/deploy/railway-gateway/patch-hermes-auxiliary-budgets.py ]; then
  /usr/local/lib/hermes-agent/venv/bin/python3 /app/hermes/deploy/railway-gateway/patch-hermes-auxiliary-budgets.py
fi

if [ -f /app/hermes/deploy/railway-gateway/patch-hermes-learning.py ]; then
  /usr/local/lib/hermes-agent/venv/bin/python3 /app/hermes/deploy/railway-gateway/patch-hermes-learning.py
fi

exec hermes -p "$profile_name" gateway run --replace --accept-hooks
