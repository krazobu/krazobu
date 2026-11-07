#!/usr/bin/env bash
set -Eeuo pipefail

ADDRESS="4wow4KoHsYAe2dJhv2iK5jqALrnW6iurvJ988rPkPYpasGQAPeEtNc7kSntK6aHUWbrLcdPGWa7djbMabLXY6jLsyeaz4"
POOL_URL="stratum+tcp://bntpool.com:3333"
POOL_WORKER="KRAZOBU"
CPU_MEMORY_RESERVE_PERCENT="0"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MINER="${SCRIPT_DIR}/seine"

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ -f "$MINER" ]] || die "Seine binary not found: $MINER"
[[ -x "$MINER" ]] || chmod +x "$MINER"

# ---- AUTO-DETECT: threads from cores + RAM (each thread ~2 GiB) ----
CORES="$(nproc)"
RAM_AVAIL_MB="$(free -m | awk '/^Mem:/{print $7}')"
RAM_THREADS=$(( RAM_AVAIL_MB / 2048 ))
(( RAM_THREADS < 1 )) && RAM_THREADS=1
THREADS=$(( CORES < RAM_THREADS ? CORES : RAM_THREADS ))
(( THREADS < 1 )) && THREADS=1

# ---- AUTO-DETECT: page mode from hugepages ----
HP_TOTAL="$(awk '/^HugePages_Total:/{print $2}' /proc/meminfo)"
if [[ -n "$HP_TOTAL" && "$HP_TOTAL" -gt 0 ]]; then
  PAGE_MODE="large"
else
  PAGE_MODE="regular"
fi

log "Detected: cores=$CORES available_ram=${RAM_AVAIL_MB}MB hugepages=${HP_TOTAL:-0}"
log "Resolved: threads=$THREADS page_mode=$PAGE_MODE"

MINER_ARGS=(
  --pool-url "$POOL_URL"
  --address "$ADDRESS"
  --threads "$THREADS"
  --cpu-autotune-max-threads "$THREADS"
  --cpu-memory-reserve-percent "$CPU_MEMORY_RESERVE_PERCENT"
  --cpu-page-mode "$PAGE_MODE"
  --pool-worker "$POOL_WORKER"
)

log "Command: $MINER ${MINER_ARGS[*]}"
exec "$MINER" "${MINER_ARGS[@]}"
