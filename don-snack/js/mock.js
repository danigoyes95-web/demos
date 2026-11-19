/* Generador de datos ficticios (3 meses). SOLO DEMO: se elimina al conectar el backend real. */
const Mock = (() => {
  function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  const DAY=864e5, dkey=d=>{d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const WD_PREVIA=[1.0,.6,.6,.8,1.5,2.2,2.3], WD_CAVA=[1.1,.7,.7,.8,1.1,1.6,1.4];
  const H_PREVIA={17:3,18:5,19:8,20:12,21:15,22:16,23:14,0:9,1:4}, H_CAVA={11:2,12:4,13:5,14:5,15:6,16:9,17:11,18:10,19:7,20:4};
  const wpick=(r,obj)=>{const ks=Object.keys(obj),tot=ks.reduce((a,k)=>a+obj[k],0);let x=r()*tot;for(const k of ks){x-=obj[k];if(x<=0)return +k;}return +ks[0];};
  function build(seed, now){
    const r=rng(11), P=Object.fromEntries(seed.products.map(p=>[p.id,p])), S=seed.settings, C=seed.customers.map(c=>({...c}));
    const pick=a=>a[Math.floor(r()*a.length)], by=(f)=>seed.products.filter(f);
    const liquor=by(p=>['ron','whisky','vodka','tequila','cerveza','latas'].includes(p.cat)), liqW=liquor.flatMap(p=>Array(p.best?3:1).fill(p));
    const mixers=by(p=>p.mixer), snacks=by(p=>p.cat==='snacks'), ice=P['hielo-2'];
    const malbecs=by(p=>p.grape==='Malbec'), cava=by(p=>['vinos','espumantes','premium','cremas'].includes(p.cat)&&p.price<95), ext=by(p=>p.cat==='detalles');
    const line=(id,q=1)=>({id,qty:q});
    // patrón de "lo de siempre" por cliente
    const usual={}; C.forEach(c=>{ if(c.id==='u001'){usual[c.id]=[line('ron-abuelo'),line('cola-2l',2),line('hielo-2')];return;}
      if(c.type==='cava'){usual[c.id]=[line(pick(cava).id)];return;}
      const l=pick(liqW); usual[c.id]=[line(l.id,l.cat==='cerveza'||l.cat==='latas'?1:1),...(r()<.7?[line(pick(mixers).id,2)]:[]),...(r()<.6?[line('hielo-2')]:[]),...(r()<.3?[line(pick(snacks).id)]:[])]; });
    const orders=[]; let n=100;
    const zoneOf=id=>S.zones.find(z=>z.id===id)||S.zones[0];
    const drivers=['Marco','Luis','Jhon'];
    const campsAbs=seed.campaigns.map(c=>({...c,s:now+c.startOff*DAY,e:now+(c.endOff+1)*DAY}));
    const mkOrder=(c,ts,door,lines,opts={})=>{
      const items=[]; let sub=0,disc=0,camp=null;
      for(const l of lines){const p=P[l.id]; if(!p)continue; let price=p.price;
        for(const cp of campsAbs){ if(cp.enabled&&cp.discount&&ts>=cp.s&&ts<cp.e&&(cp.productIds.includes(p.id)||cp.cats.includes(p.cat))&&p.cat!=='cigarrillos'){disc+=price*cp.discount/100*l.qty;camp=cp.id;} }
        items.push({id:p.id,name:p.name,size:p.size,qty:l.qty,price}); sub+=price*l.qty; }
      const pickup=opts.pickup||r()<.06, z=zoneOf(c.zone), mem=c.member;
      const fee=pickup?0:z.fee; const total=+(sub-disc+fee).toFixed(2);
      const gift=door==='cava'&&r()<.35;
      const dur=Math.round(18+r()*22+(door==='previa'&&r()<.2?12:0));
      const cancelled=!opts.status&&r()<.04;
      return {id:'o'+(++n),number:n,customerId:c.id,customerName:c.name,phone:c.phone,items,subtotal:+sub.toFixed(2),discount:+disc.toFixed(2),fee,total,
        payment:pick(['efectivo','efectivo','transferencia','payphone']),cashWith:null,gift,giftMsg:gift?pick(S.giftMessages):'',giftName:'',
        address:{...c.address,zone:c.zone},pickup,status:opts.status||(cancelled?'cancel':'done'),createdAt:ts,acceptedAt:ts+2*6e4,
        deliveredAt:(opts.status||cancelled)?null:ts+dur*6e4,door,source:opts.source||'normal',camp,driver:pick(drivers),tier:null};};
    const memberPool=C.filter(c=>c.member&&c.id!=='u001');
    const T0=new Date(now); T0.setHours(0,0,0,0);
    const events={};
    // Carlos: historial explícito
    const carlos=C[0];
    [[4,'usual'],[12,'six'],[35,'usual'],[47,'usual'],[58,'usual'],[71,'usual'],[83,'usual']].forEach(([d,t])=>{
      const ts=T0.getTime()-d*DAY+(21+ (d%3))*36e5+d*6e4;
      orders.push(mkOrder(carlos,ts,'previa',t==='usual'?usual.u001:[line('pilsener-six'),line('pilsener-600')],{source:t==='usual'?'usual':'normal',pickup:false,status:'done'}));
      orders[orders.length-1].status='done';orders[orders.length-1].payment='efectivo';});
    for(let d=90;d>=0;d--){
      const day=new Date(T0.getTime()-d*DAY), wd=day.getDay(), trend=.8+.35*(90-d)/90;
      const nP=Math.max(0,Math.round(9*WD_PREVIA[wd]*trend*(.8+r()*.4))), nC=Math.max(0,Math.round(3.2*WD_CAVA[wd]*trend*(.7+r()*.6)));
      const mk=(door,num,H)=>{ for(let i=0;i<num;i++){
        const h=wpick(r,H), ts=day.getTime()+h*36e5+Math.floor(r()*60)*6e4+(h<6?DAY:0);
        if(ts>now-30*6e4&&d===0) continue;
        let c; const pool=(door==='previa'?C.filter(x=>x.type!=='cava'):C.filter(x=>x.type!=='previa')).filter(x=>x.id!=='u001');
        c=r()<.3?pick(memberPool.filter(x=>pool.includes(x))):pick(pool.filter(x=>!x.member)); if(!c||(now-ts)/DAY>(90-c.createdAgo)+ -0 && false)continue;
        if(ts<now-(c.createdAgo+1)*DAY && c.createdAgo<90) continue;
        let lines, src='normal';
        if(c.member&&r()<.5){lines=usual[c.id].map(x=>({...x}));src='usual';}
        else if(door==='previa'){const l=pick(liqW);lines=[line(l.id,l.cat==='cerveza'||l.cat==='latas'?1+Math.floor(r()*2):1)];if(r()<.7)lines.push(line(pick(mixers).id,1+Math.floor(r()*2)));if(r()<.6)lines.push(line('hielo-2'));if(r()<.5)lines.push(line(pick(snacks).id,1+Math.floor(r()*2)));}
        else{lines=[line((r()<.3?pick(malbecs):pick(cava)).id,r()<.2?2:1)];if(r()<.25)lines.push(line(pick(ext).id));}
        const o=mkOrder(c,ts,door,lines,{source:src}); if(src==='normal'&&c.member&&r()<.12)o.source='ronda'; orders.push(o);} };
      mk('previa',nP,H_PREVIA); mk('cava',nC,H_CAVA);
    }
    orders.sort((a,b)=>a.createdAt-b.createdAt); orders.forEach((o,i)=>{o.number=101+i;o.id='o'+o.number;}); n=100+orders.length;
    // tier histórico (aprox.) y eventos diarios
    const cnt={}; orders.forEach(o=>{const k=dkey(o.createdAt);cnt[k]=(cnt[k]||0)+1;});
    for(let d=90;d>=0;d--){const k=dkey(T0.getTime()-d*DAY),c=cnt[k]||0;events[k]={open:Math.round(c*(7+r()*3)),add:Math.round(c*(2.4+r()*.8)),adv:Math.round(c*.3*(.7+r()*.6)),advAdd:Math.round(c*.12*(.7+r()*.6))};}
    // pedidos en vivo
    const live=[[3,'new','u004'],[12,'prep','u005'],[26,'way','u006']];
    live.forEach(([m,st,id])=>{const c=C.find(x=>x.id===id);const l=pick(liqW);const o=mkOrder(c,now-m*6e4,'previa',[line(l.id),line(pick(mixers).id,2),line('hielo-2')],{status:st});o.number=++n;o.id='o'+n;o.acceptedAt=st==='new'?null:o.createdAt+2*6e4;orders.push(o);});
    const votes={}; memberPool.slice(0,26).forEach(c=>{votes[c.id]=pick(['supercholo','malbec-alamos','gin-ceibo','chandon','ron-havana','puro','enterrado','gran-malo']);});
    return {customers:C,orders,events,votes,seq:n};
  }
  return {build};
})();
