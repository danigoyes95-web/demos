/* Hero: globos con física suave en canvas. Reaccionan al dedo/cursor y se revientan con confeti. */
import { reducedMotion, confettiBurst, pop } from '../util.js';

export function initHero(canvas, palette) {
  const ctx = canvas.getContext('2d'), still = reducedMotion();
  let W = 0, H = 0, X0 = 0, dpr = 1, running = false, raf = 0, last = 0, balloons = [];
  const ptr = { x: -999, y: -999, on: false };
  const rnd = (a, b) => a + Math.random() * (b - a);

  const make = (fromBottom) => {
    const small = W < 600, r = small ? rnd(22, 38) : rnd(28, 54);
    return { x: rnd(X0 + r, W - r), y: fromBottom ? H + r * 2 + rnd(0, 120) : rnd(-r, H), r, vx: 0, vy: -rnd(0.22, 0.55) * (small ? 55 : 70),
      ph: rnd(0, 6.28), sp: rnd(0.6, 1.4), c: palette[Math.floor(rnd(0, palette.length))], dead: 0 };
  };
  const resize = () => {
    const b = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = b.width; H = b.height; X0 = W >= 900 ? W * 0.5 : 0; // en escritorio los globos viven a la derecha del texto canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = W < 600 ? 11 : 18; while (balloons.length < n) balloons.push(make(false)); balloons.length = n;
    if (still) draw();
  };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of balloons) {
      if (b.dead) continue;
      const ry = b.r * 1.16, sway = Math.sin(b.ph) * 5;
      ctx.strokeStyle = 'rgba(80,40,90,.28)'; ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(b.x, b.y + ry); ctx.bezierCurveTo(b.x + sway * 2, b.y + ry + b.r * 0.9, b.x - sway * 2, b.y + ry + b.r * 1.7, b.x + sway, b.y + ry + b.r * 2.6); ctx.stroke();
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, ry, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(b.x - 3, b.y + ry + 4); ctx.lineTo(b.x, b.y + ry - 1); ctx.lineTo(b.x + 3, b.y + ry + 4); ctx.fill();
      ctx.strokeStyle = 'rgba(46,27,54,.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, ry, 0, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.4, b.y - b.r * 0.45, b.r * 0.15, b.r * 0.3, -0.5, 0, 6.283); ctx.fill();
    }
  }
  function step(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    for (const b of balloons) {
      if (b.dead) { b.dead -= dt; if (b.dead <= 0) Object.assign(b, make(true), { dead: 0 }); continue; }
      b.ph += dt * b.sp * 2;
      b.vx += Math.cos(b.ph) * 6 * dt;
      if (ptr.on) { const dx = b.x - ptr.x, dy = b.y - ptr.y, d = Math.hypot(dx, dy), R = b.r + 70; if (d < R && d > 0.1) { const f = (1 - d / R) * 520 * dt; b.vx += (dx / d) * f; b.vy += (dy / d) * f * 0.6; } }
      b.vx *= 0.97;
      b.vy += (-b.sp * 38 - b.vy) * Math.min(1, dt * 1.2); // recupera su ascenso suave tras un empujón
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < X0 + b.r) { b.x = X0 + b.r; b.vx = Math.abs(b.vx) * 0.6; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.6; }
      if (b.y < -b.r * 4) Object.assign(b, make(true));
    }
    draw(); raf = requestAnimationFrame(step);
  }
  const start = () => { if (running || still) return; running = true; last = performance.now(); raf = requestAnimationFrame(step); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener('pointermove', (e) => { const p = local(e); ptr.x = p.x; ptr.y = p.y; ptr.on = true; });
  canvas.addEventListener('pointerleave', () => { ptr.on = false; });
  canvas.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') ptr.on = false; });
  canvas.addEventListener('pointerdown', (e) => {
    const p = local(e); ptr.x = p.x; ptr.y = p.y; ptr.on = e.pointerType !== 'touch';
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      if (!b.dead && Math.hypot((p.x - b.x) / b.r, (p.y - b.y) / (b.r * 1.16)) <= 1.15) {
        b.dead = 1.4; pop(380 + Math.random() * 300);
        confettiBurst(e.clientX / innerWidth, e.clientY / innerHeight, 36, [b.c, '#ffffff', '#F4C95D', '#7FD1C7']);
        if (still) draw(); break;
      }
    }
  });
  new ResizeObserver(resize).observe(canvas); resize();
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop()), { threshold: 0.05 }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
}
