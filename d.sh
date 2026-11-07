#!/usr/bin/env bash
set -Eeuo pipefail

ADDRESS="4wow4KoHsYAe2dJhv2iK5jqALrnW6iurvJ988rPkPYpasGQAPeEtNc7kSntK6aHUWbrLcdPGWa7djbMabLXY6jLsyeaz4"
MODE="direct"
POOL_URL="stratum+tcp://bntpool.com:3333"
POOL_WORKER="KRAZOBU"
CPU_THREADS=""
CPU_MEMORY_RESERVE_PERCENT="0"
CPU_PAGE_MODE="regular"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
MINER="${SCRIPT_DIR}/seine"

log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ -f "$MINER" ]] || die "Seine binary not found: $MINER (place ./seine beside this script)"
[[ -x "$MINER" ]] || chmod +x "$MINER" || die "Cannot make Seine executable: $MINER"

MINER_ARGS=(
  --pool-url "$POOL_URL"
  --address "$ADDRESS"
  --cpu-memory-reserve-percent "$CPU_MEMORY_RESERVE_PERCENT"
  --cpu-page-mode "$CPU_PAGE_MODE"
)
[[ -n "$CPU_THREADS" ]] && MINER_ARGS+=(--threads "$CPU_THREADS")
[[ -n "$POOL_WORKER" ]] && MINER_ARGS+=(--pool-worker "$POOL_WORKER")

log "Direct pool: $POOL_URL"
log "Threads: automatic; memory reserve: ${CPU_MEMORY_RESERVE_PERCENT}%; page mode: ${CPU_PAGE_MODE}"
log "Worker: $POOL_WORKER"
log "Command: $MINER ${MINER_ARGS[*]}"

exec "$MINER" "${MINER_ARGS[@]}"
