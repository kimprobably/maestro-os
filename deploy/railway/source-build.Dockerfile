FROM rust:1.95-bookworm AS builder

WORKDIR /src

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        libssl-dev \
        nodejs \
        pkg-config \
        unzip \
    && rm -rf /var/lib/apt/lists/*

COPY source/ ./

RUN curl -fsSL https://bun.sh/install | bash

ENV PATH="/root/.bun/bin:${PATH}"

RUN bun install --frozen-lockfile \
    && mkdir -p apps/fabro-web/node_modules/.bin \
    && if [ ! -x apps/fabro-web/node_modules/.bin/tailwindcss ]; then ln -sf ../../../node_modules/.bin/tailwindcss apps/fabro-web/node_modules/.bin/tailwindcss; fi \
    && cd apps/fabro-web \
    && bun run ./scripts/build.ts \
    && cd /src \
    && rm -rf lib/crates/fabro-spa/assets \
    && mkdir -p lib/crates/fabro-spa/assets \
    && tar --exclude='*.map' -C apps/fabro-web/dist -cf - . \
        | tar -C lib/crates/fabro-spa/assets -xf - \
    && touch lib/crates/fabro-spa/assets/.gitkeep \
    && cargo build --release -p fabro-cli

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        git \
        gosu \
        libssl3 \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1000 fabro \
    && adduser --system --uid 1000 --ingroup fabro --home /var/fabro --shell /usr/sbin/nologin fabro \
    && install -d -o fabro -g fabro -m 0755 /var/fabro /storage /app

COPY --from=builder --chmod=0755 /src/target/release/fabro /usr/local/bin/fabro
COPY --chmod=0755 railway-entrypoint.sh /usr/local/bin/fabro-entrypoint
COPY app/settings.server.toml /app/settings.server.toml

ENV FABRO_CONFIG=/app/settings.server.toml \
    FABRO_HOME=/storage/.home \
    FABRO_STORAGE_DIR=/storage \
    FABRO_LOG_DESTINATION=stdout \
    FABRO_SUPPRESS_OPEN_BROWSER=1

EXPOSE 32276

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/fabro-entrypoint"]
CMD ["sh", "-c", "exec fabro server start --foreground --bind 0.0.0.0:${PORT:-32276}"]
