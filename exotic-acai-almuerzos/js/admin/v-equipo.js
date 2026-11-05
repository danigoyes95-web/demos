/* Equipo y permisos (solo Admin) · roster, matriz de permisos editable y reinicio del demo */
(function () {
  'use strict';
  const { $, esc, icon } = EA, C = CFG, A = ADM;
  const NIV = [['edit', 'Ve y edita'], ['view', 'Solo lectura'], ['resumen', 'Resumen'], ['none', 'Sin acceso']];
  A.views.equipo = (el) => {
    const draw = () => {
      const roles = Object.keys(C.roles);
      el.innerHTML = '<div class="pg-h"><div><h2 style="font-size:1.7rem">Equipo y permisos</h2><p>Quién entra y qué ve cada rol.</p></div></div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Equipo</h3></div></div><div class="tw"><table class="tbl" style="min-width:420px"><thead><tr><th>Persona</th><th>Cargo</th><th>Rol</th></tr></thead><tbody>' + C.equipo.map((u) => '<tr><td><div style="display:flex;gap:10px;align-items:center"><span class="av" style="width:34px;height:34px;font-size:.75rem">' + esc(u.iniciales) + '</span><b>' + esc(u.nombre) + '</b></div></td><td>' + esc(u.cargo) + '</td><td><span class="rol ' + u.rol + '" style="margin:0">' + C.roles[u.rol] + '</span></td></tr>').join('') + '</tbody></table></div></div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Matriz de permisos</h3><p>El rol Admin siempre ve todo. Los cambios se aplican de inmediato en esta demo.</p></div></div><div class="tw"><table class="tbl" style="min-width:640px"><thead><tr><th>Sección</th>' + roles.map((r) => '<th class="pm">' + C.roles[r] + '</th>').join('') + '</tr></thead><tbody>' +
        C.secciones.map((s) => '<tr><td><b>' + esc(s.nombre) + '</b></td>' + roles.map((r) => { const v = EA.permisos(r)[s.id] || 'none'; return '<td class="pm">' + (r === 'admin' ? '<span class="st activo">Ve y edita</span>' : '<select class="inp" data-r="' + r + '" data-s="' + s.id + '" aria-label="' + C.roles[r] + ' en ' + esc(s.nombre) + '">' + NIV.map(([k, l]) => '<option value="' + k + '"' + (v === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>') + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>' +
        '<div class="btn-fila" style="margin-top:14px"><button class="mini" id="rp">' + icon('refresh') + ' Restaurar permisos originales</button></div></div>' +
        '<div class="cd"><div class="cd-h"><div><h3>Datos de la demo</h3><p>Todo (altas, gastos, menús, marcas de entrega) se guarda solo en este navegador.</p></div></div><button class="btn btn-ghost btn-sm" id="rd">' + icon('trash') + ' Borrar cambios y volver a los datos de ejemplo</button><p class="hint" style="margin-top:10px">En la fase 2 estos permisos pasan a políticas RLS de Supabase (ver supabase/schema.sql).</p></div>';
    };
    el.onchange = (e) => { const s = e.target.closest('[data-r]'); if (!s) return; const p = JSON.parse(JSON.stringify(EA.state.perms)); (p[s.dataset.r] = p[s.dataset.r] || {})[s.dataset.s] = s.value; EA.guardarPerms(p); EA.toast('Permiso actualizado'); };
    el.onclick = (e) => {
      if (e.target.closest('#rp')) { EA.guardarPerms({}); EA.toast('Permisos restaurados'); draw(); }
      if (e.target.closest('#rd')) A.confirmar('¿Volver a los datos de ejemplo?', 'Se borran las suscripciones, gastos, menús y permisos que hayas cambiado en esta demo.', 'Sí, reiniciar', () => { EA.resetDemo(); location.hash = '#/resultados'; location.reload(); });
    };
    draw();
  };
})();
