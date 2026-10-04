#!/bin/sh
set -eu

domain="local.agent-ic.pavlop.dev"

read_var() {
  sed -n "s/^$1=//p" .env | tail -n 1
}

https_port="$(read_var TRAEFIK_HTTPS_PORT)"
http_port="$(read_var TRAEFIK_HTTP_PORT)"
suffix=""
[ "$https_port" = "443" ] || suffix=":${https_port}"

echo "urls:"
echo "  web      https://${domain}${suffix}"
echo "  api      https://${domain}${suffix}/api"
echo "  gateway  https://${domain}${suffix}/v1"
echo "  mail     https://mail.${domain}${suffix}"
echo "  s3       https://s3.${domain}${suffix}"
echo "  grafana  https://grafana.${domain}${suffix}"
echo "  langfuse https://langfuse.${domain}${suffix}"
echo "  queues   https://queues.${domain}${suffix}"
echo "  postgres 127.0.0.1:$(read_var POSTGRES_PORT)"
echo "  http on ${http_port} redirects to https"
