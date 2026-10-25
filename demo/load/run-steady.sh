#!/bin/sh
set -u

while true; do
  k6 run --quiet -o experimental-prometheus-rw /scripts/steady.js
  sleep 5
done
