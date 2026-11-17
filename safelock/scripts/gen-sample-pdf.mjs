// Genera un PDF FICTICIO que imita una orden de trabajo (el formato real debe confirmarse con el contratista).
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'node:fs';
let s = 77; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = a => a[Math.floor(rnd() * a.length)]; const dig = n => Array.from({ length: n }, () => Math.floor(rnd() * 10)).join('');
const seed = JSON.parse(fs.readFileSync(new URL('../src/data/seed.json', import.meta.url)));
const NOM = ['ELSA','HUGO','NANCY','FABIÁN','RITA','CÉSAR','ANA','BOLÍVAR','JENNY','MARCO'], APE = ['ALDAZ','BASANTES','CHICAIZA','DÍAZ','ESPÍN','FIALLOS','GARCÉS','HIDALGO','INCA','JÁCOME'];
const SEC = [['Centro','AMB-01',false,-1.2417,-78.6197],['Ficoa','AMB-02',false,-1.2270,-78.6330],['Huachi Chico','AMB-04',false,-1.2680,-78.6300],['Izamba','AMB-R1',true,-1.2010,-78.5990],['Pasa','AMB-R8',true,-1.2500,-78.7300],['Totoras','AMB-R5',true,-1.3240,-78.6480]];
const TIPOS = ['CORTE','CORTE','CORTE','RECONEXIÓN','NOTIFICACIÓN','NOTIFICACIÓN','RETIRO','REVISIÓN'];
const rows = [];
for (let i = 0; i < 48; i++) {
  const sec = SEC[i % SEC.length]; const known = i < 6 ? seed.locations[i] : null;
  const gps = rnd() < .5 && !known;
  rows.push([ known?.cuen ?? dig(8), '40' + dig(8), known?.medidor ?? 'M' + dig(7), `${pick(NOM)} ${pick(APE)} ${pick(APE)}`, sec[2] ? 'Sector ' + pick(['La Libertad','El Calvario','San Vicente']) + ' s/n' : `Calle ${pick(['Sucre','Bolívar','Montalvo'])} N°${1 + Math.floor(rnd() * 90)}-${1 + Math.floor(rnd() * 60)}`,
    sec[0], sec[1], sec[2] ? 'R' : 'U', String(1 + Math.floor(i / SEC.length)), (rnd() * 160 + 15).toFixed(2), String(2 + Math.floor(rnd() * 5)), TIPOS[i % TIPOS.length],
    gps ? (sec[3] + (rnd() - .5) * .02).toFixed(6) : '', gps ? (sec[4] + (rnd() - .5) * .02).toFixed(6) : '']);
}
rows[11][2] = '';              // medidor faltante
rows[17][0] = rows[9][0];      // CUEN duplicado
rows[33][12] = '12.482100'; rows[33][13] = '-78.610000'; // coordenadas inválidas (fuera de Ecuador)
const pdf = await PDFDocument.create(); const f = await pdf.embedFont(StandardFonts.Helvetica), fb = await pdf.embedFont(StandardFonts.HelveticaBold);
const H = ['CUEN','CTA CONTRATO','MEDIDOR','CLIENTE','DIRECCIÓN','SECTOR','MRU','RUR','SEC','ADEUDADO','PLAN','TIPO ORDEN','LAT','LNG'];
const X = [24, 68, 128, 174, 282, 400, 452, 488, 510, 532, 578, 612, 674, 724]; // columnas
const W = 842, Hh = 595, PER = 24;
for (let p = 0; p * PER < rows.length; p++) {
  const page = pdf.addPage([W, Hh]);
  page.drawText('EMPRESA ELÉCTRICA [DEMO] — ORDENES DE TRABAJO (EJEMPLO FICTICIO)', { x: 28, y: Hh - 36, size: 12, font: fb });
  page.drawText(`Fecha de emisión: ${new Date().toLocaleDateString('es-EC')}   Contratista: Cuadrillas Demo   Página ${p + 1}`, { x: 28, y: Hh - 52, size: 8, font: f });
  let y = Hh - 78; H.forEach((h, i) => page.drawText(h, { x: X[i], y, size: 6, font: fb })); y -= 5;
  page.drawLine({ start: { x: 24, y }, end: { x: W - 24, y }, thickness: .6, color: rgb(0, 0, 0) });
  for (const r of rows.slice(p * PER, p * PER + PER)) { y -= 18; r.forEach((c, i) => c && page.drawText(c, { x: X[i], y, size: 6, font: f })); }
}
fs.writeFileSync(new URL('../public/samples/ordenes-ejemplo.pdf', import.meta.url), await pdf.save());
console.log('PDF ejemplo generado:', rows.length, 'órdenes');
