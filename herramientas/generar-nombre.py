"""
Genera assets/nombre.json: el nombre dibujado como trazos (SVG) con la tipografía,
para la animación de escritura de la portada.

Uso (desde la carpeta del sitio):
    pip install fonttools uharfbuzz
    python3 herramientas/generar-nombre.py "Pa|blo Maz|zo|la" Hurricane-Regular.ttf

El texto tiene que ser igual al valor de "nombre" en config.txt.
Si no coinciden, el sitio muestra el nombre con la tipografía común (sin trazo).
"""
import json, sys, os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen


def main(texto, ttf, out):
    blob = hb.Blob.from_file_path(ttf)
    face = hb.Face(blob)
    font = hb.Font(face)
    tt = TTFont(ttf)
    gs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    upm = tt['head'].unitsPerEm

    words = []
    gmin, gmax = 0, 0
    for word in texto.split():
        parts = [p for p in word.split('|') if p]
        plain = ''.join(parts)
        # índice de carácter donde empieza cada parte
        starts, acc = [], 0
        for p in parts:
            starts.append(acc)
            acc += len(p)
        buf = hb.Buffer()
        buf.add_str(plain)
        buf.guess_segment_properties()
        hb.shape(font, buf, {'kern': True, 'liga': True, 'calt': True})
        x = 0
        out_parts = [{'texto': p, 'glifos': [], 'x0': None, 'x1': None} for p in parts]
        xmin, xmax = None, None
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = order[info.codepoint]
            # a qué parte pertenece este glifo (por el carácter que lo originó)
            k = max(i for i, s in enumerate(starts) if s <= info.cluster)
            gx, gy = x + pos.x_offset, pos.y_offset
            pen = SVGPathPen(gs)
            # y hacia abajo, como en SVG
            gs[name].draw(TransformPen(pen, (1, 0, 0, -1, gx, -gy)))
            d = pen.getCommands()
            bp = BoundsPen(gs)
            gs[name].draw(TransformPen(bp, (1, 0, 0, -1, gx, -gy)))
            part = out_parts[k]
            if part['x0'] is None:
                part['x0'] = x
            part['x1'] = x + pos.x_advance
            if d:
                part['glifos'].append(d)
                b = bp.bounds
                xmin = b[0] if xmin is None else min(xmin, b[0])
                xmax = b[2] if xmax is None else max(xmax, b[2])
                gmin, gmax = min(gmin, b[1]), max(gmax, b[3])
            x += pos.x_advance
        xmin = min(xmin, 0)
        xmax = max(xmax, x)
        words.append({'x': round(xmin), 'ancho': round(xmax - xmin), 'avance': x, 'partes': out_parts})

    data = {
        'texto': texto,
        'fuente': os.path.splitext(os.path.basename(ttf))[0],
        'upm': upm,
        'y': round(gmin) - 10,
        'alto': round(gmax - gmin) + 20,
        'palabras': words,
    }
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print('Listo:', out, os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    here = os.path.dirname(os.path.abspath(__file__))
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else os.path.join(here, '..', 'assets', 'nombre.json'))
