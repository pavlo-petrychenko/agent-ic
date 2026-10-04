#!/bin/sh
set -eu

. tools/dev/wsl.sh

env_file=".env"
domain="local.agent-ic.pavlop.dev"
vars="TRAEFIK_HTTP_PORT:8080 TRAEFIK_HTTPS_PORT:8443 POSTGRES_PORT:5433 REDIS_PORT:6390 MINIO_API_PORT:9100 MAILPIT_SMTP_PORT:1026"

[ -f "$env_file" ] || cp .env.example "$env_file"

read_var() {
  sed -n "s/^$1=//p" "$env_file" | tail -n 1
}

write_var() {
  if grep -q "^$1=" "$env_file"; then
    sed -i.bak "s|^$1=.*|$1=$2|" "$env_file"
    rm -f "${env_file}.bak"
  else
    echo "$1=$2" >>"$env_file"
  fi
}

unix_holder() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | awk 'NR == 2 { print $1 " (pid " $2 ")" }'
  elif command -v ss >/dev/null 2>&1; then
    ss -Hltnp "sport = :$1" 2>/dev/null | awk 'NR == 1 { if (match($0, /"[^"]+",pid=[0-9]+/)) { split(substr($0, RSTART + 1, RLENGTH - 1), p, "\",pid="); print p[1] " (pid " p[2] ")" } else print "a process" }'
  fi
}

windows_holder() {
  windows_powershell "Get-NetTCPConnection -State Listen -LocalPort $1 -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { (Get-Process -Id \$_.OwningProcess).ProcessName + ' (windows pid ' + \$_.OwningProcess + ')' }"
}

holder() {
  who="$(unix_holder "$1")"
  if [ -z "$who" ] && is_wsl; then
    who="$(windows_holder "$1")"
  fi
  echo "$who"
}

if [ -n "$(docker compose ps --status running --quiet 2>/dev/null)" ]; then
  echo "ports: the stack is already running, keeping the ports from ${env_file}"
  exit 0
fi

used=""
for entry in $vars; do
  used="${used} $(read_var "${entry%%:*}")"
done

changed=0
for entry in $vars; do
  var="${entry%%:*}"
  port="$(read_var "$var")"
  who="$(holder "$port")"
  [ -n "$who" ] || continue

  next="${entry##*:}"
  while [ -n "$(holder "$next")" ] || echo " ${used} " | grep -q " ${next} "; do
    next=$((next + 1))
  done
  echo "ports: ${port} (${var}) is held by ${who}, using ${next} instead"
  write_var "$var" "$next"
  used="${used} ${next}"
  changed=1
done

https_port="$(read_var TRAEFIK_HTTPS_PORT)"
if [ "$https_port" = "443" ]; then
  write_var PUBLIC_URL "https://${domain}"
else
  write_var PUBLIC_URL "https://${domain}:${https_port}"
fi

if [ "$changed" = "1" ]; then
  tools/dev/urls.sh
else
  echo "ports: all host ports are free"
fi
