#!/bin/sh
set -eu

hosts_file="${HOSTS_FILE:-/etc/hosts}"
missing=""

for host in \
  local.agent-ic.pavlop.dev \
  mail.local.agent-ic.pavlop.dev \
  s3.local.agent-ic.pavlop.dev \
  grafana.local.agent-ic.pavlop.dev \
  langfuse.local.agent-ic.pavlop.dev; do
  if ! grep -Eq "^[^#]*[[:space:]]${host}([[:space:]]|\$)" "$hosts_file"; then
    missing="${missing} ${host}"
  fi
done

if [ -z "$missing" ]; then
  echo "hosts: all entries already present in ${hosts_file}"
  exit 0
fi

echo "hosts: adding 127.0.0.1${missing} to ${hosts_file}"
if [ -w "$hosts_file" ]; then
  echo "127.0.0.1${missing}" >>"$hosts_file"
else
  echo "127.0.0.1${missing}" | sudo tee -a "$hosts_file" >/dev/null
fi
