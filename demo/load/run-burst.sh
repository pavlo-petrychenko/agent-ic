#!/bin/sh
set -u

exec k6 run -o experimental-prometheus-rw /scripts/burst.js
