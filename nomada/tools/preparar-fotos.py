"""Recorta las fotos de prueba a partir de capturas del Instagram @nomada.amb.
Uso: python3 preparar-fotos.py <captura1.webp> <captura2.webp> <salida_dir>
Son fotos de PRUEBA (baja resolución). Reemplazar por las originales del dueño."""
import sys
from PIL import Image, ImageFilter, ImageDraw
a, b, out = sys.argv[1], sys.argv[2], sys.argv[3]
XS = [(12,278),(280,544),(546,810),(812,1077)]
YS = [(2,355),(358,710)]
def tile(im, r, c, top=30, right=30, bottom=0):
    x0,x1 = XS[c]; y0,y1 = YS[r]
    return im.crop((x0, y0+top, x1-right, y1-bottom)).convert('RGB')
def save(img, path, scale=2.4):
    w,h = img.size
    img = img.resize((int(w*scale), int(h*scale)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    img.save(f'{out}/{path}', quality=84, optimize=True)
    print(path, img.size)
I2, I3 = Image.open(a), Image.open(b)
save(tile(I2,0,0),'platos/tiradito-corvina.jpg')
save(tile(I2,1,0,top=30,right=30),'platos/lomo-remolacha.jpg')
save(tile(I2,1,1,top=8,right=8,bottom=70),'platos/ensalada-cuscus.jpg')
save(tile(I3,0,1,top=30),'platos/coliflor-horno.jpg')
save(tile(I3,1,0,top=30),'platos/gyozas.jpg')
save(tile(I3,1,1,top=30,right=8),'platos/lomo-yema.jpg')
save(tile(I2,0,3),'cocteles/coctel-rojo.jpg')
save(tile(I3,1,3,top=30,right=8,bottom=75),'cocteles/coctel-espuma.jpg')
save(tile(I2,0,1,top=30,right=30),'equipo/chef-retrato.jpg')
save(tile(I3,0,0,top=30),'equipo/chef-emplatando.jpg')
save(tile(I3,1,2,top=30,right=30),'equipo/sommelier.jpg')
save(tile(I2,1,2,top=30,right=30),'ambiente/mesa-servida.jpg')
save(tile(I2,0,2,top=30),'ambiente/deshidratador.jpg')
save(tile(I3,0,2,top=30),'ambiente/cuchillos.jpg')
save(tile(I3,0,3,top=30,right=30),'ambiente/algas.jpg')
# llama de paja: tapar el botón "Mensaje" flotante pintando oscuro con borde difuso
ll = tile(I2,1,3,top=8,right=8).convert('RGB')
w,h = ll.size
m = Image.new('L',(w,h),0); d = ImageDraw.Draw(m)
d.rectangle((int(w*0.62),int(h*0.80),w,h), fill=255)
m = m.filter(ImageFilter.GaussianBlur(14))
ll = Image.composite(Image.new('RGB',(w,h),(14,12,11)), ll, m)
save(ll,'ambiente/llama-paja.jpg')
