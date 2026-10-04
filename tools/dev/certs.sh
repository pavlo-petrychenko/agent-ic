#!/bin/sh
set -eu

. tools/dev/wsl.sh

domain="local.agent-ic.pavlop.dev"
dir=".certs"
cert="${dir}/${domain}.pem"
key="${dir}/${domain}-key.pem"
root_ca_file="rootCA.pem"

mkdir -p "$dir"

if [ -f "$cert" ] && [ -f "$key" ]; then
  echo "certs: ${cert} already exists"
else
  mkcert -cert-file "$cert" -key-file "$key" "*.${domain}" "$domain"
fi

if is_wsl; then
  root_ca="$(wslpath -w "$(mkcert -CAROOT)/${root_ca_file}")"
  echo "certs: trusting the mkcert certificate authority in Windows, approve the security prompt if one appears"
  certutil.exe -user -addstore Root "$root_ca" >/dev/null
fi
