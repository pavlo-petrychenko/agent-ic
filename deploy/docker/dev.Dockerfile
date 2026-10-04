FROM node:24-trixie-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --global pnpm@12.9.1 \
  && npm cache clean --force

ENV CI=true
ENV npm_config_store_dir=/pnpm-store
ENV npm_config_update_notifier=false

WORKDIR /workspace
