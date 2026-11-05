/* Menús (Leo) · editor del menú semanal, biblioteca de platos y valoraciones */
(function () {
  'use strict';
  const { $, $$, esc, fmt, icon } = EA, C = CFG, A = ADM;
  const SLOT = ['Plan Oficina', 'Plan Fit / Gym', 'Plan Especial'];
  const DIAS = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes' };
  const FOTOS = () => Array.from(new Set(EA.state.platos.map((p) => p.foto).filter((f) => !/^data:/.test(f)).concat(['assets/img/bowl-16.webp', 'assets/img/bowl-24.webp', 'assets/img/wrap.webp', 'assets/img/tostada.webp'])));

  A.views.menus = (el, nivel) => {
    const edit = nivel === 'edit'; let tab = 'semana';
    const draw = () => {
      el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">Menús</h2><p>Lo que edites aquí se ve en la landing y en el menú del primer día de cada cliente.</p></div>' + A.soloLectura(nivel) + '</div>' +
        A.tabsUI([['semana', 'Menú semanal'], ['platos', 'Platos'], ['valoraciones', 'Valoraciones']], tab) + '<div id="tabc"></div>';
      ({ semana, platos, valoraciones })[tab]($('#tabc'));
    };
    el.onclick = (e) => {
      const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; draw(); return; }
      const n = e.target.closest('[data-nuevo]'); if (n && edit) { formPlato(null); return; }
      const ed = e.target.closest('[data-edit]'); if (ed && edit) { formPlato(EA.plato(ed.dataset.edit)); }
    };
    el.onchange = (e) => {
      const s = e.target.closest('[data-slot]'); if (!s || !edit) return;
      const [d, i] = s.dataset.slot.split('-'); const sem = JSON.parse(JSON.stringify(EA.state.semana)); sem[d][+i] = s.value; EA.guardarSemana(sem); EA.toast('Menú actualizado'); draw();
    };

    function semana(h) {
      const sem = EA.state.semana, opts = (sel) => EA.state.platos.map((p) => '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('');
      h.innerHTML = '<div class="mgrid">' + Object.keys(DIAS).map((d) => '<div class="mdia"><h4>' + DIAS[d] + '</h4>' + (sem[d] || []).map((id, i) => { const p = EA.plato(id); if (!p) return ''; return '<div class="mslot"><img src="' + A.img(p.foto) + '" alt=""><div><small>' + SLOT[i] + '</small><br><b style="color:var(--acai);font-size:.88rem">' + esc(p.nombre) + '</b><br><small>' + p.kcal + ' kcal · P ' + p.p + ' · C ' + p.c + ' · G ' + p.g + '</small>' + (edit ? '<select class="inp" data-slot="' + d + '-' + i + '" aria-label="Plato de ' + DIAS[d] + ' ' + SLOT[i] + '">' + opts(id) + '</select>' : '') + '</div></div>'; }).join('') + '</div>').join('') + '</div>';
    }
    function platos(h) {
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Biblioteca de platos</h3><p>' + EA.state.platos.length + ' platos</p></div>' + (edit ? '<button class="btn btn-acai btn-sm" data-nuevo>' + icon('plus') + ' Nuevo plato</button>' : '') + '</div><div class="tw"><table class="tbl"><thead><tr><th>Plato</th><th class="r">kcal</th><th class="r">P</th><th class="r">C</th><th class="r">G</th><th>Etiquetas</th><th>Para</th><th></th></tr></thead><tbody>' +
        EA.state.platos.map((p) => '<tr><td><div style="display:flex;gap:10px;align-items:center"><img src="' + A.img(p.foto) + '" alt="" style="width:48px;height:40px;object-fit:cover;border-radius:8px;background:var(--acai-900)"><b>' + esc(p.nombre) + '</b></div></td><td class="r">' + p.kcal + '</td><td class="r">' + p.p + '</td><td class="r">' + p.c + '</td><td class="r">' + p.g + '</td><td>' + p.tags.map((t) => '<span class="tag p">' + esc(t) + '</span> ').join('') + '</td><td>' + SLOT[p.slot] + '</td><td class="r">' + (edit ? '<button class="mini" data-edit="' + p.id + '">' + icon('edit') + ' Editar</button>' : '') + '</td></tr>').join('') + '</tbody></table></div></div>';
    }
    function valoraciones(h) {
      const L = EA.state.platos.slice().sort((a, b) => a.rating - b.rating);
      h.innerHTML = '<div class="cd"><div class="cd-h"><div><h3>Valoraciones de clientes</h3><p>De menor a mayor. Bajo 3,8 con 10 votos o más activa una alerta.</p></div></div><div class="tw"><table class="tbl"><thead><tr><th>Plato</th><th>Valoración</th><th class="r">Votos</th><th>Comentarios</th></tr></thead><tbody>' +
        L.map((p) => '<tr><td><b>' + esc(p.nombre) + '</b></td><td>' + (p.votos ? A.estrellas(p.rating) : '<span class="hint">Sin votos</span>') + (p.votos >= 10 && p.rating < 3.8 ? ' <span class="st cancelado">Baja</span>' : '') + '</td><td class="r">' + p.votos + '</td><td style="max-width:320px">' + ((p.comentarios || []).map((c) => '“' + esc(c) + '”').join('<br>') || '<span class="hint">—</span>') + '</td></tr>').join('') + '</tbody></table></div></div>';
    }

    function formPlato(p) {
      const n = p || { nombre: '', desc: '', kcal: 0, p: 0, c: 0, g: 0, tags: [], foto: 'assets/img/bowl-16.webp', slot: 0, rating: 0, votos: 0, comentarios: [] };
      const m = EA.modal({ title: p ? 'Editar plato' : 'Nuevo plato', body:
        '<form id="fp" class="fgrid"><label class="f"><span>Nombre</span><input class="inp" name="nombre" required value="' + esc(n.nombre) + '"></label><label class="f"><span>Descripción</span><textarea class="inp" name="desc">' + esc(n.desc) + '</textarea></label>' +
        '<div class="fgrid c2"><label class="f"><span>Proteína (g)</span><input class="inp" type="number" min="0" name="p" value="' + n.p + '"></label><label class="f"><span>Carbohidratos (g)</span><input class="inp" type="number" min="0" name="c" value="' + n.c + '"></label><label class="f"><span>Grasa (g)</span><input class="inp" type="number" min="0" name="g" value="' + n.g + '"></label><label class="f"><span>Calorías (kcal)</span><input class="inp" type="number" min="0" name="kcal" value="' + n.kcal + '"></label></div>' +
        '<button type="button" class="mini" id="calc">' + icon('refresh') + ' Calcular kcal con los macros (4·P + 4·C + 9·G)</button>' +
        '<div class="f"><span>Etiquetas</span><div class="chips" id="et">' + C.etiquetas.map((t) => '<button type="button" class="chip" aria-pressed="' + n.tags.includes(t) + '" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div></div>' +
        '<label class="f"><span>Plan al que corresponde</span><select class="inp" name="slot">' + SLOT.map((s, i) => '<option value="' + i + '"' + (n.slot === i ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></label>' +
        '<div class="f"><span>Foto</span><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><img id="fv" src="' + A.img(n.foto) + '" alt="" style="width:96px;height:78px;object-fit:cover;border-radius:12px;background:var(--acai-900)"><div style="display:grid;gap:8px;flex:1;min-width:180px"><select class="inp" id="fsel">' + FOTOS().map((f) => '<option value="' + esc(f) + '"' + (f === n.foto ? ' selected' : '') + '>' + esc(f.split('/').pop()) + '</option>').join('') + '</select><label class="mini" style="cursor:pointer">' + icon('camera') + ' Subir foto real<input type="file" id="fup" accept="image/*" hidden></label></div></div><p class="hint" style="margin-top:6px">Reemplaza las ilustraciones por las fotos de Cris cuando las tengas.</p></div>' +
        '<div class="btn-fila" style="justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-close>Cancelar</button><button class="btn btn-acai btn-sm" type="submit">Guardar plato</button></div></form>' });
      const f = m.el.querySelector('#fp'); let foto = n.foto; const tags = new Set(n.tags);
      m.el.querySelector('#et').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; tags.has(b.dataset.t) ? tags.delete(b.dataset.t) : tags.add(b.dataset.t); b.setAttribute('aria-pressed', tags.has(b.dataset.t)); };
      m.el.querySelector('#calc').onclick = () => { f.kcal.value = 4 * (+f.p.value || 0) + 4 * (+f.c.value || 0) + 9 * (+f.g.value || 0); };
      m.el.querySelector('#fsel').onchange = (e) => { foto = e.target.value; m.el.querySelector('#fv').src = A.img(foto); };
      m.el.querySelector('#fup').onchange = (e) => {
        const file = e.target.files[0]; if (!file) return; const img = new Image(), rd = new FileReader();
        rd.onload = () => { img.onload = () => { const k = Math.min(1, 720 / img.width), cv = document.createElement('canvas'); cv.width = img.width * k; cv.height = img.height * k; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); foto = cv.toDataURL('image/jpeg', .78); m.el.querySelector('#fv').src = foto; }; img.src = rd.result; };
        rd.readAsDataURL(file);
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const out = Object.assign({}, n, { nombre: f.nombre.value.trim(), desc: f.desc.value.trim(), p: +f.p.value || 0, c: +f.c.value || 0, g: +f.g.value || 0, kcal: +f.kcal.value || 0, tags: Array.from(tags), slot: +f.slot.value, foto });
        if (!out.kcal) out.kcal = 4 * out.p + 4 * out.c + 9 * out.g;
        EA.guardarPlato(out); m.close(); EA.toast('Plato guardado'); draw();
      };
    }
    draw();
  };
})();
