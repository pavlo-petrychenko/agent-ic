ARG NODE_IMAGE=node:24-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

FROM ${NODE_IMAGE} AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

FROM dependencies AS build
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline
RUN pnpm exec turbo telemetry disable
RUN pnpm exec turbo run build --filter=web

FROM ${NGINX_IMAGE} AS runtime
USER root
RUN apk upgrade --no-cache
USER 101
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
COPY deploy/docker/web/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/docker/web/security-headers.conf /etc/nginx/snippets/security-headers.conf
