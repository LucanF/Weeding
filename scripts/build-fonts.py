#!/usr/bin/env python3
"""
Fonturile „scris de mână" (Google Fonts, licență OFL) → woff2 self-hosted în public/fonts/.
  - Great Vibes: nume și titluri (ca pe invitația tipărită)
  - Alex Brush: textul de mână
  - Cormorant Garamond (variabil): cifre, ore și data (serif, ca pe invitație)
Dacă un font nu are ș/ț, le compunem din s/t + virgulă (add_romanian_comma_letters).
Fiecare e redus la latin + diacriticele românești (ă â î ș ț, inclusiv variantele cu sedilă).
Rulează:  pip install fonttools brotli  &&  python scripts/build-fonts.py
"""
import io
import pathlib
import urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'fonts'
BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
FONTS = {
    'great-vibes.woff2': 'greatvibes/GreatVibes-Regular.ttf',
    'alex-brush.woff2': 'alexbrush/AlexBrush-Regular.ttf',
    'cormorant.woff2': 'cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf',
}
TEXT = ''.join(chr(c) for c in range(0x20, 0x7F)) + ''.join(chr(c) for c in range(0xA0, 0x100))
TEXT += 'ĂăȘșȚțŞşŢţ–—‘’‚“”„…·•→←↑↓€×'



def add_romanian_comma_letters(t: TTFont) -> None:
    """Adaugă ș ț Ș Ț (și variantele cu sedilă) ca glife compuse: litera + virgula fontului."""
    cmap = t.getBestCmap()
    if 0x219 in cmap or 'comma' not in t.getGlyphOrder():
        return
    glyf, hmtx = t['glyf'], t['hmtx']

    def bbox(n):
        g = glyf[n]
        g.recalcBounds(glyf)
        return g.xMin, g.yMin, g.xMax, g.yMax

    cx0, _, cx1, cy1 = bbox('comma')
    new = {}
    for ch, uni_comma, uni_cedilla in [('s', 0x219, 0x15F), ('S', 0x218, 0x15E), ('t', 0x21B, 0x163), ('T', 0x21A, 0x162)]:
        base = cmap[ord(ch)]
        bx0, by0, bx1, _ = bbox(base)
        mid = bx0 + (bx1 - bx0) * (0.42 if ch == 't' else 0.5)  # la „t" virgula stă sub tijă
        dx, dy = round(mid - (cx0 + cx1) / 2), round(min(by0, 0) - 30 - cy1)
        name = base + 'commaaccent_ro'
        g = Glyph()
        g.numberOfContours = -1
        g.components = []
        for gname, x, y in [(base, 0, 0), ('comma', dx, dy)]:
            c = GlyphComponent()
            c.glyphName, c.x, c.y = gname, x, y
            c.flags = 0x4 if gname == base else 0  # metrici de la literă
            g.components.append(c)
        glyf[name] = g
        hmtx[name] = hmtx[base]
        new[uni_comma] = new[uni_cedilla] = name
    order = list(dict.fromkeys(t.getGlyphOrder() + list(glyf.glyphOrder) + list(new.values())))
    t.setGlyphOrder(order)
    glyf.glyphOrder = order
    for table in t['cmap'].tables:
        if table.isUnicode():
            table.cmap.update(new)


OUT.mkdir(parents=True, exist_ok=True)
for name, src in FONTS.items():
    data = urllib.request.urlopen(BASE + src).read()
    font = TTFont(io.BytesIO(data))
    add_romanian_comma_letters(font)
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
