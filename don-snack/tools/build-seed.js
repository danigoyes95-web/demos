// Genera data/seed.json (catálogo, ajustes, clientes ficticios). Ejecutar: node tools/build-seed.js
const fs = require('fs');
let s = 7; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

const categories = [
 {id:'cerveza',name:'Cervezas',door:'previa',emoji:'🍺'},{id:'latas',name:'Latas listas',door:'previa',emoji:'🥫'},
 {id:'ron',name:'Ron',door:'previa',emoji:'🥃'},{id:'whisky',name:'Whisky',door:'previa',emoji:'🥃'},
 {id:'vodka',name:'Vodka',door:'previa',emoji:'🍸'},{id:'tequila',name:'Tequila y aguardiente',door:'previa',emoji:'🌵'},
 {id:'granizados',name:'Granizados',door:'previa',emoji:'🧊'},{id:'snacks',name:'Snacks',door:'previa',emoji:'🍿'},
 {id:'hielo',name:'Hielo y mixers',door:'previa',emoji:'🧊'},{id:'desechables',name:'Desechables',door:'previa',emoji:'🥤'},
 {id:'calientes',name:'Hot drinks',door:'previa',emoji:'☕'},{id:'cigarrillos',name:'Cigarrillos',door:'previa',emoji:'🚬',flag:'venderCigarrillos'},
 {id:'vinos',name:'Vinos',door:'cava',emoji:'🍷'},{id:'espumantes',name:'Espumantes',door:'cava',emoji:'🍾'},
 {id:'cremas',name:'Cremas',door:'cava',emoji:'🥛'},{id:'premium',name:'Licores premium y artesanales',door:'cava',emoji:'🥂'},
 {id:'cerveza-premium',name:'Cervezas premium',door:'cava',emoji:'🍻'},{id:'detalles',name:'Copas y detalles',door:'cava',emoji:'🎁'}
];
// [id,nombre,cat,puerta,tamaño,precio,stock,extras]
const P = [
 ['pilsener-six','Pilsener six pack','cerveza','previa','6 × 355 ml',8.9,60,{best:1}],
 ['club-six','Club Verde six pack','cerveza','previa','6 × 355 ml',9.2,44,{best:1}],
 ['corona-six','Corona six pack','cerveza','previa','6 × 355 ml',12.5,30],
 ['heineken-six','Heineken six pack','cerveza','previa','6 × 355 ml',13.9,26],
 ['pilsener-600','Pilsener botella','cerveza','previa','600 ml',1.6,200,{best:1}],
 ['pilsener-caja','Pilsener caja','cerveza','previa','12 × 600 ml',21,12],
 ['supercholo','Super Cholo Passion Mix','latas','previa','500 ml · 8%',3.25,80,{best:1,pick:1}],
 ['supercholo-4','Super Cholo pack','latas','previa','4 × 500 ml',12,24],
 ['krasnaya-lemon','Krasnaya Lemon Ice','latas','previa','275 ml',2.8,50],
 ['spritz-lata','Spritz listo','latas','previa','355 ml',3.5,36],
 ['gintonic-lata','Gin & Tonic listo','latas','previa','355 ml',3.9,30],
 ['ron-san-miguel','Ron San Miguel','ron','previa','750 ml',8.5,30],
 ['ron-abuelo','Ron Abuelo Añejo','ron','previa','750 ml',14.5,36,{best:1}],
 ['ron-havana','Ron Havana Club 7','ron','previa','750 ml',19.9,20,{best:1}],
 ['ron-botran','Ron Botran Reserva','ron','previa','750 ml',24.9,14],
 ['johnnie-red','Johnnie Walker Red','whisky','previa','750 ml',24.9,22,{best:1}],
 ['black-pocket','Black Label pocket','whisky','previa','200 ml',12,18,{best:1}],
 ['jack-daniels','Jack Daniel\'s','whisky','previa','750 ml',29.9,16],
 ['black-label','Johnnie Walker Black','whisky','previa','750 ml',38.5,10],
 ['smirnoff','Smirnoff Red','vodka','previa','750 ml',14.9,30],
 ['skyy','Skyy Vodka','vodka','previa','750 ml',17.9,24,{best:1}],
 ['skyy-citrus','Skyy Citrus','vodka','previa','750 ml',19.5,12],
 ['absolut','Absolut Blue','vodka','previa','750 ml',24,10],
 ['krasnaya','Krasnaya Vodka','vodka','previa','750 ml',10.5,20],
 ['zhumir','Aguardiente Zhumir','tequila','previa','750 ml',7.5,60,{best:1}],
 ['puntas','Puntas','tequila','previa','750 ml',6.9,40],
 ['olmeca','Tequila Olmeca Blanco','tequila','previa','750 ml',20,16],
 ['cuervo','Tequila Jose Cuervo','tequila','previa','750 ml',22.5,14],
 ['gran-malo','Gran Malo mezcal con chile','tequila','previa','700 ml',29,9,{pick:1}],
 ['enterrado','Enterrado (granizado)','granizados','previa','vaso 500 ml',4.5,40,{best:1}],
 ['slush-mojito','Granizado de mojito','granizados','previa','vaso 500 ml',4,40],
 ['slush-pina','Granizado piña colada','granizados','previa','vaso 500 ml',4.5,40],
 ['papas','Papas fritas','snacks','previa','familiar',1.5,90,{best:1}],
 ['nachos','Nachos con queso','snacks','previa','150 g',1.8,60],
 ['chifles','Chifles','snacks','previa','bolsa',1.2,70],
 ['mani','Maní salado','snacks','previa','bolsa',1,80],
 ['mix-frutos','Mix de frutos secos','snacks','previa','200 g',3.5,30],
 ['tabla','Tabla picada pequeña','snacks','previa','2 personas',9.9,10],
 ['hielo-2','Hielo','hielo','previa','bolsa 2 kg',2,100,{best:1,ice:1}],
 ['hielo-5','Hielo','hielo','previa','bolsa 5 kg',4,60,{ice:1}],
 ['cola-2l','Coca-Cola','hielo','previa','2 L',2.5,120,{best:1,mixer:1}],
 ['sprite-2l','Sprite','hielo','previa','2 L',2.5,80,{mixer:1}],
 ['tonica','Agua tónica','hielo','previa','400 ml',1.5,70,{mixer:1}],
 ['ginger','Ginger ale','hielo','previa','400 ml',1.5,50,{mixer:1}],
 ['limones','Limones','hielo','previa','bolsa',1.5,50],
 ['redbull','Energizante','hielo','previa','250 ml',2.5,60,{mixer:1}],
 ['vasos-50','Vasos desechables','desechables','previa','paquete × 50',2,80],
 ['platos','Platos desechables','desechables','previa','paquete × 25',1.8,40],
 ['servilletas','Servilletas','desechables','previa','paquete',0.9,60],
 ['canelazo','Canelazo con aguardiente','calientes','previa','termo 1 L',9.5,12],
 ['vino-caliente','Vino caliente','calientes','previa','termo 1 L',11,10],
 ['cafe-irlandes','Café irlandés','calientes','previa','taza',5,20],
 ['cig-1','Cigarrillos cajetilla','cigarrillos','previa','20 unid.',4.5,40],
 ['cig-2','Cigarrillos cajetilla suave','cigarrillos','previa','20 unid.',3.2,40],
 // CAVA
 ['malbec-trapiche','Trapiche Malbec','vinos','cava','750 ml',14.5,24,{best:1,type:'tinto',grape:'Malbec',country:'Argentina',note:'Malbec intenso, ideal para carnes'}],
 ['malbec-alamos','Alamos Malbec','vinos','cava','750 ml',16.9,20,{pick:1,type:'tinto',grape:'Malbec',country:'Argentina',note:'Frutos negros y vainilla; un clásico seguro'}],
 ['malbec-catena','Catena Malbec','vinos','cava','750 ml',28.5,12,{pick:1,type:'tinto',grape:'Malbec',country:'Argentina',note:'Redondo y elegante, para lucirte en la cena'}],
 ['malbec-bosca','Luigi Bosca Malbec','vinos','cava','750 ml',42,8,{type:'tinto',grape:'Malbec',country:'Argentina',note:'Reserva de cuerpo largo, muy buen regalo'}],
 ['cab-concha','Concha y Toro Cabernet','vinos','cava','750 ml',12.5,24,{type:'tinto',grape:'Cabernet Sauvignon',country:'Chile',note:'Estructurado y directo, ideal con pastas'}],
 ['carmenere','Santa Rita Carménère','vinos','cava','750 ml',15,16,{type:'tinto',grape:'Carménère',country:'Chile',note:'Suave, con toque especiado'}],
 ['merlot','Casillero Merlot','vinos','cava','750 ml',13.5,18,{type:'tinto',grape:'Merlot',country:'Chile',note:'Aterciopelado, fácil de tomar'}],
 ['tempranillo','Rioja Crianza','vinos','cava','750 ml',24,10,{type:'tinto',grape:'Tempranillo',country:'España',note:'Madera y fruta madura; perfecto con carnes asadas'}],
 ['pinot-noir','Pinot Noir','vinos','cava','750 ml',19,10,{type:'tinto',grape:'Pinot Noir',country:'Chile',note:'Ligero y frutal, sorprende en una cena'}],
 ['reserva-cab','Cabernet Gran Reserva','vinos','cava','750 ml',68,6,{pick:1,type:'tinto',grape:'Cabernet Sauvignon',country:'Chile',note:'Para ocasiones grandes: profundo y largo'}],
 ['amarone','Amarone della Valpolicella','vinos','cava','750 ml',89,4,{type:'tinto',grape:'Corvina',country:'Italia',note:'Un vino de colección para regalar'}],
 ['bn-white','Blue Nun Authentic White','vinos','cava','750 ml',10.9,20,{type:'blanco',grape:'Blend blanco',country:'Alemania',note:'Dulzón y fresco, para tomar sin pensar'}],
 ['sauv-blanc','Cono Sur Sauvignon Blanc','vinos','cava','750 ml',12.9,16,{pick:1,type:'blanco',grape:'Sauvignon Blanc',country:'Chile',note:'Cítrico y fresco, ideal con mariscos'}],
 ['chardonnay','Trapiche Chardonnay','vinos','cava','750 ml',14,14,{type:'blanco',grape:'Chardonnay',country:'Argentina',note:'Cremoso, va bien con pollo y quesos'}],
 ['mateus','Mateus Rosé','vinos','cava','750 ml',11.5,16,{type:'blanco',grape:'Rosado',country:'Portugal',note:'Rosado ligero para una tarde'}],
 ['moscato','Moscato dulce','vinos','cava','750 ml',13,14,{type:'blanco',grape:'Moscato',country:'Italia',note:'Dulce y suave, para postre'}],
 ['bn-24k','Blue Nun 24K Gold','espumantes','cava','750 ml',19.9,14,{pick:1,note:'Espumoso con hojuelas de oro; luce en la mesa'}],
 ['prosecco','Prosecco Riondo','espumantes','cava','750 ml',16.5,18,{note:'Burbuja fina y fresca para brindar'}],
 ['chandon','Chandon Brut','espumantes','cava','750 ml',24.5,12,{best:1,pick:1,note:'El brindis clásico, siempre acertado'}],
 ['cordon-negro','Freixenet Cordon Negro','espumantes','cava','750 ml',22,10,{note:'Seco y elegante, ideal para celebrar'}],
 ['lambrusco','Lambrusco dulce','espumantes','cava','750 ml',9.5,14,{note:'Dulce y burbujeante, divertido para compartir'}],
 ['moet','Moët & Chandon Impérial','espumantes','cava','750 ml',78,5,{note:'Celebración grande, regalo que se recuerda'}],
 ['baileys','Baileys','cremas','cava','750 ml',24,14,{note:'Cremoso, perfecto con postre o café'}],
 ['amarula','Amarula','cremas','cava','750 ml',22.5,10,{note:'Crema de marula con notas de caramelo'}],
 ['crema-cafe','Crema de café','cremas','cava','700 ml',18,10,{note:'Para el postre o sobre hielo'}],
 ['gin-ceibo','Gin Ceibo artesanal','premium','cava','700 ml',34,10,{pick:1,note:'Gin ecuatoriano de destilería artesanal'}],
 ['ron-ceibo','Ron Ceibo añejo','premium','cava','700 ml',38,8,{pick:1,note:'Ron artesanal, suave y aromático'}],
 ['puro','Pu-ro Guaranda 100% caña','premium','cava','750 ml',21.9,12,{pick:1,note:'Fav del mes: aguardiente de la sierra, 100% caña'}],
 ['licor-43','Licor 43','premium','cava','700 ml',32,8,{note:'Dulce y vainillado, para después de cenar'}],
 ['hennessy','Hennessy VS','premium','cava','700 ml',62,6,{note:'Cognac clásico para regalar'}],
 ['glenfiddich','Glenfiddich 12','premium','cava','750 ml',72,6,{note:'Single malt suave, regalo seguro'}],
 ['don-julio','Don Julio Reposado','premium','cava','750 ml',69,5,{note:'Tequila premium, se toma solo'}],
 ['chivas-18','Chivas Regal 18','premium','cava','750 ml',98,4,{note:'Whisky de lujo para una fecha especial'}],
 ['ceibo-estuche','Estuche Ceibo (nuevo)','premium','cava','estuche',55,6,{pick:1,note:'New collection, in stock: gin y vasos en estuche'}],
 ['sanchez-sour','Sánchez Bier Sour Dreams','cerveza-premium','ambas','330 ml',3.9,40,{note:'Sour de frutos rojos'}],
 ['sanchez-ipa','Sánchez Bier Indian Pale Ale','cerveza-premium','ambas','330 ml',3.5,40,{note:'Amarga y aromática'}],
 ['sanchez-stout','Sánchez Bier Oatmeal Stout','cerveza-premium','ambas','330 ml',3.5,30,{note:'Tostada y cremosa'}],
 ['belhaven','Belhaven Black Scottish Stout','cerveza-premium','ambas','440 ml',4.2,24,{note:'Stout escocesa de lata'}],
 ['artesanal-6','Pack artesanal mixto','cerveza-premium','ambas','6 × 330 ml',24,12,{best:1,note:'Seis estilos para probar'}],
 ['copas-2','Set 2 copas de vino','detalles','cava','2 unid.',14,16,{note:'Cristal fino para acompañar tu vino'}],
 ['vasos-cerv','Vasos cerveceros','detalles','cava','2 unid.',12.5,14,{note:'Para tu cerveza artesanal'}],
 ['chocolates','Chocolates finos','detalles','cava','caja',8,20,{note:'El detalle ideal con un vino'}]
];
const products = P.map(([id,name,cat,door,size,price,stock,x={}]) => ({
  id,name,cat,door,size,price,stock,active:true,best:!!x.best,pick:!!x.pick,note:x.note||'',type:x.type||'',grape:x.grape||'',country:x.country||'',ice:!!x.ice,mixer:!!x.mixer,
  occ: door==='previa'?[]: cat==='espumantes'?(price<25?['celebracion','regalo','cena']:['celebracion','regalo']): price<15?['yo','cena']: price<30?['cena','regalo','yo']:['regalo','celebracion','cena'],
  sales: Math.round(5 + rnd()*60 + (x.best?80:0))
}));
const combos = [
 {id:'previa-4',name:'Previa para 4',door:'previa',desc:'Ron, 2 colas, hielo, papas y vasos',items:[['ron-abuelo',1],['cola-2l',2],['hielo-2',1],['papas',1],['vasos-50',1]],price:22.9},
 {id:'noche-ron',name:'Noche de ron',door:'previa',desc:'Havana 7, 2 colas, hielo 5 kg y limones',items:[['ron-havana',1],['cola-2l',2],['hielo-5',1],['limones',1]],price:28.9},
 {id:'six-snacks',name:'Six pack + snacks',door:'previa',desc:'Pilsener six, papas, chifles y maní',items:[['pilsener-six',1],['papas',1],['chifles',1],['mani',1]],price:11.9},
 {id:'kit-hielo',name:'Kit hielo y mixers',door:'previa',desc:'Hielo 5 kg, cola, sprite, tónica y limones',items:[['hielo-5',1],['cola-2l',1],['sprite-2l',1],['tonica',1],['limones',1]],price:10.9},
 {id:'wc-malbec',name:'Wine Combo Malbec',door:'cava',desc:'2 Trapiche Malbec + chocolates finos',items:[['malbec-trapiche',2],['chocolates',1]],price:32.9,wine:true},
 {id:'wc-bluenun',name:'2 Pack Blue Nun',door:'cava',desc:'Authentic White + 24K Gold, 25 % menos',items:[['bn-white',1],['bn-24k',1]],price:23.1,wine:true},
 {id:'wc-ceibo',name:'Regalo Ceibo',door:'cava',desc:'Gin Ceibo + set de vasos',items:[['gin-ceibo',1],['vasos-cerv',1]],price:42.9,wine:true}
].map(c=>({...c,active:true,items:c.items.map(([id,qty])=>({id,qty}))}));
const campaigns = [
 {id:'c-malbec',title:'Mes del Malbec',sub:'10 % en Malbec seleccionados',skin:'elegante',startOff:-12,endOff:18,discount:10,productIds:P.filter(p=>p[7]&&p[7].grape==='Malbec').map(p=>p[0]),cats:[],enabled:true,img:'assets/campanas/mes-malbec.jpg'},
 {id:'c-horario',title:'Horario extendido hasta la 1 a. m.',sub:'Hoy pedimos hasta tarde, Ambato',skin:'pop',startOff:-3,endOff:10,discount:0,productIds:['supercholo','enterrado','papas'],cats:[],enabled:true,img:'assets/campanas/horario-extendido.jpg'},
 {id:'c-12nov',title:'¡Feliz 12 de Noviembre, Ambato querido!',sub:'Que nunca falte la sed de libertad',skin:'pop',startOff:-9,endOff:-6,discount:0,productIds:[],cats:[],enabled:true,img:'assets/campanas/12-noviembre.jpg'},
 {id:'c-luz',title:'¿Cortes de luz? No te preocupes',sub:'Abiertos durante los cortes de luz',skin:'pop',startOff:-40,endOff:-30,discount:0,productIds:['hielo-5'],cats:[],enabled:false,img:'assets/campanas/cortes-luz.jpg'},
 {id:'c-navidad',title:'Navidad en Don Snack',sub:'Espumantes y regalos para brindar',skin:'elegante',startOff:12,endOff:36,discount:15,productIds:[],cats:['espumantes'],enabled:true,img:'assets/campanas/navidad.jpg'},
 {id:'c-valentin',title:'San Valentín',sub:'Un buen vino para dos',skin:'elegante',startOff:80,endOff:87,discount:10,productIds:[],cats:['vinos'],enabled:true,img:'assets/campanas/san-valentin.jpg'},
 {id:'c-madre',title:'Brinda por Mamá',sub:'Hasta 25 % en vinos, cremas y espumantes',skin:'elegante',startOff:165,endOff:172,discount:25,productIds:[],cats:['vinos','cremas','espumantes'],enabled:true,img:'assets/campanas/dia-madre.jpg'}
];
const settings = {
 name:'Don Snack Ambato',tagline:'Wine, Beer & Spirits',address:'Av. Los Guaytambos y Pomelos, Ambato, Ecuador',instagram:'@donsnackambato',
 whatsapp:'593990000000', // [completar] número real
 hours:{0:['12:00','22:00'],1:['10:00','23:00'],2:['10:00','23:00'],3:['10:00','23:00'],4:['16:00','01:00'],5:['10:00','02:00'],6:['10:00','02:00']},
 specialHours:[], closed:false, demoSkipHours:false,
 minOrder:5, store:{lat:-1.2412,lng:-78.6275},
 zones:[
  {id:'centro',name:'Centro',fee:3,eta:25,lat:-1.2412,lng:-78.6275,r:1.6},{id:'ficoa',name:'Ficoa',fee:3,eta:30,lat:-1.2160,lng:-78.6350,r:1.8},
  {id:'atocha',name:'Atocha',fee:3,eta:30,lat:-1.2285,lng:-78.6180,r:1.6},{id:'huachi',name:'Huachi',fee:3,eta:35,lat:-1.2700,lng:-78.6300,r:2},
  {id:'miraflores',name:'Miraflores',fee:2.5,eta:25,lat:-1.2350,lng:-78.6400,r:1.4},{id:'celiano',name:'Celiano Monge',fee:3.5,eta:35,lat:-1.2500,lng:-78.6100,r:1.8}],
 payments:{efectivo:true,transferencia:true,payphone:true},giftWrap:2.5,
 taxi:[{name:'Taxi seguro Ambato',phone:'593990000001'},{name:'Cooperativa de confianza',phone:'593990000002'}],
 flags:{venderCigarrillos:true},autoWhatsApp:true,
 tiers:{vip:60,leyenda:150},
 tierBenefits:{socio:['Pedido en 2 toques','Promos exclusivas','Acceso anticipado a campañas'],vip:['Envío gratis','Hielo gratis','Prioridad en la cola'],leyenda:['Precio especial en selección premium','Regalo de cumpleaños','Invitación a catas y lanzamientos','Línea directa de WhatsApp']},
 advisor:{cena:['tinto','blanco'],regalo:['premium','tinto','espumante'],celebracion:['espumante','premium'],yo:['tinto','premium','blanco']},
 giftMessages:['¡Feliz cumpleaños! 🎉','Gracias por todo 💛','¡Felicidades!','Con cariño','Brindemos juntos 🥂']
};
const first=['Carlos','Valeria','Mateo','Camila','Andrés','Daniela','Sebastián','Paola','Diego','Lucía','Jorge','Karla','Esteban','Gabriela','Kevin','Mónica','Fernando','Andrea','Santiago','Nicole','Bryan','Doménica','Alex','Fernanda','Pablo','Mishel','Joel','Estefanía','David','Samantha','Cristian','Verónica','Mauricio','Ariana','Ricardo','Tatiana'];
const last=['Mendoza','Salazar','Naranjo','Vega','Proaño','Sánchez','Miranda','Cando','Freire','Lara','Ortiz','Báez','Moreta','Yánez','Paredes','Cevallos','Albán','Medina','Tapia','Villacís','Acosta','Guevara','Barrera','Pazmiño','Lascano'];
const customers=[]; const used=new Set(); const codeChars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const mk=(i,over={})=>{let name;do{name=pick(first)+' '+pick(last);}while(used.has(name)&&i>1); used.add(name);
 const z=pick(settings.zones);
 return {id:'u'+String(i).padStart(3,'0'),name,phone:'0990000'+String(100+i).slice(-3),zone:z.id,
  address:{text:pick(['Av. Cevallos','Calle Bolívar','Av. Los Shyris','Calle Sucre','Av. Atahualpa','Calle Montalvo','Av. Pichincha','Calle Rocafuerte'])+' y '+pick(['Mera','Martínez','Quito','Guayaquil','Lalama','Castillo'])+', '+z.name,lat:+(z.lat+(rnd()-.5)*.01).toFixed(5),lng:+(z.lng+(rnd()-.5)*.01).toFixed(5),ref:pick(['Casa blanca','Portón negro','Junto a la tienda','Edificio azul','Departamento 3B'])},
  type:pick(['previa','previa','previa','cava','ambos']),member:false,code:'',consentData:false,consentPromo:false,birthday:'',notes:'',createdAgo:Math.floor(rnd()*95),...over};};
customers.push(mk(1,{name:'Carlos Mendoza',phone:'0990000101',zone:'centro',type:'previa',member:true,code:'DS-0001',consentData:true,consentPromo:true,birthday:'1994-12-03',notes:'Siempre pide hielo extra. Entregar en portería.',createdAgo:88,address:{text:'Av. Cevallos y Mera, Centro',lat:-1.24132,lng:-78.62741,ref:'Edificio azul, portería'}}));
customers.push(mk(2,{name:'Valeria Proaño',phone:'0990000102',zone:'ficoa',type:'cava',member:true,code:'DS-0002',consentData:true,consentPromo:true,birthday:'1990-05-09',createdAgo:80}));
customers.push(mk(3,{name:'Mateo Salazar',phone:'0990000103',zone:'atocha',type:'ambos',member:true,code:'DS-0003',consentData:true,consentPromo:true,birthday:'1992-11-24',createdAgo:92}));
for(let i=4;i<=250;i++){ const c=mk(i); if(i<=42){c.member=true;c.consentData=true;c.consentPromo=rnd()<.6;do{c.code='DS-'+Array.from({length:4},()=>codeChars[Math.floor(rnd()*codeChars.length)]).join('');}while(customers.some(x=>x.code===c.code));}
 c.birthday=rnd()<.5?`19${80+Math.floor(rnd()*22)}-${String(1+Math.floor(rnd()*12)).padStart(2,'0')}-${String(1+Math.floor(rnd()*28)).padStart(2,'0')}`:''; customers.push(c);}
fs.writeFileSync(__dirname+'/../data/seed.json',JSON.stringify({version:1,categories,products,combos,campaigns,settings,customers}));
fs.writeFileSync(__dirname+'/../assets/productos/LEEME.txt','Coloca aquí las fotos reales (jpg/webp) con el id del producto, p. ej. ron-abuelo.jpg\nSi no existe, la app dibuja un placeholder.\n\n'+products.filter(p=>p.cat!=='cigarrillos').map(p=>p.id+'.jpg  ← '+p.name+' '+p.size).join('\n')+'\n');
fs.writeFileSync(__dirname+'/../assets/campanas/LEEME.txt','Banners de campañas (jpg/webp):\n'+campaigns.map(c=>c.img.split('/').pop()+'  ← '+c.title).join('\n')+'\n');
console.log(products.length,'productos',customers.length,'clientes');
// marca fotos reales si existen
{ const seedP=JSON.parse(fs.readFileSync(__dirname+'/../data/seed.json','utf8')); let n=0;
  seedP.products.forEach(p=>{ for(const e of ['jpg','webp','png']){ if(fs.existsSync(__dirname+'/../assets/productos/'+p.id+'.'+e)){p.img='assets/productos/'+p.id+'.'+e;n++;break;} } });
  fs.writeFileSync(__dirname+'/../data/seed.json',JSON.stringify(seedP)); console.log(n,'fotos reales detectadas'); }
