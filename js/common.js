/* ============================================================
   El arte del cosmos — piezas compartidas por todas las páginas
   (fondo de estrellas, barra de progreso, aparición al hacer scroll)
   ============================================================ */

const NS = 'http://www.w3.org/2000/svg';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

/* Interpola entre paradas de color definidas como [valor, [r,g,b]] */
function rampColor(stops, value) {
  if (value <= stops[0][0]) return `rgb(${stops[0][1].join(',')})`;
  for (let i = 1; i < stops.length; i++) {
    const [v0, c0] = stops[i - 1];
    const [v1, c1] = stops[i];
    if (value <= v1) {
      const t = (value - v0) / (v1 - v0);
      const c = c0.map((ch, j) => Math.round(ch + (c1[j] - ch) * t));
      return `rgb(${c.join(',')})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1].join(',')})`;
}

/* Color aproximado de una longitud de onda visible, para la banda */
function wavelengthRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  return `rgb(${Math.round(r * 235)}, ${Math.round(g * 225)}, ${Math.round(b * 235)})`;
}

/* ---------------- Campo de estrellas ---------------- */

function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let raf;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round((window.innerWidth * window.innerHeight) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * 0.02 + 0.004
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const s of stars) {
      const alpha = reduceMotion ? s.a : s.a + Math.sin(t * s.tw) * 0.25;
      ctx.globalAlpha = Math.max(0.05, alpha);
      ctx.fillStyle = '#EFE7DA';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) raf = requestAnimationFrame(draw);
  }

  resize();
  draw(0);
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    if (!reduceMotion) raf = requestAnimationFrame(draw); else draw(0);
  });
}

/* ---------------- Barra de progreso ---------------- */

function initProgress(bar) {
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

/* ---------------- Aparición genérica ---------------- */

function initReveal(selector) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('is-visible');
    });
  }, { threshold: 0.2 });
  els.forEach((el) => io.observe(el));
}

/* Arranca una pieza sin que un fallo suyo tumbe a las demás.
   Si algo va mal, queda escrito en la consola con su nombre. */
function arranca(nombre, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`[${nombre}] no pudo arrancar:`, e);
  }
}

/* ---------------- Arranque compartido ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('starfield')) initStarfield();
  const bar = document.getElementById('progressBar');
  if (bar) initProgress(bar);
  initReveal('.reveal');
});
