#!/usr/bin/env bash
set -euo pipefail

SEED_FILE="supabase/seed.sql"

echo "Dumping local database data to $SEED_FILE..."
bunx supabase db dump --local --data-only -f "$SEED_FILE"

echo "Sanitizing OAuth tokens from account table..."
sed -i -E \
  "s/'ya29\.[^']*'/NULL/g; s/'eyJhbG[^']*'/NULL/g" \
  "$SEED_FILE"

echo "Done. Commit $SEED_FILE to share this data with collaborators."
