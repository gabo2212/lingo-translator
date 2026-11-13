#!/usr/bin/env bash
# Written on Windows. Not executed on Arch in the session that added it.
# Publishes an mDNS A record for lingo.local. It does not scan the LAN.
set -euo pipefail
IP="${1:-}"
if [[ -z "$IP" ]]; then
  IP="$(ip -4 route get 1.1.1.1 | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')"
fi
if [[ -z "$IP" ]]; then
  echo "No IPv4 address. Run: bash scripts/publish-lingo-local.sh 192.168.x.x" >&2
  exit 1
fi
echo "Publishing lingo.local -> $IP"
exec avahi-publish -a -R lingo.local "$IP"
