/* ============================================================
   El arte del cosmos — piezas interactivas de planetas.html
     01 los tres requisitos de la UAI, probados con un cuerpo real
     02 las tres leyes de Kepler, con las áreas medidas
     03 la línea de nieve: dónde se forma roca y dónde gas
     04 cómo se caza un exoplaneta: tránsito y velocidad radial
   Depende de js/common.js (svgEl, rampColor, reduceMotion) y de
   js/planets.js (solveKepler, orbitPoint).
   ============================================================ */

const ptxt = (attrs, content) => Object.assign(svgEl('text', attrs), { textContent: content });
const smooth = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

/* 1,3 × 10²² kg */
const SUPS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function kgLabel(kg) {
  const exp = Math.floor(Math.log10(kg));
  const mant = (kg / Math.pow(10, exp)).toFixed(1).replace('.', ',');
  return `${mant} × 10${String(exp).split('').map((d) => SUPS[d]).join('')} kg`;
}

/* ============================================================
   01 · QUÉ CUENTA COMO PLANETA
   ============================================================ */

function initDefinitionLab() {
  const svg = document.getElementById('labDefinition');
  if (!svg) return;

  const CX = 165, CY = 140;
  const ROUND_KG = 21.0;     // log₁₀ de la masa a la que un cuerpo rocoso se vuelve esférico
  const CLEAR_KG = 23.0;     // log₁₀ a la que domina su zona orbital

  /* Zona orbital con escombros */
  const debrisG = svgEl('g', { class: 'debris' });
  const debris = [];
  const rnd = (() => { let s = 5; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
  for (let i = 0; i < 70; i++) {
    const th = rnd() * Math.PI * 2;
    const rr = 108 + (rnd() - 0.5) * 42;
    const el = svgEl('circle', { class: 'debris-dot', cx: CX + Math.cos(th) * rr, cy: CY + Math.sin(th) * rr * 0.42, r: (rnd() * 1.8 + 0.8).toFixed(1) });
    debrisG.appendChild(el);
    debris.push(el);
  }
  svg.appendChild(svgEl('ellipse', { class: 'ring orbit-path', cx: CX, cy: CY, rx: 108, ry: 45 }));
  svg.appendChild(debrisG);

  const body = svgEl('polygon', { class: 'def-body' });
  svg.appendChild(body);
  const star = svgEl('circle', { class: 'sun', cx: CX, cy: CY, r: 12 });
  svg.appendChild(star);

  /* Los tres requisitos, como una lista que se va marcando */
  const CRITERIA = [
    { key: 'orbits', label: 'Orbita una estrella' },
    { key: 'round', label: 'Su gravedad la ha hecho redonda' },
    { key: 'clear', label: 'Ha despejado su órbita' }
  ];
  CRITERIA.forEach((c, i) => {
    const y = 70 + i * 52;
    c.mark = ptxt({ class: 'check', x: 342, y }, '·');
    c.txt = ptxt({ class: 'check-label', x: 372, y }, c.label);
    svg.appendChild(c.mark);
    svg.appendChild(c.txt);
  });
  const verdict = ptxt({ class: 'addr-level', x: 342, y: 246 }, '');
  svg.appendChild(verdict);

  const slider = document.getElementById('defMass');
  const readout = document.getElementById('defReadout');
  let orbitsStar = true;
  let name = '';

  function render() {
    const lg = +slider.value / 10;                 // log₁₀ de la masa en kg
    const mass = Math.pow(10, lg);
    const round = smooth(lg, ROUND_KG - 0.6, ROUND_KG + 0.4);
    const clear = smooth(lg, CLEAR_KG - 0.5, CLEAR_KG + 0.3);

    // De patata a esfera: el radio deja de tener baches cuando la gravedad gana
    const R = 12 + 26 * smooth(lg, 18, 25);
    const pts = [];
    for (let i = 0; i < 26; i++) {
      const th = (i / 26) * Math.PI * 2;
      const bump = 1 + (1 - round) * 0.38 * Math.sin(th * 3.7 + 1.2) * Math.cos(th * 2.1);
      pts.push(`${(CX + Math.cos(th) * R * bump).toFixed(1)},${(CY + Math.sin(th) * R * bump).toFixed(1)}`);
    }
    body.setAttribute('points', pts.join(' '));

    debris.forEach((d, i) => { d.style.opacity = (1 - clear) * (0.35 + (i % 5) * 0.12); });

    const state = { orbits: orbitsStar, round: round > 0.5, clear: clear > 0.5 };
    CRITERIA.forEach((c) => {
      const ok = state[c.key];
      c.mark.textContent = ok ? '✓' : '✕';
      c.mark.setAttribute('class', `check ${ok ? 'is-yes' : 'is-no'}`);
      c.txt.setAttribute('class', `check-label ${ok ? '' : 'is-off'}`);
    });

    const v = !state.orbits ? 'SATÉLITE'
      : state.round && state.clear ? 'PLANETA'
      : state.round ? 'PLANETA ENANO'
      : 'CUERPO MENOR';
    verdict.textContent = v;
    verdict.setAttribute('class', `addr-level ${v === 'PLANETA' ? 'is-planet' : ''}`);

    readout.textContent = `${name ? name + ' · ' : ''}${kgLabel(mass)} · ${v.toLowerCase()}`
      + (v === 'PLANETA ENANO' ? ' — es redondo, pero comparte su órbita con miles de cuerpos' : '');
  }

  document.querySelectorAll('[data-body]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [kg, isMoon, label] = btn.dataset.body.split('|');
      orbitsStar = isMoon !== '1';
      name = label;
      slider.value = Math.round(Math.log10(+kg) * 10);
      render();
    });
  });
  slider.addEventListener('input', () => { orbitsStar = true; name = ''; render(); });
  render();
}

/* ============================================================
   02 · LAS LEYES DE KEPLER, CON LAS ÁREAS MEDIDAS
   ============================================================ */

function initKeplerLab() {
  const svg = document.getElementById('labKepler');
  if (!svg) return;

  const CX = 290, CY = 150, A = 190;

  const orbit = svgEl('ellipse', { class: 'ring orbit-path', cy: CY, rx: A });
  const sweep = svgEl('path', { class: 'sweep' });
  const sweepPrev = svgEl('path', { class: 'sweep sweep--prev' });
  const radius = svgEl('line', { class: 'radius-vector', x1: CX, y1: CY });
  const star = svgEl('circle', { class: 'sun', cx: CX, cy: CY, r: 15 });
  const planet = svgEl('circle', { class: 'planet planet--blush', r: 8 });
  [orbit, sweepPrev, sweep, radius, star, planet].forEach((el) => svg.appendChild(el));

  const areaTag = ptxt({ class: 'peak-tag', 'text-anchor': 'middle' }, '');
  svg.appendChild(areaTag);
  svg.appendChild(ptxt({ class: 'axis-label', x: CX, y: 286, 'text-anchor': 'middle' }, 'CADA SECTOR SE BARRE EN EL MISMO TIEMPO'));

  const slider = document.getElementById('keplerEcc');
  const readout = document.getElementById('keplerReadout');

  let e = 0.5, t = 0, poly = [], prevPoly = [], prevArea = 0;
  const SECTOR = 1 / 8;                  // cada sector dura un octavo del periodo

  function shoelace(points) {
    let s = 0;
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      s += x1 * y2 - x2 * y1;
    }
    return Math.abs(s) / 2;
  }

  function setEcc() {
    e = +slider.value / 100;
    const b = A * Math.sqrt(1 - e * e);
    orbit.setAttribute('cx', CX - A * e);
    orbit.setAttribute('ry', b);
    poly = []; prevPoly = []; prevArea = 0; t = 0;
  }

  function frame() {
    const M = (t % 1) * 2 * Math.PI;
    const E = solveKepler(M, e);
    const p = orbitPoint(A, e, E, 0);
    const x = CX + p.x, y = CY + p.y;
    planet.setAttribute('cx', x.toFixed(1));
    planet.setAttribute('cy', y.toFixed(1));
    radius.setAttribute('x2', x.toFixed(1));
    radius.setAttribute('y2', y.toFixed(1));

    poly.push([x, y]);
    const toPath = (pts) => pts.length < 2 ? '' : `M${CX} ${CY} ` + pts.map(([px, py]) => `L${px.toFixed(1)} ${py.toFixed(1)}`).join(' ') + ' Z';
    sweep.setAttribute('d', toPath(poly));
    sweepPrev.setAttribute('d', toPath(prevPoly));

    if ((t % 1) % SECTOR < 0.0001 || poly.length > 4000) { /* nada: el corte va abajo */ }

    const r = Math.hypot(x - CX, y - CY);
    const vRel = Math.sqrt((2 / (r / A)) - 1);          // v ∝ √(2/r − 1/a), en unidades de la velocidad media
    areaTag.setAttribute('x', x + (x > CX ? -40 : 40));
    areaTag.setAttribute('y', y - 16);
    areaTag.textContent = `${vRel.toFixed(2).replace('.', ',')}× la media`;

    const ratio = Math.sqrt((1 + e) / (1 - e));
    readout.textContent = `Excentricidad ${e.toFixed(2).replace('.', ',')} · en el perihelio va ${ratio.toFixed(2).replace('.', ',')} veces más rápido que en el afelio`
      + (prevArea ? ` · sectores medidos: ${Math.round(shoelace([[CX, CY], ...poly]))} y ${Math.round(prevArea)} px²` : '');
  }

  function closeSector() {
    if (poly.length > 3) {
      prevArea = shoelace([[CX, CY], ...poly]);
      prevPoly = poly;
    }
    poly = [];
  }

  let last = performance.now(), sectorT = 0;
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt / 9;                        // una vuelta completa en nueve segundos
    sectorT += dt / 9;
    if (sectorT >= SECTOR) { sectorT -= SECTOR; closeSector(); }
    frame();
    requestAnimationFrame(tick);
  }

  slider.addEventListener('input', setEcc);
  setEcc();
  frame();
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);
}

/* ============================================================
   03 · LA LÍNEA DE NIEVE
   ============================================================ */

function initSnowLab() {
  const svg = document.getElementById('labSnow');
  if (!svg) return;

  const CX = 300, CY = 150, PX_AU = 26;
  const RAMP = [
    [0, [232, 69, 44]], [0.45, [255, 107, 74]], [0.7, [242, 188, 168]], [1, [30, 34, 112]]
  ];

  /* Anillos del disco, coloreados por temperatura */
  const rings = [];
  for (let i = 18; i >= 1; i--) {
    const r = i * 0.6;
    const el = svgEl('ellipse', { class: 'disc-ring', cx: CX, cy: CY, rx: r * PX_AU, ry: r * PX_AU * 0.42 });
    svg.appendChild(el);
    rings.push({ r, el });
  }

  const snow = svgEl('ellipse', { class: 'snow-line', cx: CX, cy: CY });
  svg.appendChild(snow);
  const snowTag = ptxt({ class: 'peak-tag', 'text-anchor': 'middle' }, 'LÍNEA DE NIEVE');
  svg.appendChild(snowTag);
  svg.appendChild(svgEl('circle', { class: 'star-corona', cx: CX, cy: CY, r: 34 }));
  const star = svgEl('circle', { class: 'sun', cx: CX, cy: CY, r: 16 });
  svg.appendChild(star);

  /* Planetas en formación a distancias fijas */
  const SEEDS = [0.45, 0.85, 1.5, 2.6, 4.6, 8].map((au, i) => ({
    au, th: 0.5 + i * 1.05,
    el: svgEl('circle', { class: 'seed-planet' }),
    tag: ptxt({ class: 'seed-tag', 'text-anchor': 'middle' }, '')
  }));
  SEEDS.forEach((p) => { svg.appendChild(p.el); svg.appendChild(p.tag); });

  const slider = document.getElementById('snowLum');
  const readout = document.getElementById('snowReadout');

  function render() {
    const L = Math.pow(10, +slider.value / 100 * 2.3 - 1.3);        // de 0,05 a 10 soles
    const tempAt = (au) => 278 * Math.pow(L, 0.25) / Math.sqrt(au); // en kelvin
    const rSnow = Math.pow(278 / 170, 2) * Math.sqrt(L);            // donde T = 170 K

    rings.forEach(({ r, el }) => {
      const T = tempAt(r);
      el.style.stroke = rampColor(RAMP, Math.max(0, Math.min(1, 1 - (T - 60) / 540)));
    });

    snow.setAttribute('rx', rSnow * PX_AU);
    snow.setAttribute('ry', rSnow * PX_AU * 0.42);
    snowTag.setAttribute('x', CX);
    snowTag.setAttribute('y', CY - rSnow * PX_AU * 0.42 - 8);
    star.setAttribute('r', 10 + 8 * Math.pow(L, 0.15));

    let rocky = 0, giants = 0;
    SEEDS.forEach((p) => {
      const icy = p.au > rSnow;
      const size = icy ? 13 : 5.5;
      p.el.setAttribute('cx', CX + Math.cos(p.th) * p.au * PX_AU);
      p.el.setAttribute('cy', CY + Math.sin(p.th) * p.au * PX_AU * 0.42);
      p.el.setAttribute('r', size);
      p.el.setAttribute('class', `seed-planet ${icy ? 'is-giant' : 'is-rocky'}`);
      p.tag.setAttribute('x', CX + Math.cos(p.th) * p.au * PX_AU);
      p.tag.setAttribute('y', CY + Math.sin(p.th) * p.au * PX_AU * 0.42 - size - 7);
      p.tag.textContent = `${p.au} UA`;
      icy ? giants++ : rocky++;
    });

    readout.textContent = `Estrella de ${L < 1 ? L.toFixed(2).replace('.', ',') : L.toFixed(1).replace('.', ',')} soles · `
      + `línea de nieve a ${rSnow.toFixed(1).replace('.', ',')} UA (donde la temperatura cae a 170 K) · `
      + `${rocky} mundos de roca dentro, ${giants} gigantes fuera`;
  }

  slider.addEventListener('input', render);
  render();
}

/* ============================================================
   04 · CÓMO SE CAZA UN EXOPLANETA
   ============================================================ */

function initDetectionLab() {
  const svg = document.getElementById('labDetection');
  if (!svg) return;

  const R_STAR_EARTH = 109;          // radios terrestres que mide el Sol
  const SX = 170, SY = 95, SR = 58;
  const plot = { x: 60, y: 190, w: 470, h: 80 };

  const star = svgEl('circle', { class: 'star-body', cx: SX, cy: SY, r: SR });
  const planet = svgEl('circle', { class: 'transit-planet', cy: SY, r: 8 });
  const bary = svgEl('circle', { class: 'bary', cx: SX, cy: SY, r: 2.5 });
  svg.appendChild(star);
  svg.appendChild(planet);
  svg.appendChild(bary);

  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} H${plot.x + plot.w}` }));
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} V${plot.y - 10}` }));
  svg.appendChild(axes);
  const curve = svgEl('path', { class: 'curve curve--live' });
  svg.appendChild(curve);
  const yTag = ptxt({ class: 'axis-label plot-label', x: plot.x, y: plot.y - 18, 'text-anchor': 'start' }, '');
  svg.appendChild(yTag);
  svg.appendChild(ptxt({ class: 'axis-label plot-label', x: plot.x + plot.w, y: plot.y + plot.h + 22, 'text-anchor': 'end' }, 'TIEMPO →'));

  const slider = document.getElementById('detectSize');
  const btnTransit = document.getElementById('detectTransit');
  const btnRV = document.getElementById('detectRV');
  const readout = document.getElementById('detectReadout');

  let mode = 'transit', phase = 0;

  /* Masa aproximada a partir del radio, en masas terrestres */
  function massFromRadius(R) {
    if (R <= 1.6) return Math.pow(R, 3.7);
    if (R <= 4) return Math.pow(R, 2);
    return 318 * Math.pow(R / 11.2, 5);
  }

  function render() {
    const R = +slider.value / 10;                       // radios terrestres
    const depth = Math.pow(R / R_STAR_EARTH, 2);        // caída de brillo
    const M = massFromRadius(R);
    // Semiamplitud de la velocidad radial, con un periodo de 10 días
    const K = 28.4 * (M / 318) * Math.pow(0.0274, -1 / 3);

    const rPix = Math.max(2, SR * (R / R_STAR_EARTH));
    planet.setAttribute('r', rPix.toFixed(1));

    // Las caídas reales van de 84 partes por millón a un 2 %: sin escala
    // logarítmica, la de un planeta como la Tierra sería una línea recta
    const dip = Math.max(0.05, Math.min(0.92, Math.log10(depth * 1e6) / Math.log10(2e4)));
    const amp = Math.max(0.08, Math.min(0.45, 0.45 * Math.log10(K * 10 + 1) / Math.log10(4060)));

    let d = '';
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      let v;
      if (mode === 'transit') {
        // Entrada, fondo plano y salida: la forma de un tránsito de verdad
        const x = Math.abs(u - 0.5);
        const shape = x > 0.11 ? 0 : x < 0.08 ? 1 : (0.11 - x) / 0.03;
        v = 1 - dip * shape;
      } else {
        v = 0.5 + amp * Math.sin(u * Math.PI * 4);
      }
      d += `${i ? 'L' : 'M'}${(plot.x + plot.w * u).toFixed(1)} ${(plot.y + plot.h * (1 - v)).toFixed(1)}`;
    }
    curve.setAttribute('d', d);
    yTag.textContent = mode === 'transit' ? 'BRILLO DE LA ESTRELLA' : 'VELOCIDAD DE LA ESTRELLA';

    readout.textContent = mode === 'transit'
      ? `Planeta de ${R.toFixed(1).replace('.', ',')} radios terrestres · tapa el ${(depth * 100).toFixed(3).replace('.', ',')} % de la estrella `
        + `(${Math.round(depth * 1e6).toLocaleString('es-ES')} partes por millón; la Tierra vista desde fuera daría 84). `
        + 'La caída está dibujada en escala logarítmica: a escala real casi no se vería.'
      : `Ese planeta pesaría unas ${Math.round(M).toLocaleString('es-ES')} masas terrestres · `
        + `zarandea a su estrella a ±${K < 10 ? K.toFixed(2).replace('.', ',') : Math.round(K)} m/s. `
        + 'Los mejores espectrógrafos llegan hoy a unos 0,3 m/s.';
  }

  function tick() {
    phase = (phase + 0.004) % 1;
    const R = +slider.value / 10;
    const rPix = Math.max(2, SR * (R / R_STAR_EARTH));
    if (mode === 'transit') {
      planet.style.opacity = 1;
      planet.setAttribute('cx', (SX - SR * 2.2 + phase * SR * 4.4).toFixed(1));
      planet.setAttribute('cy', SY);
      star.setAttribute('cx', SX);
      star.setAttribute('cy', SY);
      bary.style.opacity = 0;
    } else {
      // Velocidad radial: la estrella describe su propia órbita alrededor del baricentro
      const amp = Math.min(16, 1 + rPix * 1.6);
      planet.style.opacity = 0.9;
      planet.setAttribute('cx', (SX - Math.cos(phase * 2 * Math.PI) * 120).toFixed(1));
      planet.setAttribute('cy', (SY - Math.sin(phase * 2 * Math.PI) * 48).toFixed(1));
      star.setAttribute('cx', (SX + Math.cos(phase * 2 * Math.PI) * amp).toFixed(1));
      star.setAttribute('cy', (SY + Math.sin(phase * 2 * Math.PI) * amp * 0.4).toFixed(1));
      bary.style.opacity = 0.9;
    }
    requestAnimationFrame(tick);
  }

  function setMode(next) {
    mode = next;
    btnTransit.setAttribute('aria-pressed', String(mode === 'transit'));
    btnRV.setAttribute('aria-pressed', String(mode === 'rv'));
    render();
  }

  slider.addEventListener('input', render);
  btnTransit.addEventListener('click', () => setMode('transit'));
  btnRV.addEventListener('click', () => setMode('rv'));

  setMode('transit');
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => {
  arranca('DefinitionLab', initDefinitionLab);
  arranca('KeplerLab', initKeplerLab);
  arranca('SnowLab', initSnowLab);
  arranca('DetectionLab', initDetectionLab);
});
