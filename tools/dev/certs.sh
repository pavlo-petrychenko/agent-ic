#!/bin/sh
set -eu

domain="local.agent-ic.pavlop.dev"
dir=".certs"
cert="${dir}/${domain}.pem"
key="${dir}/${domain}-key.pem"

mkdir -p "$dir"

if [ -f "$cert" ] && [ -f "$key" ]; then
  echo "certs: ${cert} already exists"
else
  mkcert -cert-file "$cert" -key-file "$key" "*.${domain}" "$domain"
fi
