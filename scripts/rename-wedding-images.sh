#!/usr/bin/env bash
# Phase 3: rename new wedding/civil/bridal images to spec target names.
# - Never overwrites an existing target.
# - Reports missing sources instead of failing.
set -u
DIR="$(cd "$(dirname "$0")/.." && pwd)/frontend/public/images"
cd "$DIR" || exit 1

missing=0
renamed=0
skipped=0

map() {
  src="$1"; dst="$2"
  if [ ! -f "$src" ]; then
    echo "MISSING SOURCE: $src -> $dst"
    missing=$((missing+1))
    return
  fi
  if [ "$src" = "$dst" ]; then
    echo "ALREADY OK: $dst"
    skipped=$((skipped+1))
    return
  fi
  if [ -f "$dst" ]; then
    echo "TARGET EXISTS (not overwriting): $src -> $dst"
    skipped=$((skipped+1))
    return
  fi
  mv -- "$src" "$dst"
  echo "RENAMED: $src -> $dst"
  renamed=$((renamed+1))
}

# Bridal shower / bridal gown images
map bridalshowe1.jpg      bridal-white-feather-gown.jpg
map bridalshowe2.jpg      bridal-white-lace-cocktail.jpg
map bridalshowe3.jpg      bridal-champagne-corset-dress.jpg
map bridalshowe4.jpg      bridal-ivory-mermaid-gown.jpg
map bridalshowefive.jpg   bridal-offshoulder-slit-gown.jpg
# spec's second bridalshowefive -> bridal-ruffle-tier-dress.jpg: no second source file
if [ -f bridal-ruffle-tier-dress.jpg ]; then
  echo "ALREADY OK: bridal-ruffle-tier-dress.jpg"
else
  echo "MISSING SOURCE: (duplicate bridalshowefive) -> bridal-ruffle-tier-dress.jpg"
  missing=$((missing+1))
fi

# Civil wedding images
map civile1.jpg           civil-white-suit-portrait.jpg
map civile2.jpg           civil-couple-traditional-attire.jpg
map civile3.jpg           civil-white-cocktail-dress.jpg
map civile4.jpg           civil-reception-group-shot.jpg
# civilefive.jpg is not in the spec mapping and its content is unverified -> left untouched

# Wedding outfit images
map umucyo-graduation-suit.jpg grad-umucyo-tailored-suit.jpg
map weddingoutfit1.jpg    wedding-bridal-ballgown-train.jpg
map weddingoutfit2.jpg    wedding-couple-classic-pose.jpg
map weddingoutfit3.jpg    wedding-ceremony-altar-view.jpg
map weddingoutfit4.jpg    wedding-reception-first-dance.jpg
map weddingoutfitfive.jpg wedding-guest-white-lace.jpg
map weddingoutfitfour.jpg wedding-party-group-photo.jpg
map weddingoutfitfix.jpg  wedding-bride-solo-portrait.jpg
map weddingoutfitsix.jpg  wedding-outdoor-reception-setup.jpg

echo "----"
echo "renamed=$renamed skipped=$skipped missing=$missing"
