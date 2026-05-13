FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV BUN_INSTALL=/root/.bun
WORKDIR /home/daytona

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    jq \
    openssh-client \
    python3 \
    python3-pip \
    pipx \
    ripgrep \
    shellcheck \
    unzip \
    xz-utils \
  && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.fabro/bin:/root/.bun/bin:/root/.local/bin:/root/.qlty/bin:${PATH}"

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install -g @anthropic-ai/claude-code @openai/codex promptfoo \
  && npm cache clean --force \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.22" \
  && ln -sf /root/.bun/bin/bun /usr/local/bin/bun

RUN pipx install spec-kitty-cli==3.1.8 \
  && curl -fsSL https://qlty.sh | sh \
  && ln -sf /root/.qlty/bin/qlty /usr/local/bin/qlty

RUN set -eux; \
  target="x86_64-unknown-linux-gnu"; \
  asset="fabro-${target}.tar.gz"; \
  url="$(curl -fsSL https://api.github.com/repos/fabro-sh/fabro/releases/latest | jq -r --arg asset "$asset" '.assets[] | select(.name == $asset) | .browser_download_url')"; \
  test -n "$url"; \
  curl -fsSL "$url" -o /tmp/fabro.tar.gz; \
  tar -xzf /tmp/fabro.tar.gz -C /tmp; \
  install -m 0755 "/tmp/fabro-${target}/fabro" /usr/local/bin/fabro; \
  rm -rf /tmp/fabro.tar.gz "/tmp/fabro-${target}"; \
  fabro --version

CMD ["/bin/bash"]
