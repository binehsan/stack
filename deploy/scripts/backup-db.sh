#!/bin/bash
# Daily Postgres backup — run by deploy/systemd/stack-backup.timer, or by
# hand any time: bash deploy/scripts/backup-db.sh
#
# Dumps from *inside* the postgres container using its own POSTGRES_USER/
# POSTGRES_DB env vars (set by docker-compose.yml) rather than parsing
# .env on the host — one less place credentials need to be read from.
set -euo pipefail

STACK_DIR="/srv/stack"
BACKUP_DIR="$STACK_DIR/backups"
# How long a local backup sticks around before being pruned. This alone
# only protects against a bad migration/accidental deletion, not a dead
# VPS disk — see this script's own trailing comment for the off-box step
# that actually covers disk failure, once you've picked a storage provider.
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
cd "$STACK_DIR"

timestamp=$(date +%F_%H%M%S)
outfile="$BACKUP_DIR/stack_${timestamp}.sql.gz"

docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$outfile"

# Sanity check — an empty/near-empty file means pg_dump silently failed
# (wrong container name, Postgres not actually up, etc.) rather than
# genuinely producing a tiny valid dump, which never happens for a real
# schema. Better to find out now than discover it during a real restore.
size=$(stat -c%s "$outfile" 2>/dev/null || stat -f%z "$outfile")
if [ "$size" -lt 1024 ]; then
  echo "## backup-db.sh: ${outfile} is suspiciously small (${size} bytes) — check 'docker compose ps'" >&2
  exit 1
fi

find "$BACKUP_DIR" -name 'stack_*.sql.gz' -mtime "+${KEEP_DAYS}" -delete

echo "Backed up to ${outfile} ($(du -h "$outfile" | cut -f1))"

# --- Off-box copy (do this next, once you've picked a provider) -----------
# A backup that lives only on this VPS doesn't survive this VPS dying.
# Cheapest path: install rclone (`sudo dnf install -y rclone` or the
# official install script), run `rclone config` once to add a remote
# (Backblaze B2 and S3-compatible object storage both have generous free
# tiers), then add one line here:
#   rclone copy "$outfile" remote:stack-backups/
