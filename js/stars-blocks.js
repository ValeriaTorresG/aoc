/* ============================================================
   El arte del cosmos — piezas interactivas de estrellas.html
     01 el termostato: aprieta la estrella y mira cómo se defiende
     02 la curva de Planck y la ley de Wien
     03 el diagrama H-R de un cúmulo que envejece
     04 la vida entera de una estrella, según su masa
   Depende de js/common.js (svgEl, rampColor, reduceMotion) y de
   js/stars.js (msLuminosity, msRadius, msTemp, msLife, starColor,
   spectralType, formatYears, starRandom).
   ============================================================ */

const stxt = (attrs, content) => Object.assign(svgEl('text', attrs), { textContent: content });

/* ============================================================
   01 · EL TERMOSTATO
   ============================================================ */

function initBalanceLab() {
  const svg = document.getElementById('labBalance');
  if (!svg) return;

  const CX = 190, CY = 150, R0 = 86;
  const rand = starRandom(13);

  const star = svgEl('circle', { class: 'star-body', cx: CX, cy: CY, r: R0 });
  const core = svgEl('circle', { class: 'star-core-glow', cx: CX, cy: CY, r: R0 * 0.32 });
  svg.appendChild(svgEl('circle', { class: 'star-ghost', cx: CX, cy: CY, r: R0 }));
  svg.appendChild(star);
  svg.appendChild(core);

  /* Flechas: la gravedad aprieta, la radiación empuja */
  const arrows = [];
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2;
    const grav = svgEl('path', { class: 'force force--gravity' });
    const rad = svgEl('path', { class: 'force force--radiation' });
    svg.appendChild(grav);
    svg.appendChild(rad);
    arrows.push({ th, grav, rad });
  }

  const bars = [
    { label: 'RADIO', key: 'r' },
    { label: 'TEMPERATURA DEL NÚCLEO', key: 't' },
    { label: 'RITMO DE FUSIÓN', key: 'f' }
  ];
  bars.forEach((b, i) => {
    const y = 78 + i * 62;
    svg.appendChild(stxt({ class: 'axis-label', x: 360, y: y - 12, 'text-anchor': 'start' }, b.label));
    svg.appendChild(svgEl('rect', { class: 'gauge-track', x: 360, y, width: 190, height: 8 }));
    b.el = svgEl('rect', { class: 'gauge-fill', x: 360, y, width: 95, height: 8 });
    svg.appendChild(b.el);
    b.txt = stxt({ class: 'gauge-value', x: 360, y: y + 28 }, '');
    svg.appendChild(b.txt);
  });

  const slider = document.getElementById('balanceSqueeze');
  const release = document.getElementById('balanceRelease');
  const readout = document.getElementById('balanceReadout');

  let x = 1;          // radio relativo
  let v = 0;          // velocidad del rebote
  let free = false;   // ¿la está apretando alguien?

  function paint() {
    const r = R0 * x;
    star.setAttribute('r', r.toFixed(1));
    core.setAttribute('r', (r * 0.3).toFixed(1));

    // La temperatura del núcleo sube al comprimir, y la fusión responde como T⁴
    const tCore = 15.7 / x;
    const fusion = Math.pow(1 / x, 4);
    star.style.fill = starColor(5772 / Math.pow(x, 0.5));
    core.style.opacity = Math.min(0.95, 0.25 * fusion).toFixed(2);

    arrows.forEach((a) => {
      const gx = CX + Math.cos(a.th), gy = CY + Math.sin(a.th);
      const gLen = 26 / (x * x);
      const rLen = 26 * fusion / 1.6;
      a.grav.setAttribute('d', `M${gx + Math.cos(a.th) * (r + 34)} ${gy + Math.sin(a.th) * (r + 34)} `
        + `L${gx + Math.cos(a.th) * (r + 34 - Math.min(34, gLen))} ${gy + Math.sin(a.th) * (r + 34 - Math.min(34, gLen))}`);
      a.rad.setAttribute('d', `M${gx + Math.cos(a.th) * (r - 6)} ${gy + Math.sin(a.th) * (r - 6)} `
        + `L${gx + Math.cos(a.th) * (r - 6 + Math.min(30, rLen))} ${gy + Math.sin(a.th) * (r - 6 + Math.min(30, rLen))}`);
    });

    const vals = { r: x, t: tCore / 15.7, f: fusion };
    bars.forEach((b) => {
      b.el.setAttribute('width', Math.max(2, Math.min(190, 95 * vals[b.key])).toFixed(1));
      b.txt.textContent = b.key === 'r' ? `${x.toFixed(2).replace('.', ',')} × el normal`
        : b.key === 't' ? `${tCore.toFixed(1).replace('.', ',')} millones de grados`
        : `${fusion.toFixed(2).replace('.', ',')} × el normal`;
    });
  }

  function step(now) {
    if (free) {
      // Muelle amortiguado: la estrella vuelve sola a su tamaño de equilibrio
      const a = -34 * (x - 1) - 3.4 * v;
      v += a * 0.016;
      x += v * 0.016;
      if (Math.abs(x - 1) < 0.002 && Math.abs(v) < 0.01) { x = 1; v = 0; free = false; readout.textContent = 'De vuelta al equilibrio. Eso es lo que hace que una estrella dure miles de millones de años.'; }
      slider.value = Math.round(x * 100);
      paint();
    }
    requestAnimationFrame(step);
  }

  slider.addEventListener('input', () => {
    free = false; v = 0;
    x = +slider.value / 100;
    paint();
    readout.textContent = x < 1
      ? 'Comprimida: el núcleo se calienta y la fusión se dispara, empujando hacia fuera.'
      : x > 1
        ? 'Estirada: el núcleo se enfría, la fusión baja y la gravedad gana.'
        : 'En equilibrio.';
  });

  release.addEventListener('click', () => {
    free = true;
    readout.textContent = 'Suelta: la estrella oscila unas cuantas veces y se estabiliza sola.';
  });

  paint();
  readout.textContent = 'En equilibrio: la gravedad aprieta hacia dentro con la misma fuerza con la que la radiación empuja hacia fuera.';
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(step);
}

/* ============================================================
   02 · LA CURVA DE PLANCK
   ============================================================ */

function initPlanckLab() {
  const svg = document.getElementById('labPlanck');
  if (!svg) return;

  const plot = { x: 60, y: 40, w: 420, h: 190 };
  const LMIN = 80, LMAX = 2200;                       // nanómetros
  const C2 = 1.4388e7;                                 // nm · K
  const X = (nm) => plot.x + plot.w * (nm - LMIN) / (LMAX - LMIN);
  const planck = (nm, T) => 1 / (Math.pow(nm, 5) * (Math.exp(C2 / (nm * T)) - 1));

  /* Banda visible, pintada por longitud de onda */
  const band = svgEl('g', { class: 'visible-band' });
  for (let nm = 380; nm < 750; nm += 5) {
    band.appendChild(svgEl('rect', {
      x: X(nm), y: plot.y, width: X(nm + 5) - X(nm) + 0.5, height: plot.h,
      fill: wavelengthRGB(nm), opacity: 0.16
    }));
  }
  svg.appendChild(band);
  svg.appendChild(stxt({ class: 'axis-label', x: X(565), y: plot.y + plot.h + 20, 'text-anchor': 'middle' }, 'LUZ VISIBLE'));

  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} H${plot.x + plot.w + 10}` }));
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} V${plot.y - 8}` }));
  svg.appendChild(axes);
  svg.appendChild(stxt({ class: 'axis-label plot-label', x: plot.x + plot.w + 10, y: plot.y + plot.h + 36, 'text-anchor': 'end' }, 'LONGITUD DE ONDA →'));
  svg.appendChild(stxt({ class: 'axis-label plot-label', x: plot.x, y: plot.y - 18, 'text-anchor': 'start' }, 'ENERGÍA EMITIDA'));

  const sunCurve = svgEl('path', { class: 'curve curve--expected' });
  const curve = svgEl('path', { class: 'curve curve--live' });
  const peak = svgEl('line', { class: 'peak-line' });
  const disc = svgEl('circle', { class: 'star-body', cx: 528, cy: 140, r: 46 });
  svg.appendChild(sunCurve);
  svg.appendChild(curve);
  svg.appendChild(peak);
  svg.appendChild(disc);
  const peakTag = stxt({ class: 'peak-tag', 'text-anchor': 'middle' }, '');
  svg.appendChild(peakTag);

  function path(T) {
    let max = 0;
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const nm = LMIN + (LMAX - LMIN) * (i / 120);
      const v = planck(nm, T);
      max = Math.max(max, v);
      pts.push([nm, v]);
    }
    return pts.map(([nm, v], i) =>
      `${i ? 'L' : 'M'}${X(nm).toFixed(1)} ${(plot.y + plot.h - (v / max) * plot.h * 0.94).toFixed(1)}`).join('');
  }

  sunCurve.setAttribute('d', path(5772));

  const slider = document.getElementById('planckTemp');
  const readout = document.getElementById('planckReadout');

  function render() {
    const T = +slider.value;
    curve.setAttribute('d', path(T));
    curve.style.stroke = starColor(T);
    disc.style.fill = starColor(T);

    const lmax = 2.898e6 / T;                       // ley de Wien, en nm
    const px = X(Math.min(LMAX, lmax));
    peak.setAttribute('x1', px); peak.setAttribute('x2', px);
    peak.setAttribute('y1', plot.y - 6); peak.setAttribute('y2', plot.y + plot.h);
    peakTag.setAttribute('x', Math.min(px, plot.x + plot.w - 30));
    peakTag.setAttribute('y', plot.y - 12);
    peakTag.textContent = `${Math.round(lmax)} nm`;

    const donde = lmax < 380 ? 'en el ultravioleta' : lmax > 750 ? 'en el infrarrojo' : 'dentro de la luz visible';
    readout.textContent = `${T.toLocaleString('es-ES')} K · tipo ${spectralType(T)} · el pico cae ${donde}, a ${Math.round(lmax)} nm`
      + ' · en gris, la curva del Sol';
  }

  slider.addEventListener('input', render);
  render();
}

/* ============================================================
   03 · EL DIAGRAMA DE UN CÚMULO QUE ENVEJECE
   ============================================================ */

function initClusterLab() {
  const svg = document.getElementById('labCluster');
  if (!svg) return;

  const plot = { x: 70, y: 30, w: 420, h: 220 };
  const HX = (k) => plot.x + plot.w * (Math.log10(50000) - Math.log10(k)) / (Math.log10(50000) - Math.log10(2400));
  const HY = (l) => plot.y + plot.h * (Math.log10(3e5) - Math.log10(l)) / (Math.log10(3e5) - Math.log10(1e-4));

  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} H${plot.x + plot.w}` }));
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} V${plot.y}` }));
  svg.appendChild(axes);
  svg.appendChild(stxt({ class: 'axis-label plot-label', x: plot.x + plot.w, y: plot.y + plot.h + 22, 'text-anchor': 'end' }, 'MÁS FRÍA →'));
  svg.appendChild(stxt({ class: 'axis-label plot-label', x: plot.x, y: plot.y - 12, 'text-anchor': 'start' }, 'MÁS LUMINOSA ↑'));

  let dMS = '';
  for (let i = 0; i <= 60; i++) {
    const m = 0.15 * Math.pow(160, i / 60);
    dMS += `${i ? 'L' : 'M'}${HX(msTemp(m)).toFixed(1)} ${HY(msLuminosity(m)).toFixed(1)}`;
  }
  svg.appendChild(svgEl('path', { class: 'ms-line', d: dMS }));

  /* Un cúmulo con muchas estrellas pequeñas y pocas grandes (función inicial de masas) */
  const rand = starRandom(191);
  const stars = Array.from({ length: 260 }, () => {
    const u = rand();
    const m = 0.15 * Math.pow(1 - u * 0.999, -1 / 1.35);   // reparto tipo Salpeter
    return { m: Math.min(24, m), el: svgEl('circle', { class: 'cluster-star', r: 3 }) };
  });
  const starG = svgEl('g', { class: 'cluster-stars' });
  stars.forEach((s) => starG.appendChild(s.el));
  svg.appendChild(starG);

  const turnTag = stxt({ class: 'peak-tag', 'text-anchor': 'middle' }, '');
  svg.appendChild(turnTag);

  const slider = document.getElementById('clusterAge');
  const readout = document.getElementById('clusterReadout');

  function render() {
    const age = Math.pow(10, +slider.value / 100 * 3.1 + 7);   // de 10 millones a 13 000 millones de años
    // Masa de salida: la estrella cuya vida coincide con la edad del cúmulo
    let turn = 0.15;
    for (let m = 0.15; m < 24; m *= 1.01) { if (msLife(m) > age) turn = m; else break; }

    let ms = 0, giants = 0, dwarfs = 0;
    stars.forEach((s) => {
      let T, L, cls;
      if (s.m <= turn) {
        T = msTemp(s.m); L = msLuminosity(s.m); cls = 'is-ms'; ms++;
      } else if (s.m < turn * 1.9 && s.m < 8) {
        // Recién salidas: suben y se enfrían hacia la rama de las gigantes
        T = 4200 - (s.m - turn) * 90; L = msLuminosity(turn) * 45; cls = 'is-giant'; giants++;
      } else if (s.m < 8) {
        T = 12000 + (s.m - turn) * 900; L = 0.02; cls = 'is-dwarf'; dwarfs++;   // enanas blancas
      } else {
        T = 0; L = 0; cls = 'is-gone';                                          // ya reventaron
      }
      if (cls === 'is-gone') { s.el.style.opacity = 0; return; }
      s.el.style.opacity = '';
      s.el.setAttribute('cx', HX(Math.max(2500, Math.min(49000, T))).toFixed(1));
      s.el.setAttribute('cy', HY(Math.max(1e-4, L)).toFixed(1));
      s.el.setAttribute('class', `cluster-star ${cls}`);
      s.el.style.fill = cls === 'is-dwarf' ? '' : starColor(Math.max(2500, Math.min(40000, T)));
    });

    turnTag.setAttribute('x', HX(msTemp(turn)));
    turnTag.setAttribute('y', HY(msLuminosity(turn)) - 12);
    turnTag.textContent = 'PUNTO DE SALIDA';

    readout.textContent = `Cúmulo de ${formatYears(age)} · por encima de ${turn.toFixed(1).replace('.', ',')} masas solares `
      + `ya nadie sigue en la secuencia principal · ${ms} en la secuencia, ${giants} gigantes, ${dwarfs} enanas blancas`;
  }

  slider.addEventListener('input', render);
  render();
}

/* ============================================================
   04 · LA VIDA ENTERA
   ============================================================ */

function initLifeLab() {
  const svg = document.getElementById('labLife');
  if (!svg) return;

  const CX = 165, CY = 150;
  const plot = { x: 330, y: 48, w: 210, h: 190 };
  const HX = (k) => plot.x + plot.w * (Math.log10(50000) - Math.log10(k)) / (Math.log10(50000) - Math.log10(2400));
  const HY = (l) => plot.y + plot.h * (Math.log10(3e5) - Math.log10(l)) / (Math.log10(3e5) - Math.log10(1e-4));

  const L_TOPE = 2.4e5;                    // techo del diagrama, en soles
  const cx = (T) => HX(Math.max(2500, Math.min(49000, T)));
  const cy = (L) => HY(Math.max(1e-4, Math.min(L_TOPE, L)));

  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} H${plot.x + plot.w}` }));
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} V${plot.y}` }));
  svg.appendChild(axes);
  svg.appendChild(stxt({ class: 'axis-label plot-label', x: plot.x, y: plot.y - 12, 'text-anchor': 'start' }, 'MÁS LUMINOSA ↑'));
  svg.appendChild(stxt({ class: 'axis-label plot-label', x: plot.x + plot.w, y: plot.y + plot.h + 22, 'text-anchor': 'end' }, 'MÁS FRÍA →'));

  let dMS = '';
  for (let i = 0; i <= 50; i++) {
    const m = 0.15 * Math.pow(160, i / 50);
    dMS += `${i ? 'L' : 'M'}${HX(msTemp(m)).toFixed(1)} ${HY(msLuminosity(m)).toFixed(1)}`;
  }
  svg.appendChild(svgEl('path', { class: 'ms-line', d: dMS }));

  const track = svgEl('path', { class: 'life-track' });
  const marker = svgEl('circle', { class: 'hr-marker', r: 5.5 });
  svg.appendChild(track);
  svg.appendChild(marker);

  const shell = svgEl('circle', { class: 'life-shell', cx: CX, cy: CY, r: 0 });
  const star = svgEl('circle', { class: 'star-body', cx: CX, cy: CY, r: 40 });
  svg.appendChild(shell);
  svg.appendChild(star);
  const phaseTag = stxt({ class: 'addr-level', x: 26, y: 34 }, '');
  svg.appendChild(phaseTag);
  const offTag = stxt({ class: 'peak-tag', x: plot.x + plot.w / 2, y: plot.y - 30, 'text-anchor': 'middle' }, '');
  svg.appendChild(offTag);

  const slider = document.getElementById('lifeMass');
  const play = document.getElementById('lifePlay');
  const readout = document.getElementById('lifeReadout');

  let M = 1, p = 0, playing = false;

  /* Las cuatro etapas, con su tamaño, su color y su duración */
  function stages(m) {
    const ms = msLife(m);
    const fin = m < 8
      ? { name: 'Enana blanca', T: 14000, L: 0.01, R: 0.012, note: 'el núcleo desnudo, enfriándose durante billones de años' }
      : m < 20
        ? { name: 'Estrella de neutrones', T: 9000, L: 0.002, R: 0.00002, note: 'una ciudad de materia que pesa más que el Sol' }
        : { name: 'Agujero negro', T: 2600, L: 0.0002, R: 0.00001, note: 'ni la luz vuelve a salir' };
    return [
      { name: 'Secuencia principal', T: msTemp(m), L: msLuminosity(m), R: msRadius(m), dur: ms, note: 'quemando hidrógeno en el núcleo' },
      { name: m < 8 ? 'Gigante roja' : 'Supergigante roja', T: 3600, L: msLuminosity(m) * (m < 8 ? 1200 : 8), R: msRadius(m) * (m < 8 ? 160 : 500), dur: ms * 0.12, note: 'el núcleo se contrae y las capas de fuera se hinchan' },
      { name: m < 8 ? 'Nebulosa planetaria' : 'Supernova', T: 40000, L: m < 8 ? msLuminosity(m) * 300 : 1e9, R: msRadius(m) * 3, dur: ms * 0.001, note: m < 8 ? 'las capas externas se sueltan y flotan' : 'durante unas semanas brilla como una galaxia entera' },
      fin
    ];
  }

  function render() {
    const st = stages(M);
    const total = st.length - 1;
    const i = Math.min(total, Math.floor(p * total));
    const f = p * total - i;
    const a = st[i], b = st[Math.min(total, i + 1)];

    const mix = (u, w) => Math.exp(Math.log(Math.max(1e-9, u)) * (1 - f) + Math.log(Math.max(1e-9, w)) * f);
    const T = mix(a.T, b.T), L = mix(a.L, b.L), R = mix(a.R, b.R);

    star.setAttribute('r', Math.max(3, Math.min(110, 26 * Math.pow(R, 0.22))).toFixed(1));
    star.style.fill = starColor(Math.max(2500, Math.min(40000, T)));

    // La cáscara que se escapa en la nebulosa o en la supernova
    const blowing = i === 2 || (i === 1 && f > 0.9);
    shell.setAttribute('r', blowing ? (60 + f * 90).toFixed(1) : 0);
    shell.style.opacity = blowing ? (0.5 * (1 - f)).toFixed(2) : 0;

    marker.setAttribute('cx', cx(T).toFixed(1));
    marker.setAttribute('cy', cy(L).toFixed(1));
    marker.style.fill = starColor(Math.max(2500, Math.min(40000, T)));

    let d = '';
    st.forEach((s, k) => { d += `${k ? 'L' : 'M'}${cx(s.T).toFixed(1)} ${cy(s.L).toFixed(1)}`; });
    track.setAttribute('d', d);

    // Una supernova brilla mil veces por encima del techo del diagrama: se avisa
    offTag.textContent = L > L_TOPE ? 'FUERA DE ESCALA ↑' : '';

    phaseTag.textContent = a.name.toUpperCase();
    readout.textContent = `${M.toFixed(1).replace('.', ',')} masas solares · ${a.name}: ${a.note}`
      + (a.dur ? ` · dura ${formatYears(a.dur)}` : '');
  }

  const scrub = document.getElementById('lifeProgress');
  scrub.value = 0;
  slider.addEventListener('input', () => { M = +slider.value / 10; render(); });
  scrub.addEventListener('input', () => { playing = false; play.setAttribute('aria-pressed', 'false'); p = +scrub.value / 100; render(); });

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
    p = 0;
    const t0 = performance.now();
    (function step(now) {
      if (!playing) return;
      p = Math.min(1, (now - t0) / 11000);
      scrub.value = Math.round(p * 100);
      render();
      if (p < 1) requestAnimationFrame(step); else parar();
    })(performance.now());
  });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  arranca('BalanceLab', initBalanceLab);
  arranca('PlanckLab', initPlanckLab);
  arranca('ClusterLab', initClusterLab);
  arranca('LifeLab', initLifeLab);
});
