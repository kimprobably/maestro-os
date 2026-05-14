#!/usr/bin/env sh
set -eu

mode="${1:-check}"
codex_probe="${CODEX_PROBE_PROMPT:-Reply with OK.}"
claude_probe="${CLAUDE_PROBE_PROMPT:-Reply with OK.}"
agent_state_dir="${MAESTRO_AGENT_STATE_DIR:-}"

log() {
  printf '%s\n' "$*"
}

warn() {
  printf 'WARN: %s\n' "$*" >&2
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 2
}

need_command() {
  command -v "$1" >/dev/null 2>&1
}

link_state_dir() {
  name="$1"
  target="$2"

  if [ -z "$agent_state_dir" ] || [ ! -d "$agent_state_dir" ]; then
    return 0
  fi

  state="$agent_state_dir/$name"
  mkdir -p "$state"

  if [ -L "$target" ]; then
    ln -sfn "$state" "$target"
    return 0
  fi

  if [ -d "$target" ]; then
    if [ -z "$(find "$state" -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1)" ]; then
      cp -a "$target/." "$state/" 2>/dev/null || true
    fi
    rm -rf "$target"
  elif [ -e "$target" ]; then
    rm -f "$target"
  fi

  mkdir -p "$(dirname "$target")"
  ln -sfn "$state" "$target"
}

setup_persistent_agent_state() {
  if [ -z "$agent_state_dir" ]; then
    return 0
  fi
  if [ ! -d "$agent_state_dir" ]; then
    warn "MAESTRO_AGENT_STATE_DIR is set but not mounted: $agent_state_dir"
    return 0
  fi

  home_dir="${HOME:-/root}"
  link_state_dir claude "$home_dir/.claude"
  link_state_dir codex "$home_dir/.codex"
  log "agent_state_dir=$agent_state_dir"
}

decode_base64_to_file() {
  value="$1"
  target="$2"

  if printf '%s' "$value" | base64 -d >"$target" 2>/dev/null; then
    return 0
  fi
  if printf '%s' "$value" | base64 -D >"$target" 2>/dev/null; then
    return 0
  fi
  return 1
}

install_claude_credentials_from_env() {
  if [ -z "${CLAUDE_CODE_CREDENTIALS_JSON_BASE64:-}" ]; then
    return 0
  fi

  home_dir="${HOME:-/root}"
  creds_dir="$home_dir/.claude"
  creds_file="$creds_dir/.credentials.json"
  tmp_file="$creds_file.tmp.$$"
  mkdir -p "$creds_dir"

  if ! decode_base64_to_file "$CLAUDE_CODE_CREDENTIALS_JSON_BASE64" "$tmp_file"; then
    rm -f "$tmp_file"
    warn "CLAUDE_CODE_CREDENTIALS_JSON_BASE64 is not valid base64"
    return 1
  fi

  node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(!data.claudeAiOauth?.accessToken || !data.claudeAiOauth?.refreshToken) process.exit(2);" "$tmp_file" >/dev/null 2>&1 || {
    rm -f "$tmp_file"
    warn "CLAUDE_CODE_CREDENTIALS_JSON_BASE64 did not contain Claude OAuth credentials"
    return 1
  }

  chmod 600 "$tmp_file"
  mv "$tmp_file" "$creds_file"
  log "claude_credentials_file=installed"
}

install_codex_auth_from_env() {
  if [ -z "${CODEX_AUTH_JSON_BASE64:-}" ]; then
    return 0
  fi

  home_dir="${HOME:-/root}"
  auth_dir="$home_dir/.codex"
  auth_file="$auth_dir/auth.json"
  tmp_file="$auth_file.tmp.$$"
  mkdir -p "$auth_dir"

  if ! decode_base64_to_file "$CODEX_AUTH_JSON_BASE64" "$tmp_file"; then
    rm -f "$tmp_file"
    warn "CODEX_AUTH_JSON_BASE64 is not valid base64"
    return 1
  fi

  node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));" "$tmp_file" >/dev/null 2>&1 || {
    rm -f "$tmp_file"
    warn "CODEX_AUTH_JSON_BASE64 did not contain JSON"
    return 1
  }

  chmod 600 "$tmp_file"
  mv "$tmp_file" "$auth_file"
  log "codex_auth_file=installed"
}

install_codex_if_missing() {
  if need_command codex; then
    return 0
  fi
  if [ "$mode" != "install" ]; then
    warn "codex is not installed. Re-run with: sandbox/bootstrap-agent-auth.sh install"
    return 1
  fi
  if ! need_command npm; then
    fail "codex is missing and npm is not available to install @openai/codex"
  fi
  npm install -g @openai/codex
}

check_claude() {
  if ! need_command claude; then
    warn "claude is not installed in this sandbox"
    return 1
  fi
  claude --version >/dev/null 2>&1 || {
    warn "claude exists but --version failed"
    return 1
  }
  if command -v timeout >/dev/null 2>&1; then
    timeout 45 claude -p "$claude_probe" >/tmp/maestro-claude-probe.out 2>/tmp/maestro-claude-probe.err || {
      warn "claude subscription auth is missing or invalid. Run claude and complete /login, then rerun this script."
      return 1
    }
  else
    claude -p "$claude_probe" >/tmp/maestro-claude-probe.out 2>/tmp/maestro-claude-probe.err || {
      warn "claude subscription auth is missing or invalid. Run claude and complete /login, then rerun this script."
      return 1
    }
  fi
}

check_codex() {
  install_codex_if_missing || return 1
  codex --version >/dev/null 2>&1 || {
    warn "codex exists but --version failed"
    return 1
  }
  if codex login status >/tmp/maestro-codex-login-status.out 2>/tmp/maestro-codex-login-status.err; then
    return 0
  fi
  if command -v timeout >/dev/null 2>&1; then
    timeout 45 codex exec --skip-git-repo-check "$codex_probe" >/tmp/maestro-codex-probe.out 2>/tmp/maestro-codex-probe.err || {
      warn "codex auth is missing or invalid. Run codex login, then rerun this script."
      return 1
    }
  else
    codex exec --skip-git-repo-check "$codex_probe" >/tmp/maestro-codex-probe.out 2>/tmp/maestro-codex-probe.err || {
      warn "codex auth is missing or invalid. Run codex login, then rerun this script."
      return 1
    }
  fi
}

case "$mode" in
  check|install) ;;
  *)
    fail "usage: sandbox/bootstrap-agent-auth.sh [check|install]"
    ;;
esac

setup_persistent_agent_state
install_claude_credentials_from_env || true
install_codex_auth_from_env || true

claude_ok=0
codex_ok=0

if check_claude; then
  claude_ok=1
fi
if check_codex; then
  codex_ok=1
fi

log "claude_auth=$claude_ok"
log "codex_auth=$codex_ok"

if [ "$claude_ok" -ne 1 ] || [ "$codex_ok" -ne 1 ]; then
  cat >&2 <<'EOF'

Manual auth required inside this Daytona sandbox:
  1. Prefer non-interactive env auth when available:
       export CLAUDE_CODE_CREDENTIALS_JSON_BASE64=...
       export CODEX_AUTH_JSON_BASE64=...
       export OPENAI_API_KEY=...
  2. Otherwise run: claude
  3. In Claude Code, complete /login.
  4. Run: codex login
  5. Re-run: sandbox/bootstrap-agent-auth.sh check

Do not bulk-copy local ~/.claude or ~/.codex directories into the snapshot build context.
Use a Daytona volume mounted at MAESTRO_AGENT_STATE_DIR only when persistent
interactive CLI home/config state is required.
EOF
  exit 2
fi

log "agent_auth_ready=true"
