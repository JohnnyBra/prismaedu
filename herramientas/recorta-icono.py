# Recorta un icono exportado de Canva: el PNG «transparente» llega opaco con el damero pintado.
# Se rellena el damero desde los bordes (lo que se alcanza es fondo), se centra en un lienzo cuadrado y se guarda.
# Uso: python3 herramientas/recorta-icono.py <export.png> <salida.webp> [lado=512]
# Después mira el resultado sobre fondo claro y oscuro: Canva a veces exporta otra imagen distinta de la pedida.
import sys
from PIL import Image, ImageFilter, ImageChops as C, ImageDraw

entrada, salida = sys.argv[1:3]
LADO = int(sys.argv[3]) if len(sys.argv) > 3 else 512
g = Image.open(entrada).convert('RGB')
W, H = g.size
r, v, b = g.split()
minimo, maximo = C.darker(r, C.darker(v, b)), C.lighter(r, C.lighter(v, b))
# Damero: gris claro o blanco y sin color
claro = C.multiply(minimo.point(lambda x: 255 if x > 195 else 0), C.subtract(maximo, minimo).point(lambda x: 255 if x < 16 else 0))
for x in range(0, W, 8):
    for y in (0, H - 1):
        if claro.getpixel((x, y)) == 255: ImageDraw.floodfill(claro, (x, y), 128)
for y in range(0, H, 8):
    for x in (0, W - 1):
        if claro.getpixel((x, y)) == 255: ImageDraw.floodfill(claro, (x, y), 128)
fondo = claro.point(lambda x: 255 if x == 128 else 0)
g.putalpha(C.invert(fondo).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)))
g = g.crop(g.getbbox())
lado = int(max(g.size) * 1.04)  # un poco de aire alrededor
lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
lienzo.paste(g, ((lado - g.width) // 2, (lado - g.height) // 2))
lienzo.resize((LADO, LADO), Image.LANCZOS).save(salida, 'WEBP', quality=90)
