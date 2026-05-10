#!/bin/sh
# Downloads TTF fonts needed by pdfmake for PDF report generation.
# Always exits 0 — failures are logged but never break the Docker build.
# If fonts are missing, the backend starts fine but PDF export is disabled.
# Place font files manually in assets/fonts/ and restart to enable PDF.

FONTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/fonts"
mkdir -p "$FONTS_DIR"

dl() {
  url="$1"; dest="$2"
  [ -f "$dest" ] && echo "  skip: $(basename "$dest")" && return 0
  echo "  get:  $(basename "$dest")"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --connect-timeout 20 --max-time 90 -o "$dest" "$url" && return 0
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -q --timeout=90 -O "$dest" "$url" && return 0
  fi
  echo "  WARN: could not download $(basename "$dest") (no curl/wget or 404)"
  rm -f "$dest"
  return 0   # non-fatal
}

GH="https://github.com/google/fonts/raw/main"
dl "${GH}/apache/roboto/static/Roboto-Regular.ttf"    "$FONTS_DIR/Roboto-Regular.ttf"
dl "${GH}/apache/roboto/static/Roboto-Bold.ttf"       "$FONTS_DIR/Roboto-Bold.ttf"
dl "${GH}/apache/roboto/static/Roboto-Italic.ttf"     "$FONTS_DIR/Roboto-Italic.ttf"
dl "${GH}/apache/roboto/static/Roboto-BoldItalic.ttf" "$FONTS_DIR/Roboto-BoldItalic.ttf"
dl "${GH}/ofl/notosansbengali/static/NotoSansBengali-Regular.ttf" "$FONTS_DIR/NotoSansBengali-Regular.ttf"
dl "${GH}/ofl/notosansbengali/static/NotoSansBengali-Bold.ttf"    "$FONTS_DIR/NotoSansBengali-Bold.ttf"

echo "Font dir contents:"
ls -lh "$FONTS_DIR" 2>/dev/null || echo "  (empty)"
exit 0
