import { useRef, useEffect } from 'preact/hooks';
import L from '../js/leaflet-setup.js';
import 'leaflet.markercluster';
import { hasLoc } from '../js/geo.js';

const pinHtml = (o, color, rank, sel) => {
  const glyph = o.estado === 'hecha' ? '✓' : o.estado === 'no_ejecutada' ? '✕' : (rank || '•');
  const bg = o.estado === 'hecha' ? '#0B7A4B' : o.estado === 'no_ejecutada' ? '#B3261E' : color;
  return `<div class="pin ${o.estado !== 'pendiente' ? 'done' : ''} ${sel ? 'sel' : ''}" style="background:${bg}"><span>${glyph}</span></div>`;
};
// Mapa Leaflet reutilizable (operario y supervisor)
export default function MapView({ orders = [], tipos, pos, rank = {}, routeIds = [], selId, onSelect, extra = [], editPoint, onEdit, onMapClick, focus, polygon, onReady, fitKey, selIds }) {
  const el = useRef(), S = useRef({});
  useEffect(() => {
    const map = L.map(el.current, { zoomControl: false, attributionControl: true, tap: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([-1.2491, -78.6167], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 19, crossOrigin: true, attribution: '© OpenStreetMap' }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    S.current = { map, cluster: L.markerClusterGroup({ maxClusterRadius: 42, showCoverageOnHover: false, spiderfyOnMaxZoom: true, animate: false, animateAddingMarkers: false }).addTo(map), line: L.polyline([], { color: '#1A73E8', weight: 4, dashArray: '8 8', opacity: .8 }).addTo(map), extra: L.layerGroup().addTo(map) };
    S.current.click = onMapClick; map.on('click', e => S.current.click?.(e.latlng));
    onReady?.(map); setTimeout(() => map.invalidateSize(), 50);
    return () => { try { map.stop(); S.current.cluster.clearLayers(); } catch { /* */ } map.off(); map.remove(); };
  }, []);
  const s = S.current; s.click = onMapClick;
  // Marcadores de órdenes
  useEffect(() => {
    const { cluster, map } = S.current; if (!cluster) return;
    cluster.clearLayers();
    for (const o of orders) {
      if (!hasLoc(o)) continue;
      const sel = o.id === selId || !!selIds?.has(o.id);
      const m = L.marker([o.loc.lat, o.loc.lng], { icon: L.divIcon({ className: '', html: pinHtml(o, tipos?.[o.tipo]?.color || '#555', rank[o.id], sel), iconSize: [34, 34], iconAnchor: [17, 36] }), zIndexOffset: sel ? 1000 : 0, title: o.cliente });
      m.on('click', () => onSelect?.(o.id)); cluster.addLayer(m);
    }
  }, [orders, selId, rank, tipos, selIds]);
  // Línea de ruta
  useEffect(() => {
    const { line } = S.current; if (!line) return;
    const pts = routeIds.map(id => orders.find(o => o.id === id)).filter(hasLoc).map(o => [o.loc.lat, o.loc.lng]);
    if (pos && pts.length) pts.unshift([pos.lat, pos.lng]);
    line.setLatLngs(pts);
  }, [routeIds.join(','), orders, pos && Math.round(pos.lat * 3000), pos && Math.round(pos.lng * 3000)]);
  // Mi posición / otros marcadores
  useEffect(() => {
    const { extra: g } = S.current; if (!g) return; g.clearLayers();
    if (pos) { L.circle([pos.lat, pos.lng], { radius: pos.acc || 20, color: '#1A73E8', weight: 1, fillOpacity: .12, interactive: false }).addTo(g); L.marker([pos.lat, pos.lng], { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18] }), interactive: false, zIndexOffset: 2000 }).addTo(g); }
    for (const x of extra) {
      L.marker([x.lat, x.lng], { icon: L.divIcon({ className: '', html: `<div class="pin" style="background:${x.color};border-radius:50%;transform:none;opacity:${x.stale ? .55 : 1}"><span style="transform:none">${x.label}</span></div>`, iconSize: [34, 34], iconAnchor: [17, 17] }), title: x.title, zIndexOffset: 1500 }).bindTooltip(x.title || '').addTo(g);
    }
    if (polygon) L.rectangle(polygon, { color: '#FFC21A', weight: 3, fillOpacity: .15 }).addTo(g);
  }, [pos && Math.round(pos.lat * 3000), pos && Math.round(pos.lng * 3000), extra, polygon]);
  // Punto editable (corregir ubicación)
  useEffect(() => {
    const { map } = S.current; if (!map || !editPoint) return;
    const m = L.marker([editPoint.lat, editPoint.lng], { draggable: true, zIndexOffset: 3000, icon: L.divIcon({ className: '', html: '<div class="pin sel" style="background:#FFC21A"><span style="color:#000">⌖</span></div>', iconSize: [34, 34], iconAnchor: [17, 36] }) }).addTo(map);
    m.on('dragend', () => { const p = m.getLatLng(); onEdit?.({ lat: p.lat, lng: p.lng }); });
    return () => m.remove();
  }, [!!editPoint, editPoint && editPoint.lat, editPoint && editPoint.lng]);
  // Encuadre
  useEffect(() => {
    const { map } = S.current; if (!map) return;
    if (focus && Number.isFinite(focus.lat)) { map.setView([focus.lat, focus.lng], Math.max(map.getZoom(), 16), { animate: true }); return; }
    const pts = orders.filter(hasLoc).map(o => [o.loc.lat, o.loc.lng]); if (pos) pts.push([pos.lat, pos.lng]);
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
  }, [fitKey, focus && focus.lat, focus && focus.lng]);
  return <div class="map" ref={el} />;
}
