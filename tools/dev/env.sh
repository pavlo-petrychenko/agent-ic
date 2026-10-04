#!/bin/sh
set -eu

env_file="${ENV_FILE:-.env}"
example_file="${ENV_EXAMPLE_FILE:-.env.example}"

if [ ! -f "$env_file" ]; then
  cp "$example_file" "$env_file"
  echo "env: created ${env_file} from ${example_file}"
  exit 0
fi

added=""
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    "" | "#"*) continue ;;
  esac
  key="${line%%=*}"
  if ! grep -q "^${key}=" "$env_file"; then
    [ -z "$(tail -c 1 "$env_file")" ] || echo >>"$env_file"
    echo "$line" >>"$env_file"
    added="${added} ${key}"
  fi
done <"$example_file"

if [ -n "$added" ]; then
  echo "env: added${added} to ${env_file} from ${example_file}"
else
  echo "env: ${env_file} has every variable from ${example_file}"
fi
