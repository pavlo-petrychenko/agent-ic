#!/bin/sh

wsl_kernel_marker="microsoft"

is_wsl() {
  [ -n "${WSL_DISTRO_NAME:-}" ] || grep -qi "$wsl_kernel_marker" /proc/version 2>/dev/null
}

windows_powershell() {
  powershell.exe -NoProfile -NonInteractive -Command "$1" | tr -d '\r'
}
