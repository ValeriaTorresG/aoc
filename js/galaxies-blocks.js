/* ============================================================
   El arte del cosmos — piezas interactivas de galaxias.html
     01 el mapa de nuestra casa, con el Sol dando vueltas
     02 la secuencia de Hubble como un solo objeto que se deforma
     03 la órbita de S2: ajusta la masa de Sagitario A*
     04 la colisión con Andrómeda, integrada de verdad
   Depende de js/common.js (svgEl, reduceMotion) y de js/galaxies.js
   (galRandom, galOmega).
   ============================================================ */

const gtxt = (attrs, content) => Object.assign(svgEl('text', attrs), { textContent: content });

/* ============================================================
   01 · NUESTRA CASA
   ============================================================ */

function initHomeLab() {
  const svg = document.getElementById('labHome');
  if (!svg) return;

  const CX = 300, CY = 150, PX = 8.2, PITCH = 0.36;   // px por kpc
  const rand = galRandom(97);
  const tilt = svgEl('g', { class: 'galaxy-tilt' });
  svg.appendChild(tilt);

  tilt.appendChild(svgEl('ellipse', { class: 'galaxy-disc', cx: CX, cy: CY, rx: 16 * PX, ry: 16 * PX }));

  /* Cuatro brazos con nombre, más el nuestro */
  const ARMS = [
    { name: 'ESCUDO-CENTAURO', off: 0 },
    { name: 'PERSEO', off: Math.PI },
    { name: 'SAGITARIO', off: Math.PI * 0.55 },
    { name: 'NORMA', off: Math.PI * 1.55 }
  ];

  ARMS.forEach((arm) => {
    let d = '';
    for (let i = 0; i <= 30; i++) {
      const r = 3 + 12 * (i / 30);
      const th = Math.log(r / 3) / PITCH + arm.off;
      d += `${i ? 'L' : 'M'}${(CX + Math.cos(th) * r * PX).toFixed(1)} ${(CY + Math.sin(th) * r * PX).toFixed(1)}`;
    }
    arm.el = svgEl('path', { class: 'home-arm', d });
    const rTag = 13.5, thTag = Math.log(rTag / 3) / PITCH + arm.off;
    arm.tag = gtxt({
      class: 'home-arm-tag', 'text-anchor': 'middle',
      x: (CX + Math.cos(thTag) * rTag * PX).toFixed(1),
      y: (CY + Math.sin(thTag) * rTag * PX).toFixed(1)
    }, arm.name);
    tilt.appendChild(arm.el);
  });

  /* Estrellas del disco */
  for (let i = 0; i < 420; i++) {
    const r = 1 + Math.pow(rand(), 0.8) * 15;
    const arm = ARMS[Math.floor(rand() * ARMS.length)].off;
    const th = Math.log(Math.max(3, r) / 3) / PITCH + arm + (rand() - 0.5) * (rand() < 0.75 ? 0.6 : 6.28);
    tilt.appendChild(svgEl('circle', {
      class: 'disc-star',
      cx: (CX + Math.cos(th) * r * PX).toFixed(1),
      cy: (CY + Math.sin(th) * r * PX).toFixed(1),
      r: (rand() * 1.5 + 0.6).toFixed(1)
    }));
  }

  /* Barra y bulbo */
  tilt.appendChild(svgEl('ellipse', { class: 'galaxy-bar', cx: CX, cy: CY, rx: 4.5 * PX, ry: 1.6 * PX, transform: `rotate(-25 ${CX} ${CY})` }));
  tilt.appendChild(svgEl('ellipse', { class: 'galaxy-core', cx: CX, cy: CY, rx: 11, ry: 11 }));

  ARMS.forEach((arm) => tilt.appendChild(arm.tag));

  const orbit = svgEl('ellipse', { class: 'sun-orbit', cx: CX, cy: CY, rx: 8 * PX, ry: 8 * PX });
  const sun = svgEl('circle', { class: 'sun-marker', r: 5 });
  const sunTag = gtxt({ class: 'sun-tag', 'text-anchor': 'middle' }, 'EL SOL');
  tilt.appendChild(orbit);
  tilt.appendChild(sun);
  tilt.appendChild(sunTag);

  /* Anotación de grosor, solo tiene sentido de canto */
  const thick = svgEl('g', { class: 'thickness' });
  thick.appendChild(svgEl('path', { class: 'thickness__line', d: `M${CX + 16 * PX + 16} ${CY - 9} V${CY + 9} M${CX + 16 * PX + 11} ${CY - 9} H${CX + 16 * PX + 21} M${CX + 16 * PX + 11} ${CY + 9} H${CX + 16 * PX + 21}` }));
  thick.appendChild(gtxt({ class: 'axis-label', x: CX + 16 * PX + 28, y: CY + 4, 'text-anchor': 'start' }, '1 000 a. l.'));
  svg.appendChild(thick);
  svg.appendChild(gtxt({ class: 'axis-label', x: CX, y: 290, 'text-anchor': 'middle' }, '100 000 AÑOS LUZ DE PUNTA A PUNTA'));

  const tiltRange = document.getElementById('homeTilt');
  const timeRange = document.getElementById('homeTime');
  const readout = document.getElementById('homeReadout');

  function render() {
    const deg = +tiltRange.value;
    const k = Math.max(0.06, Math.cos(deg * Math.PI / 180));
    tilt.setAttribute('transform', `translate(${CX} ${CY}) scale(1 ${k.toFixed(3)}) translate(${-CX} ${-CY})`);
    ARMS.forEach((a) => { a.tag.style.opacity = deg < 45 ? 1 : 0; });
    thick.style.opacity = deg > 65 ? 1 : 0;

    const myr = +timeRange.value;                    // millones de años desde hoy
    const th = 1.15 + (myr / 230) * 2 * Math.PI;     // una vuelta cada 230
    sun.setAttribute('cx', (CX + Math.cos(th) * 8 * PX).toFixed(1));
    sun.setAttribute('cy', (CY + Math.sin(th) * 8 * PX).toFixed(1));
    sunTag.setAttribute('x', (CX + Math.cos(th) * 8 * PX).toFixed(1));
    sunTag.setAttribute('y', (CY + Math.sin(th) * 8 * PX - 12).toFixed(1));

    const vueltas = Math.abs(myr) / 230;
    readout.textContent = myr === 0
      ? 'El Sol, hoy: a 26 000 años luz del centro, en el brazo de Orión.'
      : myr < 0
        ? `Hace ${Math.abs(myr)} millones de años (${vueltas.toFixed(2)} vueltas)`
          + (Math.abs(myr) > 220 ? ' · la última vez que estuvo aquí empezaban los dinosaurios' : '')
        : `Dentro de ${myr} millones de años (${vueltas.toFixed(2)} vueltas)`;
  }

  tiltRange.addEventListener('input', render);
  timeRange.addEventListener('input', render);
  render();
}

/* ============================================================
   02 · LA SECUENCIA DE HUBBLE
   ============================================================ */

function initHubbleLab() {
  const svg = document.getElementById('labHubble');
  if (!svg) return;

  const CX = 300, CY = 145, PX = 8;
  const rand = galRandom(151);
  const N = 620;

  /* Valores fijos por estrella: la forma cambia, el ruido no */
  const seeds = Array.from({ length: N }, () => ({
    u: rand(), v: rand(), w: rand(), arm: rand() < 0.5 ? 0 : Math.PI,
    jitter: (rand() - 0.5), size: rand() * 1.5 + 0.6
  }));

  const g = svgEl('g', { class: 'hubble-stars' });
  seeds.forEach((s) => { s.el = svgEl('circle', { class: 'disc-star', r: s.size.toFixed(1) }); g.appendChild(s.el); });
  svg.appendChild(g);
  const bar = svgEl('ellipse', { class: 'galaxy-bar', cx: CX, cy: CY, ry: 1.4 * PX });
  svg.appendChild(bar);
  svg.appendChild(svgEl('ellipse', { class: 'galaxy-core', cx: CX, cy: CY, rx: 9, ry: 9 }));
  const typeTag = gtxt({ class: 'addr-level', x: 26, y: 34 }, '');
  svg.appendChild(typeTag);

  const TYPES = [
    { at: 0.00, code: 'E0', name: 'Elíptica E0', note: 'una bola de estrellas viejas, sin disco ni gas' },
    { at: 0.22, code: 'E6', name: 'Elíptica E6', note: 'la misma idea, pero achatada' },
    { at: 0.40, code: 'S0', name: 'Lenticular S0', note: 'ya hay disco, pero todavía no hay brazos' },
    { at: 0.60, code: 'Sa', name: 'Espiral Sa', note: 'bulbo grande y brazos muy apretados' },
    { at: 0.80, code: 'Sb', name: 'Espiral Sb', note: 'el término medio: la Vía Láctea anda por aquí' },
    { at: 1.00, code: 'Sc', name: 'Espiral Sc', note: 'poco bulbo y brazos muy abiertos, llenos de gas' }
  ];

  const slider = document.getElementById('hubbleShape');
  const barBtn = document.getElementById('hubbleBar');
  const readout = document.getElementById('hubbleReadout');
  let barred = false;

  function render() {
    const t = +slider.value / 100;
    const bulge = Math.max(0.08, 1 - t * 1.15);          // fracción de estrellas en el bulbo
    const flat = t < 0.4 ? 1 - (t / 0.4) * 0.45 : 0.22;  // grosor relativo
    const armAmp = Math.max(0, (t - 0.45) / 0.55);       // cuánto se notan los brazos
    const pitch = 0.16 + armAmp * 0.34;
    const barLen = barred && t > 0.35 ? 4.5 : 0;

    seeds.forEach((s) => {
      let x, y;
      if (s.u < bulge) {
        const r = Math.pow(s.v, 0.6) * 5.5;
        const th = s.w * Math.PI * 2;
        x = Math.cos(th) * r;
        y = Math.sin(th) * r * flat;
      } else {
        const r = 3 + Math.pow(s.v, 0.75) * 12;
        const spiral = Math.log(r / 3) / pitch + s.arm;
        const th = armAmp > 0
          ? spiral + s.jitter * (0.5 + (1 - armAmp) * 3.5) + (barLen ? 0.9 : 0)
          : s.w * Math.PI * 2;
        x = Math.cos(th) * r;
        y = Math.sin(th) * r * flat;
      }
      s.el.setAttribute('cx', (CX + x * PX).toFixed(1));
      s.el.setAttribute('cy', (CY + y * PX).toFixed(1));
    });

    bar.setAttribute('rx', barLen * PX);
    bar.style.opacity = barLen ? 0.9 : 0;

    const type = TYPES.reduce((a, b) => (Math.abs(b.at - t) < Math.abs(a.at - t) ? b : a));
    const code = barred && t > 0.45 ? type.code.replace('S', 'SB') : type.code;
    typeTag.textContent = code;
    readout.textContent = `${type.name}${barred && t > 0.45 ? ' barrada' : ''} · ${type.note}`;
  }

  slider.addEventListener('input', render);
  barBtn.addEventListener('click', () => {
    barred = !barred;
    barBtn.setAttribute('aria-pressed', String(barred));
    render();
  });
  render();
}

/* ============================================================
   03 · SAGITARIO A* — ajusta la masa
   ============================================================ */

function initSgrLab() {
  const svg = document.getElementById('labSgr');
  if (!svg) return;

  const CX = 300, CY = 155, AU_PX = 0.115;      // px por unidad astronómica
  const A = 1030, E = 0.88;                      // órbita de S2: semieje y excentricidad
  const T_OBS = 16.0;                            // periodo medido, en años
  const b = A * Math.sqrt(1 - E * E);
  const c = A * E;

  svg.appendChild(svgEl('ellipse', {
    class: 'sgr-orbit', cx: CX - c * AU_PX, cy: CY, rx: A * AU_PX, ry: b * AU_PX
  }));

  /* Posiciones medidas a lo largo de la órbita */
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2;
    svg.appendChild(svgEl('circle', {
      class: 'data-point',
      cx: (CX - c * AU_PX + Math.cos(th) * A * AU_PX).toFixed(1),
      cy: (CY + Math.sin(th) * b * AU_PX).toFixed(1),
      r: 2.4
    }));
  }

  const bh = svgEl('g', { class: 'sgr-bh' });
  bh.appendChild(svgEl('circle', { class: 'sgr-bh__glow', cx: CX, cy: CY, r: 26 }));
  bh.appendChild(svgEl('circle', { class: 'sgr-bh__core', cx: CX, cy: CY, r: 9 }));
  svg.appendChild(bh);
  svg.appendChild(gtxt({ class: 'addr-tag', x: CX, y: CY + 42, 'text-anchor': 'middle' }, 'SAGITARIO A*'));

  const star = svgEl('circle', { class: 'sgr-star', r: 5 });
  svg.appendChild(star);
  svg.appendChild(gtxt({ class: 'axis-label', x: 300, y: 288, 'text-anchor': 'middle' }, 'ÓRBITA DE LA ESTRELLA S2 · 1 030 UA DE SEMIEJE'));

  const slider = document.getElementById('sgrMass');
  const readout = document.getElementById('sgrReadout');

  let M = +slider.value / 10;        // en millones de masas solares
  let phase = 0;

  /* Tercera ley de Kepler: T² = a³/M, con a en UA, T en años y M en masas solares */
  const period = (millions) => Math.sqrt(Math.pow(A, 3) / (millions * 1e6));

  function place() {
    // Ecuación de Kepler resuelta por iteración: la estrella acelera en el perihelio
    const Mt = phase * 2 * Math.PI;
    let Ecc = Mt;
    for (let i = 0; i < 6; i++) Ecc -= (Ecc - E * Math.sin(Ecc) - Mt) / (1 - E * Math.cos(Ecc));
    const x = A * (Math.cos(Ecc) - E);
    const y = b * Math.sin(Ecc);
    star.setAttribute('cx', (CX + x * AU_PX).toFixed(1));
    star.setAttribute('cy', (CY + y * AU_PX).toFixed(1));
  }

  function readouts() {
    const T = period(M);
    const fits = Math.abs(T - T_OBS) < 0.35;
    svg.classList.toggle('is-fitted', fits);
    readout.textContent = `Con ${M.toFixed(1)} millones de masas solares, S2 daría una vuelta en `
      + `${T.toFixed(1)} años. Medido: ${T_OBS.toFixed(1)} años.`
      + (fits ? ' ✓ coincide' : T > T_OBS ? ' Hace falta más masa.' : ' Es demasiada masa.');
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // Una vuelta de S2 en pantalla dura tantos segundos como años tarde dividido entre tres
    phase = (phase + dt / (period(M) / 3)) % 1;
    place();
    requestAnimationFrame(tick);
  }

  slider.addEventListener('input', () => { M = +slider.value / 10; readouts(); });

  place();
  readouts();
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);
}

/* ============================================================
   04 · LA COLISIÓN CON ANDRÓMEDA (integración real)
   ============================================================ */

function initMergerLab() {
  const svg = document.getElementById('labMerger');
  if (!svg) return;

  /* Unidades: kpc, millones de años y masas solares */
  const G = 4.5e-12;                 // kpc³ / (M☉ · Myr²)
  const M1 = 1.3e12, M2 = 1.5e12;    // Vía Láctea y Andrómeda
  const KMS = 0.001023;              // 1 km/s en kpc/Myr
  const DT = 5, STEPS = 1700, EVERY = 8;
  const SOFT = 12;
  const DRAG = 2e-4;   // ajustado para que la fusión termine hacia los 6 500 millones de años

  const rand = galRandom(181);

  // Dos galaxias que se acercan de frente, con algo de movimiento lateral
  const gal = [
    { m: M1, x: -390, y: 0, vx: 55 * KMS, vy: 14 * KMS },
    { m: M2, x: 390, y: 0, vx: -55 * KMS, vy: -14 * KMS }
  ];

  const parts = [];
  gal.forEach((gx, gi) => {
    for (let i = 0; i < 130; i++) {
      const r = 14 + rand() * 32;
      const th = rand() * Math.PI * 2;
      const v = Math.sqrt(G * gx.m / r) * (gi === 0 ? 1 : -1);   // los discos giran al revés
      parts.push({
        gi,
        x: gx.x + Math.cos(th) * r,
        y: gx.y + Math.sin(th) * r,
        vx: gx.vx - Math.sin(th) * v,
        vy: gx.vy + Math.cos(th) * v
      });
    }
  });

  function accel(x, y) {
    let ax = 0, ay = 0;
    gal.forEach((gx) => {
      const dx = gx.x - x, dy = gx.y - y;
      const d = Math.sqrt(dx * dx + dy * dy + SOFT * SOFT);
      const f = G * gx.m / (d * d * d);
      ax += f * dx; ay += f * dy;
    });
    return [ax, ay];
  }

  /* Integración previa: se guarda una instantánea cada EVERY pasos */
  const frames = [];
  const seps = [];
  for (let step = 0; step <= STEPS; step++) {
    if (step % EVERY === 0) {
      frames.push({
        g: gal.map((o) => [o.x, o.y]),
        p: parts.map((o) => [o.x, o.y])
      });
      seps.push(Math.hypot(gal[0].x - gal[1].x, gal[0].y - gal[1].y));
    }
    // Las dos galaxias se atraen entre sí
    const dx = gal[1].x - gal[0].x, dy = gal[1].y - gal[0].y;
    const d = Math.sqrt(dx * dx + dy * dy + SOFT * SOFT);
    const f = G / (d * d * d);
    gal[0].vx += f * gal[1].m * dx * DT; gal[0].vy += f * gal[1].m * dy * DT;
    gal[1].vx -= f * gal[0].m * dx * DT; gal[1].vy -= f * gal[0].m * dy * DT;

    // Fricción dinámica: al solaparse los halos se frenan, y por eso acaban fundiéndose
    const drag = DRAG / (1 + Math.pow(d / 220, 2));
    const rvx = gal[1].vx - gal[0].vx, rvy = gal[1].vy - gal[0].vy;
    gal[1].vx -= drag * rvx * DT; gal[1].vy -= drag * rvy * DT;
    gal[0].vx += drag * rvx * DT; gal[0].vy += drag * rvy * DT;
    parts.forEach((p) => {
      const [ax, ay] = accel(p.x, p.y);
      p.vx += ax * DT; p.vy += ay * DT;
    });
    gal.forEach((o) => { o.x += o.vx * DT; o.y += o.vy * DT; });
    parts.forEach((p) => { p.x += p.vx * DT; p.y += p.vy * DT; });
  }

  // Primer encuentro: el primer mínimo de la separación
  let firstPass = 0;
  for (let i = 1; i < seps.length - 1; i++) {
    if (seps[i] < seps[i - 1] && seps[i] <= seps[i + 1]) { firstPass = i; break; }
  }
  // Fusión: cuando los dos núcleos ya no vuelven a separarse
  let merged = seps.length - 1;
  for (let i = firstPass; i < seps.length - 6; i++) {
    if (seps.slice(i, i + 6).every((v) => v < 45)) { merged = i; break; }
  }

  const CX = 300, CY = 150, SCALE = 0.31;
  const px = (x) => CX + x * SCALE;
  const py = (y) => CY + y * SCALE;

  const pG = svgEl('g', { class: 'merger-parts' });
  const els = parts.map((p) => {
    const el = svgEl('circle', { class: `merger-dot merger-dot--${p.gi}`, r: 1.7 });
    pG.appendChild(el);
    return el;
  });
  svg.appendChild(pG);
  const cores = gal.map((_, i) => {
    const el = svgEl('circle', { class: `merger-core merger-core--${i}`, r: 6 });
    svg.appendChild(el);
    return el;
  });
  const labels = ['VÍA LÁCTEA', 'ANDRÓMEDA'].map((t) => {
    const el = gtxt({ class: 'addr-tag', 'text-anchor': 'middle' }, t);
    svg.appendChild(el);
    return el;
  });

  const slider = document.getElementById('mergerTime');
  const play = document.getElementById('mergerPlay');
  const readout = document.getElementById('mergerReadout');
  slider.max = frames.length - 1;

  function draw(i) {
    const f = frames[i];
    f.p.forEach((p, k) => {
      els[k].setAttribute('cx', px(p[0]).toFixed(1));
      els[k].setAttribute('cy', py(p[1]).toFixed(1));
    });
    f.g.forEach((g, k) => {
      cores[k].setAttribute('cx', px(g[0]).toFixed(1));
      cores[k].setAttribute('cy', py(g[1]).toFixed(1));
      labels[k].setAttribute('x', px(g[0]).toFixed(1));
      labels[k].setAttribute('y', (py(g[1]) - 14).toFixed(1));
      labels[k].style.opacity = i > merged - 6 ? 0 : 1;
    });

    const gyr = (i * EVERY * DT) / 1000;
    const sep = Math.round(seps[i]);
    readout.textContent = `Dentro de ${gyr.toFixed(1)} mil millones de años · separación ${sep} kpc`
      + (i === 0 ? ' · hoy'
        : i < firstPass - 4 ? ' · acercándose a 110 km/s'
        : i < firstPass + 8 ? ' · primer encuentro: salen las colas de marea'
        : i < merged ? ' · se separan, pero ya no lo bastante para escapar'
        : ' · fundidas en una sola galaxia, probablemente elíptica');
  }

  slider.addEventListener('input', () => draw(+slider.value));

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
    let i = +slider.value >= frames.length - 1 ? 0 : +slider.value;
    (function step() {
      if (!playing) return;
      i = Math.min(frames.length - 1, i + 1);
      slider.value = i;
      draw(i);
      if (i < frames.length - 1) setTimeout(() => requestAnimationFrame(step), 45);
      else parar();
    })();
  });

  draw(0);
}

document.addEventListener('DOMContentLoaded', () => {
  arranca('HomeLab', initHomeLab);
  arranca('HubbleLab', initHubbleLab);
  arranca('SgrLab', initSgrLab);
  arranca('MergerLab', initMergerLab);
});
