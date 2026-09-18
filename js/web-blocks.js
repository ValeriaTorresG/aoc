/* ============================================================
   El arte del cosmos — piezas interactivas de red-cosmica.html
     01 anatomía de la red: cúmulos, filamentos, paredes y vacíos
     02 las semillas del fondo cósmico amplificadas por la gravedad
     03 un sondeo de corrimiento al rojo dibujado por ti
     04 dónde estamos: de la Vía Láctea a Laniakea
   Depende de js/common.js (svgEl, rampColor, reduceMotion) y de
   js/web.js (webRandom, seedClusters, largestVoid).
   ============================================================ */

const MLY_PER_PX = 1.15;          // escala de las figuras 01 y 03
const stxtWeb = (attrs, content) => Object.assign(svgEl('text', attrs), { textContent: content });

/* ============================================================
   01 · ANATOMÍA DE LA RED
   El mismo campo de galaxias de la portada, con las cuatro
   estructuras que lo componen encendiéndose por separado.
   ============================================================ */

function initAnatomyLab() {
  const canvas = document.getElementById('anatomyCanvas');
  if (!canvas) return;

  const readout = document.getElementById('anatomyReadout');
  let base = '';

  const web = createWebField({
    canvas,
    overlay: document.getElementById('anatomySvg'),
    world: { w: 600, h: 300, margin: 34 },
    clusters: 40, minDist: 40, linkDist: 108,
    perFilament: 46, perCluster: 85, perWall: 34, field: 260,
    seed: 71,
    onHover(i, links) {
      readout.textContent = i < 0 ? base
        : `De este cúmulo salen ${links} ${links === 1 ? 'filamento' : 'filamentos'}`;
    }
  });

  const s = web.stats;
  const mayor = s.voids.length ? Math.round(s.voids[0].r * 1.64 * MLY_PER_PX / 10) * 10 : 0;
  base = `${s.galaxies.toLocaleString('es-ES')} galaxias · ${s.clusters} cúmulos · ${s.filaments} filamentos · `
    + `${s.walls} paredes · el vacío mayor mide unos ${mayor} millones de años luz`;
  readout.textContent = base;

  document.querySelectorAll('[data-layer]').forEach((btn) => {
    const capa = btn.dataset.layer === 'clusters' ? 'clusters'
      : btn.dataset.layer === 'filaments' ? 'filaments'
      : btn.dataset.layer === 'walls' ? 'walls' : 'voids';
    web.setLayer(capa, btn.getAttribute('aria-pressed') === 'true');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      web.setLayer(capa, on);
    });
  });
}

/* La figura de la cabecera: el mismo campo, quieto y sin controles */
function initWebHero() {
  const canvas = document.getElementById('webHeroCanvas');
  if (!canvas) return;
  createWebField({
    canvas,
    overlay: document.getElementById('webHeroSvg'),
    world: { w: 600, h: 340, margin: 30 },
    clusters: 44, minDist: 38, linkDist: 104,
    perFilament: 44, perCluster: 80, perWall: 30, field: 280,
    seed: 909,
    interactive: false
  });
}

/* ============================================================
   02 · LAS SEMILLAS DEL FONDO CÓSMICO
   ============================================================ */

function initSeedLab() {
  const svg = document.getElementById('labSeeds');
  if (!svg) return;

  const COLS = 40, ROWS = 20, CELL = 14;
  const X0 = (600 - COLS * CELL) / 2, Y0 = 18;
  const rand = webRandom(137);

  /* Campo suave: unas pocas ondas planas superpuestas, como las del universo primitivo */
  const waves = Array.from({ length: 7 }, () => ({
    kx: (rand() - 0.5) * 1.1,
    ky: (rand() - 0.5) * 1.1,
    ph: rand() * Math.PI * 2
  }));

  const cells = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      let v = 0;
      waves.forEach((w) => { v += Math.sin(i * w.kx + j * w.ky + w.ph); });
      v /= waves.length;
      const rect = svgEl('rect', { class: 'seed-cell', x: X0 + i * CELL, y: Y0 + j * CELL, width: CELL, height: CELL });
      svg.appendChild(rect);
      cells.push({ v, rect });
    }
  }

  const RAMP = [
    [0.00, [7, 8, 25]],
    [0.45, [30, 34, 112]],
    [0.72, [242, 188, 168]],
    [1.00, [232, 69, 44]]
  ];

  const slider = document.getElementById('seedContrast');
  const grow = document.getElementById('seedGrow');
  const readout = document.getElementById('seedReadout');

  let g = 0;     // cuánto ha actuado la gravedad

  function paint() {
    const amp = +slider.value / 20;
    cells.forEach((c) => {
      const d = Math.tanh(c.v * amp * (1 + 7 * g));
      c.rect.style.fill = rampColor(RAMP, 0.5 + 0.5 * d);
    });
    readout.textContent = g < 0.02
      ? `Contraste amplificado ×${Math.round(+slider.value)} · en el fondo cósmico real las diferencias son de 1 parte en 100 000`
      : `La gravedad ha trabajado un ${Math.round(g * 100)} % · los picos se vuelven cúmulos y los huecos, vacíos`;
  }

  slider.addEventListener('input', paint);

  let animating = false;
  grow.addEventListener('click', () => {
    if (animating) return;
    animating = true;
    const to = g > 0.5 ? 0 : 1, from = g, t0 = performance.now();
    let lastPaint = 0;
    (function step(now) {
      const p = Math.min(1, (now - t0) / 3200);
      g = from + (to - from) * (1 - Math.pow(1 - p, 2));
      if (now - lastPaint > 32 || p === 1) { paint(); lastPaint = now; }
      if (p < 1) requestAnimationFrame(step);
      else {
        animating = false;
        grow.textContent = g > 0.5 ? 'VOLVER AL PRINCIPIO' : 'DEJAR ACTUAR A LA GRAVEDAD';
      }
    })(performance.now());
  });

  paint();
}


/* ============================================================
   03 · EL CORRIMIENTO AL ROJO
   Las mismas líneas del espectro, estiradas por la expansión.
   ============================================================ */

function initRedshiftLab() {
  const svg = document.getElementById('labRedshift');
  if (!svg) return;

  const NM0 = 350, NM1 = 950;
  const plot = { x: 48, y: 0, w: 424 };
  const X = (nm) => plot.x + plot.w * (nm - NM0) / (NM1 - NM0);
  const C = 299792;          // km/s
  const H0 = 70;             // km/s por megapársec
  const MLY_PER_MPC = 3.262;

  /* Líneas de absorción con su longitud de onda en reposo */
  const LINES = [
    { nm: 393.4, name: 'Ca II' },
    { nm: 410.2, name: 'Hδ' },
    { nm: 434.0, name: 'Hγ' },
    { nm: 486.1, name: 'Hβ' },
    { nm: 518.4, name: 'Mg' },
    { nm: 589.3, name: 'Na' },
    { nm: 656.3, name: 'Hα' }
  ];

  /* Dos espectros: el del laboratorio arriba y el de la galaxia abajo */
  function band(y, h) {
    const g = svgEl('g', { class: 'spec-bar' });
    g.appendChild(svgEl('rect', { class: 'band-outside', x: X(NM0), y, width: X(NM1) - X(NM0), height: h }));
    for (let nm = 380; nm < 750; nm += 5) {
      g.appendChild(svgEl('rect', {
        x: X(nm), y, width: X(nm + 5) - X(nm) + 0.6, height: h,
        fill: wavelengthRGB(nm), opacity: 0.55
      }));
    }
    svg.appendChild(g);
    return g;
  }

  const TOP = 56, BOT = 150, H = 30;
  band(TOP, H);
  band(BOT, H);

  svg.appendChild(stxtWeb({ class: 'axis-label', x: X(NM0), y: TOP - 10, 'text-anchor': 'start' }, 'EN EL LABORATORIO'));
  svg.appendChild(stxtWeb({ class: 'axis-label', x: X(NM0), y: BOT - 10, 'text-anchor': 'start' }, 'LA MISMA GALAXIA, VISTA DESDE AQUÍ'));
  svg.appendChild(stxtWeb({ class: 'axis-label plot-label', x: X(365), y: TOP + H + 18, 'text-anchor': 'start' }, 'UV'));
  svg.appendChild(stxtWeb({ class: 'axis-label plot-label', x: X(860), y: BOT + H + 18 }, 'INFRARROJO'));

  const restG = svgEl('g', { class: 'spec-lines' });
  const obsG = svgEl('g', { class: 'spec-lines' });
  const linkG = svgEl('g', { class: 'spec-links' });
  svg.appendChild(linkG);
  svg.appendChild(restG);
  svg.appendChild(obsG);

  LINES.forEach((l) => {
    restG.appendChild(svgEl('line', { class: 'spec-line', x1: X(l.nm), x2: X(l.nm), y1: TOP, y2: TOP + H }));
    l.obs = svgEl('line', { class: 'spec-line', y1: BOT, y2: BOT + H });
    l.link = svgEl('line', { class: 'spec-link', y1: TOP + H, y2: BOT });
    l.tag = stxtWeb({ class: 'spec-label', 'text-anchor': 'middle', y: BOT + H + 16 }, l.name);
    obsG.appendChild(l.obs);
    linkG.appendChild(l.link);
    obsG.appendChild(l.tag);
  });

  /* La galaxia, con el color que le queda al llegar */
  const disc = svgEl('ellipse', { class: 'redshift-galaxy', cx: 528, cy: 200, rx: 46, ry: 30 });
  svg.appendChild(disc);

  const slider = document.getElementById('redshiftZ');
  const play = document.getElementById('redshiftPlay');
  const readout = document.getElementById('redshiftReadout');

  function render() {
    const z = +slider.value / 1000;
    LINES.forEach((l) => {
      const x = X(Math.min(NM1, l.nm * (1 + z)));
      l.obs.setAttribute('x1', x); l.obs.setAttribute('x2', x);
      l.link.setAttribute('x1', X(l.nm)); l.link.setAttribute('x2', x);
      l.tag.setAttribute('x', x);
    });

    // El color observado se enfría como 1/(1+z): por eso lo lejano se ve más rojo
    disc.style.fill = starColor(Math.max(2500, 5800 / (1 + z)));

    const v = C * z;
    const dMpc = v / H0;
    const mly = Math.abs(dMpc * MLY_PER_MPC);
    readout.textContent = z < 0
      ? `z = ${z.toFixed(3).replace('.', ',')} · corrida hacia el azul: se acerca a ${Math.round(-v)} km/s. `
        + 'Está tan cerca que su caída hacia nosotros gana a la expansión.'
      : `z = ${z.toFixed(3).replace('.', ',')} · la luz llega estirada un ${(z * 100).toFixed(1).replace('.', ',')} % · `
        + `se aleja a ${Math.round(v).toLocaleString('es-ES')} km/s · a unos ${Math.round(mly).toLocaleString('es-ES')} millones de años luz`;
  }

  slider.addEventListener('input', render);

  document.querySelectorAll('[data-z]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const from = +slider.value, to = +btn.dataset.z, t0 = performance.now();
      (function step(now) {
        const p = Math.min(1, (now - t0) / 800);
        slider.value = from + (to - from) * (1 - Math.pow(1 - p, 3));
        render();
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  });

  play.addEventListener('click', () => {
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / 6000);
      slider.value = -2 + 162 * p;
      render();
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  });

  render();
}

/* ============================================================
   04 · EL SONDEO
   ============================================================ */

function initSurveyLab() {
  const svg = document.getElementById('labSurvey');
  if (!svg) return;

  const OX = 300, OY = 282, RMAX = 246, SPREAD = 58 * Math.PI / 180;
  const rand = webRandom(211);

  /* Densidad con dos paredes y un vacío: lo que hizo famoso al sondeo del CfA */
  const density = (r, th) => {
    let d = 0.25;
    d += 0.9 * Math.exp(-Math.pow((r - 112) / 14, 2));
    d += 0.7 * Math.exp(-Math.pow((r - 186) / 12, 2)) * (0.4 + 0.6 * Math.cos(th * 2.5));
    d -= 0.22 * Math.exp(-Math.pow((r - 150) / 26, 2));
    return Math.max(0.02, d);
  };

  const galaxies = [];
  let guard = 0;
  while (galaxies.length < 1200 && guard++ < 60000) {
    const th = (rand() - 0.5) * 2 * SPREAD;
    const r = 26 + rand() * (RMAX - 26);
    if (rand() > density(r, th)) continue;
    galaxies.push({
      th, r,
      x: OX + Math.sin(th) * r,
      y: OY - Math.cos(th) * r,
      seen: false
    });
  }

  const wedge = svgEl('path', {
    class: 'wedge',
    d: `M${OX} ${OY} L${OX + Math.sin(-SPREAD) * RMAX} ${OY - Math.cos(-SPREAD) * RMAX} `
     + `A${RMAX} ${RMAX} 0 0 1 ${OX + Math.sin(SPREAD) * RMAX} ${OY - Math.cos(SPREAD) * RMAX} Z`
  });
  svg.appendChild(wedge);

  const gG = svgEl('g', { class: 'survey-galaxies' });
  galaxies.forEach((g) => {
    g.el = svgEl('circle', { class: 'survey-galaxy', cx: g.x.toFixed(1), cy: g.y.toFixed(1), r: 1.5 });
    gG.appendChild(g.el);
  });
  svg.appendChild(gG);

  const beam = svgEl('line', { class: 'survey-beam', x1: OX, y1: OY, x2: OX, y2: OY - RMAX });
  svg.appendChild(beam);
  svg.appendChild(svgEl('circle', { class: 'survey-eye', cx: OX, cy: OY, r: 6 }));
  svg.appendChild(stxtWeb({ class: 'axis-label', x: OX, y: OY + 18, 'text-anchor': 'middle' }, 'NOSOTROS'));
  svg.appendChild(stxtWeb({ class: 'axis-label plot-label', x: 560, y: 40, 'text-anchor': 'end' }, 'DISTANCIA →'));

  const slider = document.getElementById('surveyAngle');
  const sweep = document.getElementById('surveySweep');
  const readout = document.getElementById('surveyReadout');
  let seen = 0;

  function observe(frac) {
    const th = (frac - 0.5) * 2 * SPREAD;
    beam.setAttribute('x2', OX + Math.sin(th) * RMAX);
    beam.setAttribute('y2', OY - Math.cos(th) * RMAX);

    galaxies.forEach((g) => {
      if (g.seen || Math.abs(g.th - th) > 0.035) return;
      g.seen = true;
      seen++;
      g.el.classList.add('is-seen');
    });

    readout.textContent = `${seen} galaxias observadas`
      + (seen > 420 ? ' · empieza a verse una pared, y un hueco detrás' : ' · sigue barriendo el cielo');
  }

  slider.addEventListener('input', () => observe(+slider.value / 100));

  sweep.addEventListener('click', () => {
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / 4200);
      slider.value = Math.round(p * 100);
      observe(p);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  });

  observe(0.5);
}

/* ============================================================
   05 · DÓNDE ESTAMOS
   ============================================================ */

function initAddressLab() {
  const svg = document.getElementById('labAddress');
  if (!svg) return;

  const CX = 300, CY = 150, MAXPX = 130;
  const rand = webRandom(307);

  /* Radio de la vista en millones de años luz para cada nivel */
  const LEVELS = [
    { name: 'La Vía Láctea', half: 0.16, note: '100 000 años luz de punta a punta' },
    { name: 'El Grupo Local', half: 4, note: 'la Vía Láctea, Andrómeda y unas 80 galaxias más' },
    { name: 'El Cúmulo de Virgo', half: 70, note: 'más de mil galaxias, y nosotros cayendo hacia ellas' },
    { name: 'Laniakea', half: 270, note: '520 millones de años luz, definidos por hacia dónde fluye todo' }
  ];

  /* Objetos con su distancia real, en millones de años luz */
  const objects = [
    { r: 0, th: 0, size: 7, cls: 'home', label: 'VÍA LÁCTEA' },
    { r: 2.5, th: 0.9, size: 5, cls: 'major', label: 'ANDRÓMEDA' },
    { r: 3.0, th: 2.4, size: 3, cls: 'minor', label: '' },
    ...Array.from({ length: 16 }, () => ({ r: 0.3 + rand() * 3.4, th: rand() * 6.28, size: 1.6, cls: 'minor', label: '' })),
    { r: 54, th: 2.1, size: 6, cls: 'major', label: 'VIRGO' },
    ...Array.from({ length: 40 }, () => {
      const rr = 54 + (rand() - 0.5) * 26;
      return { r: Math.abs(rr), th: 2.1 + (rand() - 0.5) * 0.5, size: 1.8, cls: 'minor', label: '' };
    }),
    ...Array.from({ length: 70 }, () => ({ r: 8 + rand() * 240, th: rand() * 6.28, size: 1.6, cls: 'far', label: '' })),
    { r: 250, th: 3.9, size: 8, cls: 'attractor', label: 'GRAN ATRACTOR' }
  ];

  objects.forEach((o) => {
    o.el = svgEl('circle', { class: `addr-dot addr-dot--${o.cls}` });
    svg.appendChild(o.el);
    if (o.label) {
      o.tag = stxtWeb({ class: 'addr-tag', 'text-anchor': 'middle' }, o.label);
      svg.appendChild(o.tag);
    }
  });

  const flow = svgEl('g', { class: 'addr-flow' });
  for (let i = 0; i < 14; i++) {
    const th = (i / 14) * Math.PI * 2;
    flow.appendChild(svgEl('path', { class: 'flow-arrow', 'data-th': th }));
  }
  svg.appendChild(flow);

  const ring = svgEl('circle', { class: 'addr-ring', cx: CX, cy: CY });
  svg.appendChild(ring);
  const levelTag = stxtWeb({ class: 'addr-level', x: 24, y: 34 }, '');
  svg.appendChild(levelTag);

  const prev = document.getElementById('addressPrev');
  const next = document.getElementById('addressNext');
  const readout = document.getElementById('addressReadout');

  let index = 0;
  let half = LEVELS[0].half;

  function paint() {
    const k = MAXPX / half;
    objects.forEach((o) => {
      const x = CX + Math.cos(o.th) * o.r * k;
      const y = CY + Math.sin(o.th) * o.r * k * 0.88;
      o.el.setAttribute('cx', x.toFixed(1));
      o.el.setAttribute('cy', y.toFixed(1));
      o.el.setAttribute('r', Math.max(1.2, o.size * (o.cls === 'home' ? Math.min(2.2, 0.4 + 12 / half) : 1)).toFixed(1));
      const visible = Math.abs(x - CX) < 300 && Math.abs(y - CY) < 150;
      o.el.style.opacity = visible ? '' : 0;
      if (o.tag) {
        o.tag.setAttribute('x', x.toFixed(1));
        o.tag.setAttribute('y', (y - 12).toFixed(1));
        o.tag.style.opacity = visible && o.r * k > 8 || o.cls === 'home' ? 1 : 0;
      }
    });

    ring.setAttribute('r', MAXPX * 0.92);
    flow.style.opacity = index === 3 ? 1 : 0;
    const arrowTh = 3.9;
    flow.querySelectorAll('.flow-arrow').forEach((a) => {
      const th = +a.dataset.th;
      const r0 = MAXPX * 0.86, r1 = MAXPX * 0.62;
      const bend = 0.35 * Math.sin(arrowTh - th);
      a.setAttribute('d',
        `M${CX + Math.cos(th) * r0} ${CY + Math.sin(th) * r0 * 0.88} `
        + `Q${CX + Math.cos(th + bend) * r1 * 1.1} ${CY + Math.sin(th + bend) * r1 * 0.88} `
        + `${CX + Math.cos(th + bend * 1.6) * r1} ${CY + Math.sin(th + bend * 1.6) * r1 * 0.88}`);
    });
  }

  function goTo(i) {
    index = Math.max(0, Math.min(LEVELS.length - 1, i));
    const level = LEVELS[index];
    levelTag.textContent = level.name.toUpperCase();
    readout.textContent = `${level.name} · ${level.note}`;
    prev.disabled = index === 0;
    next.disabled = index === LEVELS.length - 1;

    const from = half, to = level.half, t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      // Interpolación logarítmica: el zoom se siente constante
      half = Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * eased);
      paint();
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  prev.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));
  goTo(0);
}

document.addEventListener('DOMContentLoaded', () => {
  arranca('WebHero', initWebHero);
  arranca('AnatomyLab', initAnatomyLab);
  arranca('SeedLab', initSeedLab);
  arranca('RedshiftLab', initRedshiftLab);
  arranca('SurveyLab', initSurveyLab);
  arranca('AddressLab', initAddressLab);
});
