#!/usr/bin/env python3
"""Genera data/seed.json (catalogo, ocasiones, contenido y 3 meses de datos mock).
Las fechas se guardan RELATIVAS (daysAgo / daysFromNow); data.js las convierte
a fechas reales al inicializar o al reiniciar el demo."""
import json, random, os
random.seed(7)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

occasions = [
 dict(id="infantil", name="Cumpleaños infantil", icon="🎈", palette=["#F06FA6","#7FD1C7","#B59BE0"], blurb="Globos, carrito de algodón y piñata", scene="pastel"),
 dict(id="adulto", name="Cumpleaños adulto", icon="🥂", palette=["#2B2B3A","#C0C4CC","#F4C95D"], blurb="Números gigantes y backdrop elegante", scene="noche"),
 dict(id="babyshower", name="Baby shower", icon="🍼", palette=["#9ED8F0","#FFFFFF","#F9C6D9"], blurb="Dulce, suave y lleno de detalles", scene="pastel"),
 dict(id="genero", name="Revelación de género", icon="💙", palette=["#7CC4F0","#F6A5C8","#FFFFFF"], blurb="¿Niño o niña? Que sea inolvidable", scene="pastel"),
 dict(id="bautizo", name="Bautizo", icon="🕊️", palette=["#FFFFFF","#CFE9F7","#E8D7A8"], blurb="Padrinos, recuerdos y mesa de dulces", scene="claro"),
 dict(id="comunion", name="Primera comunión", icon="✨", palette=["#FFFFFF","#E8D7A8","#B59BE0"], blurb="Elegante y con mucho cariño", scene="claro"),
 dict(id="graduacion", name="Graduación", icon="🎓", palette=["#1F3A93","#F4C95D","#FFFFFF"], blurb="Celebra el logro con estilo", scene="noche"),
 dict(id="aniversario", name="Aniversario", icon="💞", palette=["#C2467A","#F6A5C8","#F4C95D"], blurb="Un detalle que se recuerda", scene="pastel"),
 dict(id="romantica", name="Sorpresa romántica", icon="🌹", palette=["#C2123C","#F6A5C8","#FFFFFF"], blurb="Rosas, helio y mucha emoción", scene="noche"),
 dict(id="corporativo", name="Evento corporativo", icon="🏢", palette=["#2E5BFF","#7FD1C7","#FFFFFF"], blurb="Marca, globos y alquileres", scene="claro"),
 dict(id="temporada", name="Fiesta de temporada", icon="🎃", palette=["#F28C28","#6B3FA0","#1E1E1E"], blurb="Halloween, Navidad, San Valentín…", scene="noche"),
]
cats = [
 ("globos","Globos","🎈"),("backdrop","Backdrop","🖼️"),("mesa","Mesa de dulces","🍬"),("torta","Torta","🎂"),
 ("bocaditos","Bocaditos","🥟"),("carritos","Carritos","🛒"),("alquileres","Alquileres","🏕️"),
 ("recuerdos","Recuerdos","🎁"),("regalos","Regalos","🌹"),("extras","Extras","✨")]
ALL = [o["id"] for o in occasions]
def it(id,name,cat,line,pmin,pmax,occ,scene,photo="",desc="",**kw):
    d=dict(id=id,name=name,cat=cat,line=line,photo=photo,pmin=pmin,pmax=pmax,occasions=occ,scene=scene,desc=desc,active=True,rental=False,stock=0,unitGuests=0,gift=False)
    d.update(kw); return d
F="assets/fotos/"
items=[
 it("arco-organico","Arco orgánico de globos","globos","decoracion",85,160,ALL,"arch",F+"globos/arco-azul-blanco.jpg","Arco armado globo por globo en tus colores"),
 it("columnas-globos","Columnas de globos (par)","globos","decoracion",45,80,ALL,"columns",F+"globos/columna-helio-azul.jpg","Dos columnas con globo burbuja arriba"),
 it("ramillete-helio","Ramillete de globos con helio","globos","decoracion",25,55,ALL,"helium","","Globos que flotan en el techo de tu salón"),
 it("numero-gigante","Número gigante","globos","decoracion",30,60,["adulto","infantil","aniversario","graduacion"],"number","","12, 21, 30, 50… el número que celebras"),
 it("backdrop-nombre","Backdrop con nombre","backdrop","decoracion",90,180,ALL,"backdrop",F+"backdrops/limones-flores.jpg","Fondo temático con el nombre del festejado"),
 it("backdrop-vespa","Backdrop vespa / figura","backdrop","decoracion",120,220,["infantil","adulto","aniversario"],"backdrop",F+"backdrops/vespa-rosada.jpg","Figuras y temas: vespa, flores, limones…"),
 it("backdrop-negro-plata","Backdrop negro y plata","backdrop","decoracion",110,200,["adulto","graduacion","corporativo"],"backdrop",F+"backdrops/backdrop-12-negro-plata.jpg","Elegante, con globos y cilindros"),
 it("deco-room","Deco Room (cuarto)","backdrop","decoracion",70,140,["romantica","aniversario","infantil"],"neon","","Decoración de cuartos para sorpresas"),
 it("mesa-dulces","Mesa de dulces","mesa","cakes",70,140,ALL,"sweets","","Dulces, jarras y dispensadores en tu tema"),
 it("tartaletas","Tartaletas de frutas","mesa","cakes",18,32,ALL,"sweets","","Por cada 20 invitados",unitGuests=20),
 it("cupcakes","Cupcakes decorados","mesa","cakes",20,36,["infantil","babyshower","genero","bautizo","comunion"],"cupcakes","","Por cada 20 invitados",unitGuests=20),
 it("galletas","Galletas decoradas","mesa","cakes",15,30,["infantil","babyshower","genero","bautizo","comunion"],"cupcakes","","Por cada 20 invitados",unitGuests=20),
 it("torta-tematica","Torta temática","torta","cakes",35,90,ALL,"cake","","Diseño según tu tema y colores"),
 it("torta-2pisos","Torta de 2 pisos","torta","cakes",70,150,["bautizo","comunion","aniversario","babyshower","genero"],"cake2","","Para celebraciones grandes"),
 it("bocaditos-sal","Bocaditos de sal","bocaditos","cakes",25,45,ALL,"snacks","","Por cada 20 invitados",unitGuests=20),
 it("bocaditos-mixtos","Bandeja de bocaditos mixtos","bocaditos","cakes",35,60,ALL,"snacks","","Por cada 20 invitados",unitGuests=20),
 it("carrito-algodon","Carrito de algodón de azúcar","carritos","alquileres",40,70,["infantil","corporativo","babyshower","genero","comunion"],"cart",F+"carritos/carrito-algodon-carpa.jpg","Con operador. Se alquila por horas",rental=True,stock=1),
 it("carrito-canguil","Carrito de canguil","carritos","alquileres",35,60,["infantil","corporativo","graduacion","temporada"],"cart","","Canguil recién hecho en tu evento",rental=True,stock=1),
 it("carrito-snacks","Carrito de snacks","carritos","alquileres",40,75,["infantil","corporativo","graduacion"],"cart","","Snacks y bebidas con estilo",rental=True,stock=2),
 it("cilindros-bases","Cilindros y bases","alquileres","alquileres",20,45,ALL,"cylinders","","Para tortas, dulces y decoración",rental=True,stock=6),
 it("mesas-sillas","Mesas y sillas (set)","alquileres","alquileres",30,90,ALL,"tables","","Set para 20 invitados",rental=True,stock=4),
 it("carpa","Carpa / estructura","alquileres","alquileres",90,200,["infantil","corporativo","comunion","bautizo","graduacion"],"tent","","Carpa blanca con montaje",rental=True,stock=2),
 it("recuerdos-velas","Velas personalizadas","recuerdos","regalos",1.5,4,["bautizo","comunion","aniversario","babyshower","genero"],"favors","","Recuerdo por invitado (mín. 20)",gift=True),
 it("recuerdos-chocolates","Chocolates personalizados","recuerdos","regalos",1.2,3.5,["bautizo","comunion","aniversario","babyshower","infantil"],"favors","","Recuerdo por invitado (mín. 20)",gift=True),
 it("recuerdos-tazas","Tazas personalizadas","recuerdos","regalos",4,8,["aniversario","corporativo","bautizo","adulto"],"favors","","Con nombre, foto o logo",gift=True),
 it("ramo-rosas","Ramo de rosas grande con mensaje","regalos","regalos",35,95,["romantica","aniversario","adulto"],"bouquet",F+"ramos/ramo-rosas-rosado.jpg","Rosas con papel, cinta y mensaje",gift=True),
 it("ramo-corazon","Ramo corazón personalizado","regalos","regalos",60,120,["romantica","aniversario","adulto"],"bouquet",F+"ramos/ramo-corazon-mama.jpg","Corazón de rosas con foto o mensaje",gift=True),
 it("caja-padrinos","Caja «¿Aceptas ser mi padrino?»","regalos","regalos",25,55,["bautizo","comunion"],"padrinoBox",F+"padrinos/padrinos-caja-1.jpg","Taza, chocolates y frase personalizada",gift=True),
 it("pinata","Piñata temática","extras","decoracion",20,45,["infantil","babyshower","corporativo"],"pinata","","Con dulces o sorpresas"),
 it("neon-nombre","Letrero luminoso / letras","extras","decoracion",35,80,["adulto","aniversario","romantica","graduacion"],"neon","","Letras gigantes iluminadas"),
 it("espuma-confeti","Espuma, carioca y confeti","extras","temporada",8,20,["infantil","adulto","graduacion","temporada","corporativo"],"confetti",F+"temporada/espuma-carioca.jpg","Para la hora loca"),
 it("cotillon","Cotillón y gafas de fiesta","extras","temporada",10,25,ALL,"confetti",F+"temporada/lentes-iridiscentes.jpg","Gafas, sombreros y accesorios"),
]
sugg={
 "bautizo":["caja-padrinos","recuerdos-velas","mesa-dulces","bocaditos-sal"],
 "infantil":["carrito-algodon","pinata","numero-gigante","cupcakes"],
 "romantica":["ramo-rosas","ramillete-helio","deco-room","neon-nombre"],
 "adulto":["numero-gigante","neon-nombre","columnas-globos","espuma-confeti"],
 "babyshower":["mesa-dulces","cupcakes","recuerdos-chocolates","arco-organico"],
 "genero":["ramillete-helio","cupcakes","pinata","mesa-dulces"],
 "comunion":["recuerdos-velas","torta-2pisos","mesa-dulces","bocaditos-mixtos"],
 "graduacion":["numero-gigante","carrito-canguil","espuma-confeti","columnas-globos"],
 "aniversario":["ramo-corazon","deco-room","neon-nombre","torta-tematica"],
 "corporativo":["carrito-snacks","carpa","mesas-sillas","columnas-globos"],
 "temporada":["espuma-confeti","cotillon","carrito-canguil","pinata"],
}
G=lambda f,o,c:dict(photo=F+f,occasion=o,caption=c,visible=True)
gallery=[
 G("padrinos/padrinos-caja-1.jpg","bautizo","Caja para pedir padrinos de bautizo"),
 G("globos/arco-azul-blanco.jpg","infantil","Arco de globos azul, blanco y verde"),
 G("backdrops/limones-flores.jpg","infantil","Backdrop de limones y flores con nombre"),
 G("ramos/ramo-corazon-mama.jpg","aniversario","Ramo corazón con mensaje para mamá"),
 G("backdrops/backdrop-12-negro-plata.jpg","adulto","Backdrop negro y plata con número"),
 G("carritos/carrito-algodon-carpa.jpg","corporativo","Carritos blancos bajo carpa"),
 G("globos/columna-helio-azul.jpg","genero","Columna con globo burbuja"),
 G("backdrops/vespa-rosada.jpg","adulto","Vespa rosada para una fiesta temática"),
 G("ramos/ramo-rosas-rosado.jpg","romantica","Ramo de rosas con mariposas"),
]
season_products=[
 dict(name="Gafas de extraterrestre",price=3,photo=F+"temporada/lentes-iridiscentes.jpg"),
 dict(name="Máscaras de terror",price=4.5,photo=F+"temporada/mascaras-halloween.jpg"),
 dict(name="Accesorios Halloween",price=1.5,photo=F+"temporada/accesorios-halloween.jpg"),
 dict(name="Maquillaje y labiales",price=2.5,photo=F+"temporada/lipstick-maquillaje.jpg"),
 dict(name="Ojos y telarañas",price=1.5,photo=F+"temporada/ojos-halloween.jpg"),
 dict(name="Espuma carioca",price=3.5,photo=F+"temporada/espuma-carioca.jpg"),
]
content=dict(
 sections=dict(hero=True,lines=True,builder=True,gallery=True,gifts=True,season=True,how=True,testimonials=True,location=True),
 hero=dict(eyebrow="Ambato · Importadores de artículos para fiestas",title="Tu fiesta completa, sin mil vueltas",
   subtitle="Globos, backdrops, tortas, bocaditos, alquileres y regalos personalizados. Arma tu fiesta aquí y recibe tu cotización en minutos.",
   cta1="Arma tu fiesta",cta2="Escríbenos por WhatsApp",hint="Toca los globos 🎈"),
 lines=[
  dict(id="decoracion",title="Decoración",tagline="Arcos, columnas, backdrops y globos con helio",cat="globos",photos=[F+"globos/arco-azul-blanco.jpg",F+"backdrops/limones-flores.jpg",F+"backdrops/vespa-rosada.jpg"],points=["Arcos y columnas de globos","Backdrops con nombre y figuras","Deco Room para sorpresas"],emoji="🎈"),
  dict(id="alquileres",title="Alquileres",tagline="Carritos, mesas, bases y estructuras",cat="alquileres",photos=[F+"carritos/carrito-algodon-carpa.jpg",F+"backdrops/backdrop-12-negro-plata.jpg"],points=["Carritos de algodón, canguil y snacks","Cilindros y bases","Mesas, carpas y estructuras"],emoji="🛒"),
  dict(id="cakes",title="Cakes y bocaditos",tagline="Tortas, cupcakes, tartaletas y bocaditos de sal",cat="torta",photos=[],points=["Tortas temáticas","Cupcakes y galletas decoradas","Bocaditos de sal y tartaletas"],emoji="🎂"),
  dict(id="regalos",title="Regalos y obsequios",tagline="Ramos, cajas para padrinos y recuerdos personalizados",cat="regalos",photos=[F+"ramos/ramo-corazon-mama.jpg",F+"padrinos/padrinos-caja-1.jpg",F+"ramos/ramo-rosas-rosado.jpg"],points=["Ramos de rosas con mensaje","Cajas «¿Aceptas ser mi padrino?»","Velas, chocolates y tazas"],emoji="🌹"),
  dict(id="temporada",title="Tienda de temporada",tagline="Halloween, Finados, espuma, gafas y cotillón",cat="season",photos=[F+"temporada/mascaras-halloween.jpg",F+"temporada/lentes-iridiscentes.jpg",F+"temporada/lipstick-maquillaje.jpg"],points=["Máscaras, maquillaje y accesorios","Velas y recuerdos para Finados","Espuma carioca y cotillón"],emoji="🎃"),
 ],
 gallery=gallery,
 giftsIntro=dict(title="Regalos que sí se recuerdan",subtitle="Ramos grandes, cajas para padrinos y obsequios personalizados. Pídelos directo por WhatsApp."),
 season=dict(active=True,title="Temporada Halloween y Finados",subtitle="Máscaras, maquillaje, accesorios y recuerdos. Llévalos hoy en el local.",startDaysAgo=12,endDaysFromNow=14,cta="Pedir por WhatsApp",products=season_products),
 how=[
  dict(n=1,title="Arma tu fiesta",text="Elige ocasión, colores y todo lo que quieras sumar. Ves tu fiesta armándose en pantalla."),
  dict(n=2,title="Te enviamos la cotización",text="Recibes un rango de precio al instante y la cotización formal por WhatsApp."),
  dict(n=3,title="Reservas con un anticipo",text="Aseguras tu fecha con un anticipo. El saldo se paga antes o el día del evento [confirmar]."),
  dict(n=4,title="Llegamos, montamos y desmontamos",text="Nosotros instalamos todo y luego lo retiramos. Tú solo disfrutas [confirmar]."),
 ],
 testimonials=[
  dict(name="Nombre del cliente",occasion="Cumpleaños infantil",text="Aquí irá una reseña real de un cliente de Valnu. (Texto de ejemplo)",demo=True),
  dict(name="Nombre del cliente",occasion="Bautizo",text="Aquí irá una reseña real de un cliente de Valnu. (Texto de ejemplo)",demo=True),
  dict(name="Nombre del cliente",occasion="Sorpresa romántica",text="Aquí irá una reseña real de un cliente de Valnu. (Texto de ejemplo)",demo=True),
 ],
 location=dict(title="Visítanos en Ambato",subtitle="Pasa por el local, mira los productos y cotiza en persona.",mapQuery="Ambato, Ecuador"),
 finalCta=dict(title="¿Lista tu fiesta?",text="Cuéntanos qué celebras y nosotros nos encargamos del resto.",cta="Arma tu fiesta"),
)
settings=dict(
 businessName="Valnu en su Fiesta",whatsapp="593987522450",whatsappDisplay="098 752 2450",whatsappConfirm=True,
 address="Ambato, Ecuador (dirección exacta por confirmar)",instagram="valnuensufiesta",
 hours=["Lunes a viernes: 09:00 – 19:00","Sábado: 09:00 – 18:00","Domingo: 10:00 – 14:00"],
 coverage=dict(localCity="Ambato",otherFeeMin=10,otherFeeMax=35,otherCities=["Latacunga","Riobamba","Baños","Pelileo","Píllaro"]),
 depositPct=50,
 policies=dict(montaje="Llegamos 2 horas antes del evento para el montaje.",desmontaje="El desmontaje se coordina al finalizar el evento.",cancelacion="El anticipo no es reembolsable; se puede reprogramar con 7 días de aviso. [confirmar]"),
 quoteValidityDays=7,
)

# ---------- 3 meses de cotizaciones mock ----------
names=["María Fernanda","Carlos","Daniela","Andrés","Paola","Jorge","Gabriela","Luis","Verónica","Santiago","Cristina","Esteban","Karla","Mateo","Lorena","Diego","Fernanda","Pablo","Alejandra","Ricardo","Sofía","Byron","Mónica","Xavier"]
last=["Salazar","Vera","Morales","Cevallos","Naranjo","Pérez","Villacís","Haro","Toapanta","Mera","Chiliquinga","Freire"]
occ_w=dict(infantil=30,adulto=12,babyshower=9,genero=6,bautizo=11,comunion=7,graduacion=5,aniversario=5,romantica=8,corporativo=4,temporada=3)
byocc={o:[i for i in items if o in i["occasions"] and i["cat"]!="extras"] for o in ALL}
quotes=[]
def mk(qid,days_ago,hours_ago,status,ev_days,occ=None,force_items=None,lost=None,dep=None,source=None,final=True):
    o=occ or random.choices(list(occ_w),weights=list(occ_w.values()))[0]
    pool=byocc[o]
    n=random.choice([2,3,3,4,5,6])
    chosen=force_items or [i["id"] for i in random.sample(pool,min(n,len(pool)))]
    guests=random.choice([15,20,25,30,40,50,60,80,100])
    lines=[]
    mn=mx=0
    for iid in chosen:
        it_=next(i for i in items if i["id"]==iid)
        qty=-(-guests//it_["unitGuests"]) if it_["unitGuests"] else 1
        lines.append(dict(itemId=iid,name=it_["name"],qty=qty,pmin=it_["pmin"],pmax=it_["pmax"]))
        mn+=it_["pmin"]*qty; mx+=it_["pmax"]*qty
    pal=next(x for x in occasions if x["id"]==o)["palette"]
    q=dict(id=qid,daysAgo=days_ago,hoursAgo=hours_ago,status=status,lostReason=lost,
      contact=dict(name=random.choice(names)+" "+random.choice(last),whatsapp="09"+str(random.randint(80000000,99999999))),
      occasion=o,eventInDays=ev_days,guests=guests,place=random.choice(["ambato","ambato","ambato","otra","retiro"]),city="",colors=pal,
      honoree=random.choice(["Valentina","Mateo","Emilia","Sebastián","Camila","Mami","Doña Rosa","","Gianna","Thiago"]),
      items=lines,rangeMin=round(mn),rangeMax=round(mx),source=source or random.choice(["armador","armador","armador","galeria","whatsapp"]),
      finalTotal=None,deposit=0,notes="")
    if q["place"]=="otra": q["city"]=random.choice(["Latacunga","Riobamba","Baños"])
    if status in("quoted","deposit","done") and final:
        ft=0
        for l in lines:
            l["final"]=round(l["pmin"]+(l["pmax"]-l["pmin"])*random.uniform(0.25,0.8))
            ft+=l["final"]*l["qty"]
        q["finalTotal"]=round(ft)
    if status in("deposit","done"):
        q["deposit"]=round((q["finalTotal"] or 0)*random.choice([0.5,0.5,0.3]))
        if status=="done": q["deposit"]=q["finalTotal"] if random.random()<.7 else q["deposit"]
    quotes.append(q); return q
qid=100
# historico: 90 dias, ~1.3/dia en fines de semana mas alto
for d in range(89,-1,-1):
    wd=(d)%7
    n=random.choices([0,1,2,3],weights=[2,5,4,1] if wd not in(0,6) else [1,3,4,2])[0]
    for _ in range(n):
        qid+=1
        r=random.random()
        if d>18:
            st="done" if r<.34 else ("lost" if r<.78 else "deposit")
            if st=="deposit": st="done"
            ev=-(d-random.randint(5,20))
            if ev>-1: ev=-random.randint(1,4)
        elif d>6:
            st="done" if r<.18 else ("deposit" if r<.42 else ("quoted" if r<.62 else ("lost" if r<.82 else "quoted")))
            ev=random.randint(-d+3,16) if st!="done" else -random.randint(1,d-1 if d>2 else 1)
            if st in("deposit","quoted","new") and ev<1: ev=random.randint(2,18)
        else:
            st=random.choices(["new","quoted","deposit"],weights=[4,3,2])[0]; ev=random.randint(3,24)
            if st=="new" and d>1: st="quoted"
        lost=random.choice(["Precio","Eligió otra empresa","Cambió la fecha","No respondió","Fecha ocupada"]) if st=="lost" else None
        mk(qid,d,random.randint(0,23),st,ev,lost=lost)
# casos clave para las alertas y la demostracion
qid+=1; mk(qid,0,5,"new",12)["contact"]["name"]="Camila Rodríguez"      # sin responder > 2h
qid+=1; mk(qid,0,3,"new",20,occ="infantil",force_items=["arco-organico","carrito-algodon","pinata"])
qid+=1; q=mk(qid,2,0,"quoted",1,occ="infantil"); q["contact"]["name"]="Patricia Yánez"     # evento mañana sin anticipo
# alquileres ocupados: carrito algodon (stock 1) el dia +6 y +3 ; cruce de canguil dia +9
qid+=1; mk(qid,6,2,"deposit",6,occ="infantil",force_items=["carrito-algodon","arco-organico","mesa-dulces","torta-tematica"])
qid+=1; mk(qid,5,2,"deposit",3,occ="corporativo",force_items=["carrito-snacks","carpa","mesas-sillas","columnas-globos"])
qid+=1; mk(qid,9,2,"deposit",9,occ="graduacion",force_items=["carrito-canguil","numero-gigante","espuma-confeti"])
qid+=1; mk(qid,4,2,"deposit",9,occ="temporada",force_items=["carrito-canguil","pinata","cotillon"])   # cruce
qid+=1; mk(qid,7,1,"deposit",4,occ="bautizo",force_items=["caja-padrinos","recuerdos-velas","mesa-dulces","carpa"])
# ids unicos y cuatro dígitos
for i,q in enumerate(quotes): q["id"]=100+i+1

# ---------- embudo diario mock (visit, opened, added3) ----------
daily=[]
qpd={}
for q in quotes: qpd[q["daysAgo"]]=qpd.get(q["daysAgo"],0)+1
for d in range(89,-1,-1):
    qn=qpd.get(d,0)
    a3=max(qn,round(qn*2.4+random.uniform(0,2)))
    op=round(a3*random.uniform(1.8,2.4))+random.randint(0,3)
    vi=round(op*random.uniform(3.1,3.8))+random.randint(5,15)
    sh=round(op*0.7); ac=round(sh*random.uniform(0.22,0.34))
    daily.append(dict(daysAgo=d,visit=vi,opened=op,added3=a3,suggShown=sh,suggAccepted=ac))

seed=dict(version=4,settings=settings,occasions=occasions,categories=[dict(id=a,name=b,icon=c) for a,b,c in cats],
  items=items,suggestions=sugg,content=content,quotes=quotes,funnelDaily=daily)
with open(os.path.join(R,"data","seed.json"),"w",encoding="utf-8") as f: json.dump(seed,f,ensure_ascii=False,indent=1)
print("quotes",len(quotes),"items",len(items))
