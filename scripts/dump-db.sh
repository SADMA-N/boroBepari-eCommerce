#!/usr/bin/env bash
set -euo pipefail

echo "Dumping local database data to supabase/seed.sql..."
bunx supabase db dump --local --data-only -f supabase/seed.sql
echo "Done. Commit supabase/seed.sql to share this data with collaborators."
