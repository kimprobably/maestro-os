FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    HERMES_HOME=/data/.hermes \
    HERMES_ACCEPT_HOOKS=1 \
    FABRO_SERVER=https://fabro-maestro-production.up.railway.app/api/v1 \
    PATH=/root/.local/bin:/root/.fabro/bin:/usr/local/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/sbin:/bin

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      bash \
      ca-certificates \
      curl \
      git \
      jq \
      nodejs \
      openssh-client \
      sqlite3 \
      tar \
      xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Pin the Hermes installer to a reviewed commit + verify SHA256 before
# executing it. Building from `main` lets a routine rebuild silently deploy
# unreviewed (or compromised) gateway code into an image that holds Slack,
# Fabro, GitHub, Linear, and model credentials at runtime.
#
# The defaults below pin the current reviewed Hermes release used by this
# gateway. Railway does not reliably pass Docker build args from runtime env,
# so keep the pin in source and override only when intentionally testing a new
# upstream build. To bump:
#   1. Pick the new upstream commit SHA.
#   2. Download scripts/install.sh at that commit, review the diff.
#   3. Update HERMES_REF and HERMES_INSTALLER_SHA256 in the build config.
ARG HERMES_REF=v2026.5.7
ARG HERMES_INSTALLER_SHA256=b34368cb0628d5acbdc48fe6f4160fb6f51bb33377e8f5a7415fd790a57456e5
RUN test -n "${HERMES_REF}" || (echo "HERMES_REF build arg is required (pin Hermes to a reviewed commit SHA or release tag)" >&2 && exit 1) \
    && test -n "${HERMES_INSTALLER_SHA256}" || (echo "HERMES_INSTALLER_SHA256 build arg is required (verify against the reviewed installer)" >&2 && exit 1) \
    && curl -fsSL -o /tmp/hermes-install.sh "https://raw.githubusercontent.com/NousResearch/hermes-agent/${HERMES_REF}/scripts/install.sh" \
    && echo "${HERMES_INSTALLER_SHA256}  /tmp/hermes-install.sh" | sha256sum -c - \
    && bash /tmp/hermes-install.sh \
    && rm /tmp/hermes-install.sh \
    && /root/.local/bin/uv pip install --python /usr/local/lib/hermes-agent/venv/bin/python3 "honcho-ai>=2.0.1,<4"

WORKDIR /app

COPY hermes /app/hermes
COPY scripts/hermes /app/scripts/hermes
COPY scripts/operator-ledger /app/scripts/operator-ledger
COPY scripts/fabro /app/scripts/fabro
COPY workflows/hermes /app/workflows/hermes
COPY prompts/hermes /app/prompts/hermes
COPY docs/operator /app/docs/operator
COPY docs/HERMES-DEPLOYMENT-RUNBOOK.md /app/docs/HERMES-DEPLOYMENT-RUNBOOK.md
COPY docs/HERMES-OPERATOR-ARCHITECTURE.md /app/docs/HERMES-OPERATOR-ARCHITECTURE.md
COPY docs/FABRO*.md /app/docs/
COPY hermes/deploy/railway-gateway/entrypoint.sh /usr/local/bin/maestro-hermes-entrypoint

RUN chmod +x /usr/local/bin/maestro-hermes-entrypoint \
    && mkdir -p /data/.hermes \
    && /app/hermes/scripts/bootstrap-external-host.sh --install-fabro \
    && /app/hermes/scripts/install-worker-profiles.sh

ENTRYPOINT ["/usr/local/bin/maestro-hermes-entrypoint"]
