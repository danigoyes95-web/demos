/* 2.2 Cotizaciones (mini CRM): lista, Kanban, detalle, cotización formal imprimible */
import { getQuotes, getQuote, updateQuote, deleteQuote, getItems, getOccasions, getSettings, quoteCode } from '../data.js';
import { sceneSVG } from '../scene.js';
import { $, $$, esc, money, fmtDate, fmtShort, fmtDateTime, timeAgo, waLink, waNumber, rangeText, colorName, toast } from '../util.js';
import { STATUS, STATUS_ORDER, LOST_REASONS, badge, amountOf, openModal, confirmBox } from './ui.js';

let mode = 'kanban', search = '', filter = '', limit = 30;

const sceneOf = (q, items, occasions) => {
  if (q.snapshot) return q.snapshot;
  const occ = occasions.find((o) => o.id === q.occasion);
  return sceneSVG({ colors: q.colors?.length ? q.colors : occ?.palette, honoree: q.honoree, mood: occ?.scene, occasionId: q.occasion, items: q.items.map((l) => ({ scene: items.find((i) => i.id === l.itemId)?.scene })) });
};
const money2 = (n) => money(n || 0);
const priceText = (q) => (q.finalTotal != null ? money(q.finalTotal) : q.rangeMax ? rangeText(q.rangeMin, q.rangeMax) : 'A cotizar');

export async function render(view, { arg, go }) {
  const [all, items, occasions, settings] = await Promise.all([getQuotes(), getItems(), getOccasions(), getSettings()]);
  const occName = (id) => occasions.find((o) => o.id === id)?.name || id;
  let quotes = all;

  const cardHTML = (q) => `<article class="qcard" draggable="true" data-id="${q.id}"><div class="qc-top"><b>#${quoteCode(q.id)}</b><span class="muted sm">${timeAgo(q.createdAt)}</span></div>
    <div class="qc-name">${esc(q.contact.name)}</div><div class="muted sm">${esc(occName(q.occasion))}${q.eventDate ? ' · ' + fmtShort(q.eventDate) : ''}</div>
    <div class="qc-bot"><b>${priceText(q)}</b>${q.source === 'galeria' ? '<span class="tag">📷 galería</span>' : ''}</div>${q.status === 'lost' && q.lostReason ? `<div class="lost-r">✕ ${esc(q.lostReason)}</div>` : ''}</article>`;

  function draw() {
    const term = search.toLowerCase();
    const list = quotes.filter((q) => (!filter || q.status === filter) && (!term || (`${quoteCode(q.id)} ${q.contact.name} ${occName(q.occasion)}`).toLowerCase().includes(term)));
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, quotes.filter((q) => q.status === s).length]));
    view.innerHTML = `<div class="bar wrapbar"><input class="search" id="qs" type="search" placeholder="Buscar por nombre, # u ocasión…" value="${esc(search)}">
      <div class="seg-a"><button data-m="kanban" class="${mode === 'kanban' ? 'on' : ''}">Kanban</button><button data-m="list" class="${mode === 'list' ? 'on' : ''}">Lista</button></div></div>
      ${mode === 'list' ? `<div class="chips-a"><button data-f="" class="${!filter ? 'on' : ''}">Todas · ${quotes.length}</button>${STATUS_ORDER.map((s) => `<button data-f="${s}" class="${filter === s ? 'on' : ''}" style="--bc:${STATUS[s].c}">${STATUS[s].n} · ${counts[s]}</button>`).join('')}</div>` : ''}
      ${mode === 'kanban' ? `<div class="kanban">${STATUS_ORDER.map((s) => { const col = list.filter((q) => q.status === s); return `<section class="kcol" data-s="${s}" style="--bc:${STATUS[s].c}"><header><b>${STATUS[s].n}</b><span class="pill">${col.length}</span></header><div class="kbody">${col.slice(0, s === 'done' || s === 'lost' ? 12 : 40).map(cardHTML).join('') || '<p class="muted sm center">Sin cotizaciones</p>'}${col.length > 12 && (s === 'done' || s === 'lost') ? `<p class="muted sm center">+${col.length - 12} más (ver en Lista)</p>` : ''}</div></section>`; }).join('')}</div>`
      : `<div class="card"><div class="tbl">${list.slice(0, limit).map((q) => `<div class="trow" data-id="${q.id}"><span class="t-id">#${quoteCode(q.id)}</span><span class="t-main"><b>${esc(q.contact.name)}</b><small>${esc(occName(q.occasion))}${q.eventDate ? ' · ' + fmtShort(q.eventDate) : ''}</small></span><span class="t-price">${priceText(q)}</span>${badge(q.status)}</div>`).join('') || '<p class="muted center pad">Sin resultados</p>'}</div>${list.length > limit ? `<button class="btn ghost block" id="more">Mostrar más (${list.length - limit})</button>` : ''}</div>`}`;

    $('#qs', view).addEventListener('input', (e) => { search = e.target.value; const pos = e.target.selectionStart; draw(); const i = $('#qs', view); i.focus(); i.setSelectionRange(pos, pos); });
    $$('[data-m]', view).forEach((b) => (b.onclick = () => { mode = b.dataset.m; draw(); }));
    $$('[data-f]', view).forEach((b) => (b.onclick = () => { filter = b.dataset.f; limit = 30; draw(); }));
    $('#more', view)?.addEventListener('click', () => { limit += 30; draw(); });
    $$('[data-id]', view).forEach((c) => c.addEventListener('click', () => go(`#/cotizaciones/${c.dataset.id}`)));
    // arrastrar y soltar (escritorio)
    $$('.qcard', view).forEach((c) => c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', c.dataset.id); c.classList.add('drag'); }));
    $$('.kcol', view).forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', async (e) => { e.preventDefault(); col.classList.remove('over'); await moveTo(+e.dataTransfer.getData('text/plain'), col.dataset.s); });
    });
  }

  async function moveTo(id, status) {
    const q = quotes.find((x) => x.id === id); if (!q || q.status === status) return;
    if (status === 'lost') return askLost(q);
    if ((status === 'deposit' || status === 'done') && q.finalTotal == null) { toast('Primero pon el precio final en el detalle', 'warn'); return go(`#/cotizaciones/${id}`); }
    const patch = { status, lostReason: null };
    if (status === 'deposit' && !q.deposit) patch.deposit = Math.round(q.finalTotal * (settings.depositPct / 100));
    await updateQuote(id, patch); await refresh(); toast(`#${quoteCode(id)} → ${STATUS[status].n}`);
  }
  function askLost(q, after) {
    const m = openModal(`<h3>¿Por qué se perdió #${quoteCode(q.id)}?</h3><p class="muted">Anotar el motivo te ayuda a mejorar.</p><label class="f">Motivo<select id="lr">${LOST_REASONS.map((r) => `<option>${r}</option>`).join('')}</select></label><div class="row end" style="margin-top:14px"><button class="btn ghost" data-n>Cancelar</button><button class="btn danger" data-y>Marcar como perdida</button></div>`);
    m.$('[data-n]').onclick = m.close;
    m.$('[data-y]').onclick = async () => { await updateQuote(q.id, { status: 'lost', lostReason: $('#lr', m.el).value }); m.close(); await refresh(); after?.(); };
  }
  async function refresh() { quotes = await getQuotes(); draw(); }

  /* ---------- detalle ---------- */
  async function openDetail(id) {
    const base = await getQuote(id); if (!base) { toast('Cotización no encontrada', 'err'); return go('#/cotizaciones'); }
    const q = structuredClone(base);
    q.items.forEach((l) => { if (l.final == null) l.final = ''; });
    const m = openModal('<div id="dt"></div>', { wide: true, onClose: () => { if (location.hash.startsWith('#/cotizaciones/')) history.replaceState(null, '', '#/cotizaciones'); refresh(); } });
    const dt = $('#dt', m.el);
    const calc = () => {
      const filled = q.items.every((l) => Number(l.final) > 0);
      const sub = q.items.reduce((s, l) => s + (Number(l.final) || 0) * l.qty, 0), extra = Number(q.extra) || 0;
      const total = q.items.length ? sub + extra : (Number(q.manualTotal) || 0);
      return { filled, total, balance: Math.max(0, total - (Number(q.deposit) || 0)) };
    };
    const paint = () => {
      const c = calc(), oc = occasions.find((o) => o.id === q.occasion);
      dt.innerHTML = `<div class="dhead"><div><h2>Cotización #${quoteCode(q.id)}</h2><span class="muted sm">${fmtDateTime(q.createdAt)} · ${timeAgo(q.createdAt)} · vía ${q.source === 'galeria' ? 'galería' : q.source === 'whatsapp' ? 'WhatsApp' : 'armador'}</span></div>${badge(q.status)}</div>
      <div class="dgrid"><div>
        <div class="scenebox">${sceneOf(q, items, occasions)}</div>
        ${q.reference ? `<div class="ref-a"><img src="../${esc(q.reference.photo)}" alt=""><div><b>Referencia de galería</b><br><span class="muted sm">${esc(q.reference.caption)}</span></div></div>` : ''}
        <div class="card pad flat"><h4>Contacto</h4><p style="margin:0"><b>${esc(q.contact.name)}</b><br>${q.contact.whatsapp ? `<a class="lnk" target="_blank" rel="noopener" href="https://wa.me/${waNumber(q.contact.whatsapp)}">💬 ${esc(q.contact.whatsapp)}</a>` : '<span class="muted">Sin número (llegó por WhatsApp)</span>'}</p></div>
        <div class="card pad flat"><h4>Evento</h4><dl class="dl"><div><dt>Ocasión</dt><dd>${esc(oc?.name || q.occasion)}</dd></div><div><dt>Fecha</dt><dd>${q.eventDate ? fmtDate(q.eventDate) : 'Por definir'}</dd></div><div><dt>Invitados</dt><dd>${q.guests || '—'}</dd></div><div><dt>Lugar</dt><dd>${q.place === 'ambato' ? 'Ambato' : q.place === 'retiro' ? 'Retiro en local' : 'Otra ciudad' + (q.city ? ' · ' + esc(q.city) : '')}</dd></div><div><dt>Colores</dt><dd>${q.colors?.length ? q.colors.map((c) => `<i class="dot" style="background:${c}" title="${colorName(c)}"></i>`).join('') : 'Sorpréndanme'}</dd></div><div><dt>Nombre en backdrop</dt><dd>${esc(q.honoree) || '—'}</dd></div></dl></div>
      </div><div>
        <div class="card pad flat"><h4>Elementos y precio final</h4>
          ${q.items.length ? `<table class="ptable"><thead><tr><th>Elemento</th><th>Rango</th><th>Final (c/u)</th></tr></thead><tbody>${q.items.map((l, i) => `<tr><td>${esc(l.name)}${l.qty > 1 ? ` <small>×${l.qty}</small>` : ''}</td><td class="muted sm">${money(l.pmin)}–${money(l.pmax)}</td><td><input class="pin" type="number" min="0" step="0.5" data-i="${i}" value="${l.final}" placeholder="$"></td></tr>`).join('')}</tbody></table>
          <label class="f inline">Traslado / extras<input class="pin" type="number" min="0" step="1" id="extra" value="${q.extra || ''}" placeholder="$0"></label>`
          : `<p class="muted sm">Sin elementos (llegó por galería o WhatsApp). Pon el total manualmente:</p><label class="f inline">Total<input class="pin" type="number" min="0" id="manual" value="${q.manualTotal || ''}" placeholder="$"></label>`}
          <div class="totals"><div><span>Rango del armador</span><b>${q.rangeMax ? rangeText(q.rangeMin, q.rangeMax) : '—'}</b></div><div class="big"><span>Total final</span><b id="tot">${c.total ? money2(c.total) : '—'}</b></div></div>
          ${q.items.length && !c.filled ? '<p class="muted sm">Pon el precio de cada elemento para fijar el total final.</p>' : ''}
        </div>
        <div class="card pad flat"><h4>Estado y anticipo</h4><div class="form2">
          <label class="f">Estado<select id="st">${STATUS_ORDER.map((s) => `<option value="${s}" ${q.status === s ? 'selected' : ''}>${STATUS[s].n}</option>`).join('')}</select></label>
          <label class="f" id="lrw" ${q.status === 'lost' ? '' : 'hidden'}>Motivo de pérdida<select id="lr">${LOST_REASONS.map((r) => `<option ${q.lostReason === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
          <label class="f">Anticipo recibido ($)<input type="number" min="0" id="dep" value="${q.deposit || ''}" placeholder="0"></label>
          <div class="f"><span>Saldo pendiente</span><b class="bal" id="bal">${c.total ? money2(c.balance) : '—'}</b></div></div>
          <button class="btn ghost sm" id="depPct" ${c.total ? '' : 'disabled'}>Registrar anticipo ${settings.depositPct}% (${money2(c.total * settings.depositPct / 100)})</button>
          <label class="f" style="margin-top:10px">Notas internas<textarea id="notes" rows="2" placeholder="Ej: prefiere globos pastel…">${esc(q.notes)}</textarea></label></div>
        <div class="actions"><button class="btn primary block" id="save">💾 Guardar cambios</button>
          <div class="row"><a class="btn ghost" href="#/cotizacion/${q.id}" target="_blank">📄 Cotización formal</a><button class="btn wa" id="send">Enviar por WhatsApp</button></div>
          <button class="btn link-d" id="del">Eliminar cotización</button></div>
      </div></div>`;
      wire();
    };
    const live = () => { const c = calc(); $('#tot', dt).textContent = c.total ? money2(c.total) : '—'; $('#bal', dt).textContent = c.total ? money2(c.balance) : '—'; const b = $('#depPct', dt); b.disabled = !c.total; b.textContent = `Registrar anticipo ${settings.depositPct}% (${money2(c.total * settings.depositPct / 100)})`; };
    const patchOf = () => {
      const c = calc();
      return { items: q.items.map((l) => ({ ...l, final: l.final === '' ? undefined : Number(l.final) })), extra: Number(q.extra) || 0, manualTotal: Number(q.manualTotal) || 0,
        finalTotal: (q.items.length ? c.filled : c.total > 0) ? c.total : null, status: q.status, lostReason: q.status === 'lost' ? q.lostReason || LOST_REASONS[0] : null, deposit: Number(q.deposit) || 0, notes: q.notes };
    };
    const save = async (silent) => {
      const p = patchOf();
      if (p.finalTotal != null && q.status === 'new') { q.status = p.status = 'quoted'; }
      if ((p.status === 'deposit' || p.status === 'done') && p.finalTotal == null) { toast('Para anticipo/realizada pon el precio final', 'warn'); return false; }
      await updateQuote(q.id, p); Object.assign(q, p); if (!silent) toast('Cotización guardada ✔'); return true;
    };
    function wire() {
      $$('.pin[data-i]', dt).forEach((i) => i.addEventListener('input', () => { q.items[+i.dataset.i].final = i.value; live(); }));
      $('#extra', dt)?.addEventListener('input', (e) => { q.extra = e.target.value; live(); });
      $('#manual', dt)?.addEventListener('input', (e) => { q.manualTotal = e.target.value; live(); });
      $('#dep', dt).addEventListener('input', (e) => { q.deposit = e.target.value; live(); });
      $('#notes', dt).addEventListener('input', (e) => { q.notes = e.target.value; });
      $('#lr', dt).addEventListener('change', (e) => { q.lostReason = e.target.value; });
      $('#st', dt).addEventListener('change', (e) => { q.status = e.target.value; $('#lrw', dt).hidden = q.status !== 'lost'; if (q.status === 'lost') q.lostReason = $('#lr', dt).value; });
      $('#depPct', dt).onclick = async () => { const c = calc(); q.deposit = Math.round(c.total * settings.depositPct / 100); if (q.status === 'new' || q.status === 'quoted') q.status = 'deposit'; if (await save(true)) { toast('Anticipo registrado ✔'); paint(); } };
      $('#save', dt).onclick = async () => { if (await save()) paint(); };
      $('#del', dt).onclick = async () => { if (await confirmBox(`¿Eliminar la cotización #${quoteCode(q.id)}?`, 'Eliminar', true)) { await deleteQuote(q.id); m.close(); toast('Eliminada'); } };
      $('#send', dt).onclick = async () => {
        if (!(await save(true))) return;
        const c = calc(), lines = q.items.map((l) => `• ${l.name}${l.qty > 1 ? ' x' + l.qty : ''}${Number(l.final) ? ' — ' + money(l.final * l.qty) : ''}`).join('\n');
        const msg = [`Hola ${q.contact.name.split(' ')[0]} 👋 Te comparto tu cotización Valnu #${quoteCode(q.id)}`, `🎉 ${occName(q.occasion)}${q.eventDate ? ' · ' + fmtDate(q.eventDate) : ''}`, lines, c.total ? `Total: ${money(c.total)}` : `Rango estimado: ${rangeText(q.rangeMin, q.rangeMax)}`, c.total ? `Para reservar tu fecha: anticipo del ${settings.depositPct}% (${money(c.total * settings.depositPct / 100)})` : '', `Cotización válida por ${settings.quoteValidityDays} días.`].filter(Boolean).join('\n');
        open(q.contact.whatsapp ? waLink(q.contact.whatsapp, msg) : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      };
    }
    paint();
  }

  draw();
  // arrastre no existe en tacto: en móvil se cambia el estado desde el detalle
  if (arg) openDetail(arg);
}

/* ---------- vista imprimible (se guarda como PDF con Imprimir del navegador) ---------- */
export async function renderPrint(root, id) {
  const [q, settings, occasions] = await Promise.all([getQuote(id), getSettings(), getOccasions()]);
  if (!q) { root.innerHTML = '<p style="padding:24px">Cotización no encontrada.</p>'; return; }
  const occ = occasions.find((o) => o.id === q.occasion)?.name || q.occasion;
  const sub = q.items.reduce((s, l) => s + (Number(l.final) || 0) * l.qty, 0), extra = q.extra || 0;
  const total = q.finalTotal ?? (q.items.length ? null : q.manualTotal || null);
  const valid = new Date(new Date(q.createdAt).getTime() + settings.quoteValidityDays * 86400000);
  const dep = total ? Math.round(total * settings.depositPct / 100) : 0;
  root.innerHTML = `<div class="noprint printbar"><a class="btn ghost" href="#/cotizaciones/${q.id}">← Volver</a><button class="btn primary" onclick="print()">🖨️ Imprimir / Guardar como PDF</button></div>
  <div class="doc"><header class="doc-h"><img src="../assets/img/logo.jpg" alt="Valnu"><div><h1>Valnu en su Fiesta</h1><p>${esc(settings.address)}<br>WhatsApp ${esc(settings.whatsappDisplay)} · @${esc(settings.instagram)}</p></div><div class="doc-n"><b>COTIZACIÓN</b><span>#${quoteCode(q.id)}</span><small>${fmtDate(q.createdAt.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></header>
    <section class="doc-g"><div><h4>Cliente</h4><p><b>${esc(q.contact.name)}</b><br>${esc(q.contact.whatsapp || '')}</p></div><div><h4>Evento</h4><p><b>${esc(occ)}</b><br>${q.eventDate ? fmtDate(q.eventDate) : 'Fecha por definir'}${q.guests ? ' · ' + q.guests + ' invitados' : ''}<br>${q.place === 'ambato' ? 'Ambato' : q.place === 'retiro' ? 'Retiro en local' : 'Otra ciudad' + (q.city ? ' · ' + esc(q.city) : '')}</p></div></section>
    <table class="doc-t"><thead><tr><th>Descripción</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead><tbody>
    ${q.items.map((l) => `<tr><td>${esc(l.name)}</td><td>${l.qty}</td><td>${l.final ? money(l.final) : 'A confirmar'}</td><td>${l.final ? money(l.final * l.qty) : '—'}</td></tr>`).join('') || `<tr><td colspan="4">Servicio según referencia${q.reference ? ': ' + esc(q.reference.caption) : ''}</td></tr>`}
    ${extra ? `<tr><td>Traslado / extras</td><td>1</td><td>${money(extra)}</td><td>${money(extra)}</td></tr>` : ''}</tbody></table>
    <div class="doc-tot"><div><span>Total</span><b>${total ? money(total) : rangeText(q.rangeMin, q.rangeMax)}</b></div>${total ? `<div><span>Anticipo para reservar (${settings.depositPct}%)</span><b>${money(dep)}</b></div>${q.deposit ? `<div><span>Anticipo recibido</span><b>${money(q.deposit)}</b></div><div><span>Saldo pendiente</span><b>${money(Math.max(0, total - q.deposit))}</b></div>` : ''}` : '<div><small>Precio final por confirmar</small></div>'}</div>
    <section class="doc-p"><h4>Condiciones</h4><ul><li>${esc(settings.policies.montaje)}</li><li>${esc(settings.policies.desmontaje)}</li><li>${esc(settings.policies.cancelacion)}</li><li>Cotización válida hasta el ${fmtDate(valid.toISOString().slice(0, 10), { day: 'numeric', month: 'long' })}.</li></ul></section>
    <footer class="doc-f">¡Gracias por confiar en Valnu en su Fiesta! 🎈</footer></div>`;
}
