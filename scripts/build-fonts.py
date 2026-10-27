#!/usr/bin/env python3
"""
Fonturile „scris de mână" (Google Fonts, licență OFL) → woff2 self-hosted în public/fonts/.
  - Great Vibes: titluri, nume, monograme
  - Caveat (variabil, 400–700): restul textului
Fiecare e redus la latin + diacriticele românești (ă â î ș ț, inclusiv variantele cu sedilă).
Rulează:  pip install fonttools brotli  &&  python scripts/build-fonts.py
"""
import io
import pathlib
import urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'fonts'
BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FONTS = {
    'great-vibes.woff2': 'greatvibes/GreatVibes-Regular.ttf',
    'caveat.woff2': 'caveat/Caveat%5Bwght%5D.ttf',
}
TEXT = ''.join(chr(c) for c in range(0x20, 0x7F)) + ''.join(chr(c) for c in range(0xA0, 0x100))
TEXT += 'ĂăȘșȚțŞşŢţ–—‘’‚“”„…·•→←↑↓€×'

OUT.mkdir(parents=True, exist_ok=True)
for name, src in FONTS.items():
    data = urllib.request.urlopen(BASE + src).read()
    font = TTFont(io.BytesIO(data))
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'clig', 'calt', 'ccmp', 'locl', 'mark', 'mkmk']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(text=TEXT)
    sub.subset(font)
    font.flavor = 'woff2'
    dest = OUT / name
    font.save(dest)
    print(f'{name:22} {dest.stat().st_size / 1024:.1f} KB')
