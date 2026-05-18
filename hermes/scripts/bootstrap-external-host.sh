#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
distribution_dir="$repo_root/hermes/distribution/maestro-operator"
profile_name="maestro-operator"
hermes_home="${HERMES_HOME:-$HOME/.hermes}"
profile_dir="$hermes_home/profiles/$profile_name"
ledger_dir="$profile_dir/state"
ledger_db="$ledger_dir/fabro-run-ledger.sqlite"
operator_ledger_db="$ledger_dir/operator-ledger.sqlite"

install_hermes="false"
install_fabro="false"

install_fabro_nightly_release() {
  os="$(uname -s)"
  arch="$(uname -m)"
  case "$os:$arch" in
    Linux:x86_64) target="x86_64-unknown-linux-gnu" ;;
    Linux:aarch64) target="aarch64-unknown-linux-gnu" ;;
    Darwin:arm64) target="aarch64-apple-darwin" ;;
    *) printf 'unsupported Fabro nightly platform: %s %s\n' "$os" "$arch" >&2; return 1 ;;
  esac
  if [ "$os" = "Linux" ] && ldd --version 2>&1 | grep -qi musl; then
    target="${target%-gnu}-musl"
  fi

  tmp_dir="$(mktemp -d)"
  asset="fabro-${target}.tar.gz"
  trap 'rm -rf "$tmp_dir"' EXIT
  if command -v gh >/dev/null 2>&1; then
    tag="$(gh api repos/fabro-sh/fabro/releases \
      --jq 'map(select((.draft | not) and .prerelease)) | .[0].tag_name')"
    if [ -z "$tag" ] || [ "$tag" = "null" ]; then
      printf 'could not resolve latest Fabro nightly release tag\n' >&2
      return 1
    fi
    gh release download "$tag" --repo fabro-sh/fabro --pattern "$asset" --dir "$tmp_dir" --clobber
  elif command -v curl >/dev/null 2>&1 && command -v jq >/dev/null 2>&1; then
    url="$(curl -fsSL https://api.github.com/repos/fabro-sh/fabro/releases \
      | jq -r --arg asset "$asset" '
        map(select((.draft | not) and .prerelease))[0].assets[]
        | select(.name == $asset)
        | .browser_download_url
      ')"
    if [ -z "$url" ] || [ "$url" = "null" ]; then
      printf 'could not resolve latest Fabro nightly asset URL\n' >&2
      return 1
    fi
    curl -fsSL "$url" -o "$tmp_dir/$asset"
  else
    printf 'missing gh or curl+jq; cannot install Fabro nightly release\n' >&2
    return 1
  fi
  tar xzf "$tmp_dir/$asset" -C "$tmp_dir"
  install_dir="${FABRO_INSTALL_DIR:-$HOME/.fabro/bin}"
  mkdir -p "$install_dir"
  install -m 0755 "$tmp_dir/fabro-${target}/fabro" "$install_dir/fabro"
  export PATH="$install_dir:$PATH"
  fabro --version
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --install-hermes)
      install_hermes="true"
      shift
      ;;
    --install-fabro)
      install_fabro="true"
      shift
      ;;
    --help|-h)
      cat <<'EOF'
Usage: hermes/scripts/bootstrap-external-host.sh [--install-hermes] [--install-fabro]

Installs the Maestro Hermes profile distribution into the current external host,
copies bounded memory seeds, and initializes the Fabro run ledger.

This script never prints secret values and does not run interactive OAuth.
EOF
      exit 0
      ;;
    *)
      printf 'unknown argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
done

if ! command -v hermes >/dev/null 2>&1; then
  if [ "$install_hermes" = "true" ]; then
    curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
  else
    printf 'missing command hermes\n' >&2
    printf 'rerun with --install-hermes on the external host, or install Hermes first\n' >&2
    exit 1
  fi
fi

if ! command -v hermes >/dev/null 2>&1; then
  printf 'missing command hermes after install attempt\n' >&2
  exit 1
fi

if ! command -v fabro >/dev/null 2>&1; then
  if [ "$install_fabro" = "true" ]; then
    if command -v brew >/dev/null 2>&1; then
      brew install fabro-sh/tap/fabro-nightly
    else
      install_fabro_nightly_release
    fi
  else
    printf 'missing command fabro\n' >&2
    printf 'rerun with --install-fabro on the external host, or install Fabro first\n' >&2
    exit 1
  fi
fi

if command -v fabro >/dev/null 2>&1 && ! fabro mcp --help >/dev/null 2>&1; then
  if [ "$install_fabro" = "true" ]; then
    printf 'existing fabro lacks `fabro mcp`; installing upstream nightly release\n' >&2
    if command -v brew >/dev/null 2>&1; then
      brew upgrade fabro-sh/tap/fabro-nightly || brew install fabro-sh/tap/fabro-nightly
    else
      install_fabro_nightly_release
    fi
  fi
fi

if ! command -v fabro >/dev/null 2>&1; then
  printf 'missing command fabro after install attempt\n' >&2
  exit 1
fi

if ! fabro mcp --help >/dev/null 2>&1; then
  printf 'installed fabro does not expose `fabro mcp`; install upstream main/nightly before continuing\n' >&2
  exit 1
fi

if [ ! -f "$distribution_dir/distribution.yaml" ]; then
  printf 'missing distribution at %s\n' "$distribution_dir" >&2
  exit 1
fi

printf 'installing Hermes profile distribution: %s\n' "$profile_name"
hermes profile install "$distribution_dir" --alias --yes

mkdir -p "$profile_dir/memories" "$ledger_dir"

if [ -f "$distribution_dir/home/MEMORY.seed.md" ] && [ ! -f "$profile_dir/memories/MEMORY.md" ]; then
  cp "$distribution_dir/home/MEMORY.seed.md" "$profile_dir/memories/MEMORY.md"
  printf 'seeded MEMORY.md\n'
fi

if [ -f "$distribution_dir/home/USER.seed.md" ] && [ ! -f "$profile_dir/memories/USER.md" ]; then
  cp "$distribution_dir/home/USER.seed.md" "$profile_dir/memories/USER.md"
  printf 'seeded USER.md\n'
fi

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$ledger_db" < "$repo_root/hermes/run-ledger/schema.sql"
  sqlite3 "$operator_ledger_db" < "$repo_root/hermes/operator-ledger/schema.sql"
  printf 'initialized Fabro and operator ledger sqlite\n'
else
  touch "$ledger_dir/fabro-run-ledger.jsonl"
  touch "$ledger_dir/operator-ledger.jsonl"
  printf 'sqlite3 missing; initialized JSONL ledger fallbacks\n'
fi

printf 'bootstrap complete\n'
printf 'next: replace Slack channel placeholders in %s/config.yaml\n' "$profile_dir"
printf 'next: run fabro auth login --server "$FABRO_SERVER" --dev-token "$FABRO_DEV_TOKEN"\n'
printf 'next: run %s auth add openai-codex\n' "$profile_name"
printf 'next: run %s gateway start after Slack tokens are present\n' "$profile_name"
