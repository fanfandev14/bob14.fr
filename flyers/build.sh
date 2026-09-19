#!/usr/bin/env bash
# Régénère les PDF de assets/docs/ depuis les sources HTML de ce dossier.
# Usage : npm run build:flyers   (ou bash flyers/build.sh)
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="$here/../assets/docs"

chrome=""
for c in google-chrome chromium chromium-browser google-chrome-stable; do
  command -v "$c" >/dev/null 2>&1 && chrome="$c" && break
done
[ -n "$chrome" ] || { echo "Chrome/Chromium introuvable — requis pour l'impression PDF." >&2; exit 1; }

# source (sans .dc.html) -> nom du PDF publié (sans BOB- ni -2026-2027.pdf)
render() {
  local src="$here/$1.dc.html" dst="$out/BOB-$2-2026-2027.pdf"
  [ -f "$src" ] || { echo "source manquante : $src" >&2; exit 1; }
  local url="file://$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$src")"
  "$chrome" --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
            --virtual-time-budget=20000 --print-to-pdf="$dst" "$url" 2>/dev/null
  echo "  $(basename "$dst")  $(( $(stat -c%s "$dst") / 1024 )) Ko"
}

echo "Rendu des flyers →  $out"
render "Calendrier 2026-2027"        "Calendrier-Creneaux"
render "Flyer Jeunes 2026-2027"      "Jeunes"
render "Flyer Adultes 2026-2027"     "Adultes"
render "Flyer Tout le monde 2026-2027" "All"

cat <<'EOF'

Le rendu a besoin du réseau : les polices viennent de fonts.googleapis.com et le
générateur de QR codes de cdn.jsdelivr.net. Hors ligne, les PDF sortent en police
de repli et sans QR code — vérifier le rendu avant de committer.

Penser à reporter les tailles affichées ci-dessus dans les cartes « dl-card__meta »
de jeunes.html, adultes.html et infos-pratiques.html.
EOF
