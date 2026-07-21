#!/usr/bin/env bash
# Zet alle variabelen uit .env.local in je Vercel-project (production, preview,
# development). Draai dit NA `npx vercel link` en VÓÓR `npx vercel --prod`.
set -uo pipefail
cd "$(dirname "$0")/.."

[ -f .env.local ] || { echo "❌ .env.local niet gevonden"; exit 1; }

VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  ADMIN_PASSWORD
  ADMIN_SESSION_SECRET
)

for key in "${VARS[@]}"; do
  val="$(grep -E "^${key}=" .env.local | head -1 | cut -d= -f2-)"
  if [ -z "$val" ]; then
    echo "⚠️  $key ontbreekt in .env.local — overgeslagen"
    continue
  fi
  for env in production preview development; do
    if printf '%s' "$val" | npx vercel env add "$key" "$env" >/dev/null 2>&1; then
      echo "  ✓ $key ($env)"
    else
      echo "  • $key ($env) bestond al of kon niet worden gezet"
    fi
  done
done

echo ""
echo "Klaar met env-variabelen. Nu deployen:  npx vercel --prod"
