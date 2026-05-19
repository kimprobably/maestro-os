#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
hermes_home="${HERMES_HOME:-$HOME/.hermes}"
base_profile="maestro-operator"
worker_skills_src="$repo_root/hermes/distribution/maestro-operator/skills"
retired_profiles_dir="$hermes_home/profiles/.retired"

if ! command -v hermes >/dev/null 2>&1; then
  printf 'missing command hermes\n' >&2
  exit 1
fi

if ! hermes profile show "$base_profile" >/dev/null 2>&1; then
  printf 'missing base profile %s\n' "$base_profile" >&2
  printf 'run hermes/scripts/bootstrap-external-host.sh first\n' >&2
  exit 1
fi

copy_worker_skills() {
  local profile_dir="$1"

  if [ ! -d "$worker_skills_src" ]; then
    return 0
  fi

  mkdir -p "$profile_dir/skills"
  cp -R "$worker_skills_src/." "$profile_dir/skills/"
}

copy_profile_skills() {
  local profile="$1"
  local profile_dir="$2"
  local profile_skills_src="$repo_root/hermes/profiles/$profile/skills"

  if [ ! -d "$profile_skills_src" ]; then
    return 0
  fi

  mkdir -p "$profile_dir/skills"
  cp -R "$profile_skills_src/." "$profile_dir/skills/"
}

sync_base_auth() {
  local profile="$1"
  local profile_dir="$2"
  local base_auth="$hermes_home/profiles/$base_profile/auth.json"
  local target_auth="$profile_dir/auth.json"

  if [ ! -f "$base_auth" ]; then
    return 0
  fi

  install -m 0600 "$base_auth" "$target_auth"
  printf 'synced base auth for worker profile %s\n' "$profile"
}

retire_legacy_profile() {
  local legacy_profile="$1"
  local replacement_profile="$2"
  local legacy_dir="$hermes_home/profiles/$legacy_profile"

  if [ ! -d "$legacy_dir" ]; then
    return 0
  fi
  if ! hermes profile show "$replacement_profile" >/dev/null 2>&1; then
    return 0
  fi

  mkdir -p "$retired_profiles_dir"
  local retired_dir="$retired_profiles_dir/${legacy_profile}-$(date +%Y%m%d%H%M%S)"
  mv "$legacy_dir" "$retired_dir"
  rm -f "$HOME/.local/bin/$legacy_profile"
  printf 'retired legacy profile %s to %s\n' "$legacy_profile" "$retired_dir"
}

install_worker() {
  local profile="$1"
  local soul_src="$repo_root/hermes/profiles/$profile/SOUL.md"
  local profile_dir="$hermes_home/profiles/$profile"

  if ! hermes profile show "$profile" >/dev/null 2>&1; then
    hermes profile create "$profile" --clone --clone-from "$base_profile"
  fi

  if [ ! -f "$soul_src" ]; then
    printf 'missing SOUL source for %s\n' "$profile" >&2
    exit 1
  fi

  cp "$soul_src" "$profile_dir/SOUL.md"
  sync_base_auth "$profile" "$profile_dir"
  copy_worker_skills "$profile_dir"
  copy_profile_skills "$profile" "$profile_dir"
  printf 'installed worker profile %s\n' "$profile"
}

install_worker smith
install_worker johann
install_worker quill
install_worker quincy
install_worker joni
retire_legacy_profile fabro-operator quincy

printf 'worker profiles installed\n'
