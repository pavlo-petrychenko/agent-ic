#!/bin/sh
set -eu

if command -v mise >/dev/null 2>&1; then
  eval "$(mise env --shell bash)"
fi

exec "$@"
