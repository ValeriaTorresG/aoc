/* ============================================================
   El arte del cosmos — la red cósmica
   La red no se dibuja como un grafo de puntos y líneas: se
   siembran cúmulos, se tienden filamentos entre ellos y después
   se reparten miles de galaxias por esa estructura. Lo que se ve
   son las galaxias; los filamentos y las paredes aparecen solos,
   igual que en las simulaciones de verdad.

   El control de tiempo interpola entre la nube difusa de la que
   partió todo y la red de hoy: cada galaxia cae hacia donde la
   gravedad la va a dejar.

   Se dibuja en <canvas> porque son varios miles de partículas en
   movimiento; el <svg> de encima solo lleva los rótulos.
   Depende de js/common.js (svgEl, arranca).
   ============================================================ */

function webRandom(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/* ---------------- Estructura: cúmulos, filamentos, paredes ---------------- */

function seedClusters(rand, box, count, minDist) {
  const nodes = [];
  let guard = 0;
  while (nodes.length < count && guard++ < 30000) {
    const x = box.x + rand() * box.w;
    const y = box.y + rand() * box.h;
    if (nodes.some((n) => Math.hypot(n.x - x, n.y - y) < minDist)) continue;
    nodes.push({ x, y, mass: 0.3 + rand() * 0.7 });
  }
  return nodes;
}

function linkClusters(nodes, linkDist, maxDegree = 3) {
  const edges = [];
  const seen = new Set();
  nodes.forEach((c, i) => {
    nodes
      .map((o, j) => ({ j, d: Math.hypot(o.x - c.x, o.y - c.y) }))
      .filter((o) => o.j !== i && o.d <= linkDist)
      .sort((a, b) => a.d - b.d)
      .slice(0, maxDegree)
      .forEach(({ j, d }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({ a: i, b: j, d });
      });
  });
  return edges;
}

/* Paredes: triángulos de cúmulos unidos entre sí de tres en tres */
function findWalls(nodes, edges, limit = 40) {
  const linked = new Set(edges.map((e) => (e.a < e.b ? `${e.a}-${e.b}` : `${e.b}-${e.a}`)));
  const has = (i, j) => linked.has(i < j ? `${i}-${j}` : `${j}-${i}`);
  const walls = [];
  for (let i = 0; i < nodes.length && walls.length < limit; i++)
    for (let j = i + 1; j < nodes.length && walls.length < limit; j++)
      for (let k = j + 1; k < nodes.length && walls.length < limit; k++)
        if (has(i, j) && has(j, k) && has(i, k)) walls.push([i, j, k]);
  return walls;
}

/* Los huecos más grandes que caben sin tocar un cúmulo */
function findVoids(nodes, box, howMany = 3) {
  const found = [];
  for (let v = 0; v < howMany; v++) {
    let best = { x: 0, y: 0, r: 0 };
    for (let i = 0; i <= 60; i++) {
      for (let j = 0; j <= 40; j++) {
        const x = box.x + (box.w * i) / 60;
        const y = box.y + (box.h * j) / 40;
        if (found.some((f) => Math.hypot(f.x - x, f.y - y) < f.r * 0.85)) continue;
        let d = Infinity;
        for (const n of nodes) d = Math.min(d, Math.hypot(n.x - x, n.y - y));
        if (d > best.r) best = { x, y, r: d };
      }
    }
    if (best.r < 25) break;
    found.push(best);
  }
  return found;
}

/* ---------------- El campo de galaxias ---------------- */

function createWebField(cfg) {
  const { canvas, overlay, world, seed = 23 } = cfg;
  const rand = webRandom(seed);
  const ctx = canvas.getContext('2d');
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 1.2;

  const box = { x: world.margin, y: world.margin, w: world.w - world.margin * 2, h: world.h - world.margin * 2 };
  const nodes = seedClusters(rand, box, cfg.clusters ?? 46, cfg.minDist ?? 44);
  const edges = linkClusters(nodes, cfg.linkDist ?? 118);
  const walls = findWalls(nodes, edges);
  const voids = findVoids(nodes, box);

  /* Cada galaxia sabe de qué estructura forma parte y de dónde vino */
  const parts = [];
  const push = (x, y, kind, owner, size, alpha, spread) => {
    if (x < -20 || y < -20 || x > world.w + 20 || y > world.h + 20) return;
    parts.push({
      x, y, kind, owner, size, alpha,
      x0: x + gauss() * spread,
      y0: y + gauss() * spread,
      lag: rand() * 0.35
    });
  };

  // Filamentos: hilos finos que engordan al acercarse a los cúmulos
  const perFil = cfg.perFilament ?? 46;
  edges.forEach((e, ei) => {
    const a = nodes[e.a], b = nodes[e.b];
    for (let i = 0; i < perFil; i++) {
      const u = rand();
      const t = 0.5 + Math.sign(u - 0.5) * Math.pow(Math.abs(u - 0.5) * 2, 0.65) * 0.5;
      const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
      const nx = -(b.y - a.y) / e.d, ny = (b.x - a.x) / e.d;
      const sigma = 2 + 7 * Math.pow(Math.abs(2 * t - 1), 2);
      const off = gauss() * sigma;
      push(px + nx * off, py + ny * off, 'filament', ei, 0.7 + rand() * 0.8, 0.45 + rand() * 0.4, 34);
    }
  });

  // Cúmulos: el grumo dentro del cual se apiña casi todo
  nodes.forEach((n, ni) => {
    const count = Math.round((cfg.perCluster ?? 90) * (0.4 + n.mass));
    for (let i = 0; i < count; i++) {
      const r = Math.abs(gauss()) * (4 + 11 * n.mass);
      const th = rand() * Math.PI * 2;
      push(n.x + Math.cos(th) * r, n.y + Math.sin(th) * r * 0.92, 'cluster', ni,
        0.8 + rand() * 1.1, 0.5 + rand() * 0.5, 52);
    }
  });

  // Paredes: láminas tenues tendidas entre tres cúmulos
  walls.forEach((tri, wi) => {
    const [A, B, C] = tri.map((i) => nodes[i]);
    for (let i = 0; i < (cfg.perWall ?? 26); i++) {
      let u = rand(), v = rand();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      push(A.x + u * (B.x - A.x) + v * (C.x - A.x) + gauss() * 4,
        A.y + u * (B.y - A.y) + v * (C.y - A.y) + gauss() * 4,
        'wall', wi, 0.6 + rand() * 0.5, 0.16 + rand() * 0.18, 40);
    }
  });

  // Galaxias sueltas, también en mitad de los vacíos
  for (let i = 0; i < (cfg.field ?? 320); i++) {
    push(box.x + rand() * box.w, box.y + rand() * box.h, 'field', -1,
      0.6 + rand() * 0.5, 0.1 + rand() * 0.16, 18);
  }

  const blob = cfg.blobPath ? new Path2D(cfg.blobPath) : null;
  const COLOR = { cream: '239, 231, 218', blush: '242, 188, 168', coral: '232, 69, 44', soft: '255, 107, 74' };

  let t = cfg.initialTime ?? 1;
  let scale = 1;
  let hovered = -1;
  let layers = { clusters: true, filaments: true, walls: true, voids: true };
  let onScreen = true;

  /* ---- rótulos de los vacíos, en el SVG de encima ---- */

  if (overlay) {
    overlay.setAttribute('viewBox', `0 0 ${world.w} ${world.h}`);
    voids.forEach((v) => {
      v.ring = svgEl('circle', { class: 'void-ring', cx: v.x.toFixed(1), cy: v.y.toFixed(1), r: (v.r * 0.82).toFixed(1) });
      v.tag = Object.assign(svgEl('text', { class: 'void-tag', x: v.x.toFixed(1), y: (v.y + 4).toFixed(1), 'text-anchor': 'middle' }),
        { textContent: 'VACÍO' });
      overlay.appendChild(v.ring);
      overlay.appendChild(v.tag);
    });
  }

  /* ---- dibujo ---- */

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    scale = rect.width / world.w;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  }

  const ease = (p) => p * p * (3 - 2 * p);

  function draw() {
    ctx.clearRect(0, 0, world.w, world.h);

    if (blob) {
      ctx.fillStyle = 'rgba(239, 231, 218, 0.05)';
      ctx.fill(blob);
    }

    // Halo suave alrededor de cada cúmulo, para que los nodos pesen
    if (layers.clusters) {
      nodes.forEach((n, ni) => {
        const r = (10 + n.mass * 26) * (0.35 + 0.65 * t);
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
        const lit = hovered === ni;
        g.addColorStop(0, `rgba(${lit ? COLOR.coral : '43, 47, 140'}, ${(0.5 * t).toFixed(2)})`);
        g.addColorStop(1, 'rgba(43, 47, 140, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const litEdges = hovered < 0 ? null
      : new Set(edges.map((e, i) => (e.a === hovered || e.b === hovered ? i : -1)).filter((i) => i >= 0));

    for (const p of parts) {
      if (p.kind === 'cluster' && !layers.clusters) continue;
      if (p.kind === 'filament' && !layers.filaments) continue;
      if (p.kind === 'wall' && !layers.walls) continue;

      const k = ease(Math.max(0, Math.min(1, (t - p.lag) / (1 - p.lag))));
      const x = p.x0 + (p.x - p.x0) * k;
      const y = p.y0 + (p.y - p.y0) * k;

      let color = COLOR.cream, alpha = p.alpha * (0.35 + 0.65 * t);
      if (p.kind === 'wall') color = COLOR.blush;
      if (p.kind === 'cluster') color = t > 0.6 ? COLOR.blush : COLOR.cream;
      if (hovered >= 0) {
        const mine = (p.kind === 'cluster' && p.owner === hovered) || (p.kind === 'filament' && litEdges.has(p.owner));
        if (mine) { color = COLOR.soft; alpha = Math.min(1, alpha * 2.2); }
        else alpha *= 0.45;
      }

      ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(2)})`;
      const s = p.size * (p.kind === 'cluster' ? 0.8 + 0.5 * t : 1);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }

    if (overlay) {
      const show = layers.voids ? Math.max(0, (t - 0.45) / 0.55) : 0;
      voids.forEach((v) => {
        v.ring.style.opacity = show.toFixed(2);
        v.tag.style.opacity = show.toFixed(2);
      });
    }
  }

  /* ---- interacción: el cúmulo más cercano al puntero ---- */

  if (cfg.interactive !== false) {
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * world.w;
      const y = (e.clientY - rect.top) / rect.height * world.h;
      let best = -1, bestD = 46;
      nodes.forEach((n, i) => {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== hovered) {
        hovered = best;
        draw();
        cfg.onHover?.(best, best < 0 ? 0 : edges.filter((ed) => ed.a === best || ed.b === best).length);
      }
    });
    canvas.addEventListener('pointerleave', () => {
      hovered = -1;
      draw();
      cfg.onHover?.(-1, 0);
    });
  }

  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(canvas);
  // El tamaño real depende del ancho de la columna, no solo de la ventana
  new ResizeObserver(() => { resize(); draw(); }).observe(canvas);
  resize();
  draw();

  return {
    setTime(v) { t = v; draw(); },
    getTime() { return t; },
    setLayer(name, on) { layers[name] = on; draw(); },
    redraw: draw,
    isOnScreen: () => onScreen,
    stats: { clusters: nodes.length, filaments: edges.length, walls: walls.length, galaxies: parts.length, voids }
  };
}

/* ---------------- Montaje en la portada ---------------- */

function initWebScene() {
  const canvas = document.getElementById('webCanvas');
  if (!canvas) return;

  const slider = document.getElementById('webTime');
  const age = document.getElementById('webAge');
  const play = document.getElementById('webPlay');
  const readout = document.getElementById('webReadout');

  const web = createWebField({
    canvas,
    overlay: document.getElementById('webArt'),
    world: { w: 600, h: 420, margin: 46 },
    clusters: 52, minDist: 42, linkDist: 112,
    perFilament: 52, perCluster: 95, perWall: 30, field: 360,
    blobPath: 'M40 220C20 130 130 50 260 70s260-40 290 60-40 150-10 210-180 70-300 50S60 310 40 220Z',
    seed: 23,
    onHover(i, links) {
      readout.textContent = i < 0
        ? base
        : `${links} ${links === 1 ? 'filamento sale' : 'filamentos salen'} de este cúmulo`;
    }
  });

  const s = web.stats;
  const base = `${s.galaxies.toLocaleString('es-ES')} galaxias · ${s.clusters} cúmulos · ${s.filaments} filamentos`;

  function setTime(v) {
    web.setTime(v);
    const gyr = 0.3 + 13.5 * Math.pow(v, 2.2);
    age.textContent = v > 0.985
      ? 'hoy · 13 800 millones de años'
      : `≈ ${Math.round(gyr * 100) * 10} millones de años`;
  }

  slider.addEventListener('input', () => setTime(+slider.value / 100));

  let playing = false;
  function parar() {
    playing = false;
    play.setAttribute('aria-pressed', 'false');
    play.textContent = 'REPRODUCIR';
  }

  play.addEventListener('click', () => {
    if (playing) { parar(); return; }
    playing = true;
    play.setAttribute('aria-pressed', 'true');
    play.textContent = 'DETENER';
    const t0 = performance.now();
    (function step(now) {
      if (!playing) return;
      const p = Math.min(1, (now - t0) / 9000);
      slider.value = Math.round(p * 100);
      setTime(p);
      if (p < 1) requestAnimationFrame(step); else parar();
    })(performance.now());
  });

  readout.textContent = base;
  setTime(+slider.value / 100);
}

document.addEventListener('DOMContentLoaded', () => arranca('red cósmica', initWebScene));
