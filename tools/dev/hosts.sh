#!/bin/sh
set -eu

. tools/dev/wsl.sh

hosts_file="${HOSTS_FILE:-/etc/hosts}"
windows_hosts_file="${WINDOWS_HOSTS_FILE:-/mnt/c/Windows/System32/drivers/etc/hosts}"
loopback="127.0.0.1"
hosts="local.agent-ic.pavlop.dev mail.local.agent-ic.pavlop.dev s3.local.agent-ic.pavlop.dev grafana.local.agent-ic.pavlop.dev langfuse.local.agent-ic.pavlop.dev queues.local.agent-ic.pavlop.dev"

missing_in() {
  missing=""
  for host in $hosts; do
    if ! grep -Eq "^[^#]*[[:space:]]${host}([[:space:]]|\$)" "$1"; then
      missing="${missing} ${host}"
    fi
  done
  echo "$missing"
}

add_unix() {
  missing="$(missing_in "$hosts_file")"
  if [ -z "$missing" ]; then
    echo "hosts: all entries already present in ${hosts_file}"
    return
  fi
  echo "hosts: adding ${loopback}${missing} to ${hosts_file}"
  if [ -w "$hosts_file" ]; then
    echo "${loopback}${missing}" >>"$hosts_file"
  else
    echo "${loopback}${missing}" | sudo tee -a "$hosts_file" >/dev/null
  fi
}

add_windows() {
  missing="$(missing_in "$windows_hosts_file")"
  if [ -z "$missing" ]; then
    echo "hosts: all entries already present in the Windows hosts file"
    return
  fi
  echo "hosts: adding ${loopback}${missing} to the Windows hosts file, approve the administrator prompt"
  windows_path="$(wslpath -w "$windows_hosts_file")"
  windows_powershell "Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile', '-Command', 'Add-Content -Path ''${windows_path}'' -Value ([Environment]::NewLine + ''${loopback}${missing}'')'"
  if [ -n "$(missing_in "$windows_hosts_file")" ]; then
    echo "hosts: the Windows hosts file was not changed; add this line to ${windows_path} as administrator:" >&2
    echo "  ${loopback}${missing}" >&2
    exit 1
  fi
}

add_unix
if is_wsl; then
  add_windows
fi
