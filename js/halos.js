/* ============================================================
   El arte del cosmos — laboratorio de halos
   Un mismo módulo alimenta la escena de la portada y la figura
   interactiva de halos.html.

   La curva de rotación no está dibujada a mano: se calcula.
     · disco visible  → modelo tipo Kuzmin, v² = GM·r²/(r²+a²)^1,5
     · halo oscuro    → perfil NFW, v² = GM·[ln(1+x) − x/(1+x)]/r
   Subir la masa del halo aplana la curva y acelera el gas exterior,
   que es exactamente lo que midieron Rubin y Ford.
   Depende de js/common.js (svgEl, reduceMotion).
   ============================================================ */

const HALO = {
  a: 4,            // escala del disco (kpc)
  rs: 12,          // radio de escala del halo (kpc)
  GMd: 336623,     // masa del disco  · unidades tales que v sale en km/s
  GMh: 2295000,    // masa del halo a f = 1
  rMax: 40,        // radio del gráfico (kpc)
  vMax: 260        // techo del eje de velocidad (km/s)
};

const vDisc2 = (r) => HALO.GMd * r * r / Math.pow(r * r + HALO.a * HALO.a, 1.5);

function vHalo2(r) {
  const x = r / HALO.rs;
  return HALO.GMh * (Math.log(1 + x) - x / (1 + x)) / r;
}

/* Velocidad orbital total a un radio r con una fracción f de halo */
const vTotal = (r, f) => Math.sqrt(vDisc2(r) + f * vHalo2(r));

/* Cuánto pesa el halo comparado con la materia visible */
const massRatio = (f) => f * HALO.GMh / HALO.GMd;

/* ------------------------------------------------------------
   Construye el laboratorio dentro de un <svg> ya existente
   ------------------------------------------------------------ */

function createHaloLab(cfg) {
  const { svg, galaxy, plot, tracers } = cfg;
  const root = svgEl('g', { class: 'halo-lab' });
  svg.appendChild(root);

  const X = (r) => (r / HALO.rMax) * plot.w;
  const Y = (v) => plot.h - (v / HALO.vMax) * plot.h;
  const rPix = (r) => (r / HALO.rMax) * galaxy.maxR;

  let f = cfg.initialMass ?? 0;
  let running = true;
  let showParticles = true;
  let onScreen = true;
  let hovered = -1;

  /* ---- halo: nube de partículas + anillos ---- */

  const particles = svgEl('g', { class: 'halo-particles' });
  particles.style.transformOrigin = `${galaxy.cx}px ${galaxy.cy}px`;
  if (!reduceMotion) particles.classList.add('is-drifting');

  for (let i = 0; i < 150; i++) {
    // Más densa hacia el centro, como manda el perfil NFW
    const rad = galaxy.maxR * 1.12 * Math.pow(Math.random(), 0.55);
    const th = Math.random() * Math.PI * 2;
    const dot = svgEl('circle', {
      class: 'halo-particle',
      cx: (galaxy.cx + Math.cos(th) * rad).toFixed(1),
      cy: (galaxy.cy + Math.sin(th) * rad * 0.92).toFixed(1),
      r: (Math.random() * 1.6 + 0.6).toFixed(1)
    });
    if (!reduceMotion) {
      dot.style.animation = `twinkle ${(3 + Math.random() * 5).toFixed(1)}s ease-in-out ${(Math.random() * 5).toFixed(1)}s infinite`;
    }
    particles.appendChild(dot);
  }
  root.appendChild(particles);

  const rings = [1.12, 0.78, 0.48].map((k) => {
    const ring = svgEl('circle', { class: 'halo-ring', cx: galaxy.cx, cy: galaxy.cy, r: galaxy.maxR * k });
    ring.dataset.k = k;
    root.appendChild(ring);
    return ring;
  });

  /* ---- galaxia visible ---- */

  root.appendChild(svgEl('ellipse', {
    class: 'galaxy-disc galaxy-disc--flat',
    cx: galaxy.cx, cy: galaxy.cy, rx: galaxy.maxR * 0.62, ry: galaxy.maxR * 0.17
  }));
  root.appendChild(svgEl('ellipse', {
    class: 'galaxy-core', cx: galaxy.cx, cy: galaxy.cy, rx: galaxy.maxR * 0.13, ry: galaxy.maxR * 0.1
  }));

  /* ---- nubes de gas que trazan la curva ---- */

  const orbits = svgEl('g', { class: 'tracer-orbits' });
  const gas = svgEl('g', { class: 'tracers' });
  const clouds = tracers.map((r, i) => {
    orbits.appendChild(svgEl('ellipse', {
      class: 'tracer-orbit', cx: galaxy.cx, cy: galaxy.cy,
      rx: rPix(r), ry: rPix(r) * 0.3
    }));
    const el = svgEl('circle', { class: 'tracer', r: 7 - i, 'data-i': i });
    gas.appendChild(el);
    return { r, el, angle: i * 2.1 };
  });
  root.appendChild(orbits);
  root.appendChild(gas);

  const tracerLabel = svgEl('text', { class: 'tracer-label', x: 0, y: 0 });
  root.appendChild(tracerLabel);

  /* ---- gráfico de la curva de rotación ---- */

  const plotG = svgEl('g', { class: 'plot', transform: `translate(${plot.x} ${plot.y})` });
  root.appendChild(plotG);

  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M0 ${plot.h} H${plot.w + 10} M${plot.w + 2} ${plot.h - 6} L${plot.w + 14} ${plot.h} L${plot.w + 2} ${plot.h + 6}` }));
  axes.appendChild(svgEl('path', { d: `M0 ${plot.h} V-10 M-6 2 L0 -12 L6 2` }));
  plotG.appendChild(axes);

  const expected = svgEl('path', { class: 'curve curve--expected' });
  const live = svgEl('path', { class: 'curve curve--live' });
  plotG.appendChild(expected);
  plotG.appendChild(live);

  const markers = clouds.map(() => {
    const g = svgEl('g', { class: 'marker' });
    g.appendChild(svgEl('line', { class: 'marker__guide', x1: 0, y1: 0, x2: 0, y2: 0 }));
    g.appendChild(svgEl('circle', { class: 'marker__dot', r: 5 }));
    plotG.appendChild(g);
    return g;
  });

  const yLabel = svgEl('text', { class: 'axis-label plot-label', x: 6, y: -18, 'text-anchor': 'start' });
  yLabel.textContent = 'VELOCIDAD (km/s)';
  const xLabel = svgEl('text', { class: 'axis-label plot-label', x: plot.w, y: plot.h + 26, 'text-anchor': 'end' });
  xLabel.textContent = 'RADIO (40 000 años luz) →';
  plotG.appendChild(yLabel);
  plotG.appendChild(xLabel);

  const flatNote = svgEl('text', { class: 'plot-note', x: plot.w, y: 0, 'text-anchor': 'end' });
  plotG.appendChild(flatNote);

  /* ---- dibujo ---- */

  function curvePath(frac) {
    let d = '';
    for (let i = 0; i <= 70; i++) {
      const r = 0.6 + (HALO.rMax - 0.6) * (i / 70);
      d += `${i ? 'L' : 'M'}${X(r).toFixed(1)} ${Y(vTotal(r, frac)).toFixed(1)}`;
    }
    return d;
  }

  expected.setAttribute('d', curvePath(0));

  function renderCurve() {
    live.setAttribute('d', curvePath(f));
    clouds.forEach((c, i) => {
      const v = vTotal(c.r, f);
      const x = X(c.r), y = Y(v);
      const g = markers[i];
      g.querySelector('.marker__dot').setAttribute('cx', x);
      g.querySelector('.marker__dot').setAttribute('cy', y);
      const guide = g.querySelector('.marker__guide');
      guide.setAttribute('x1', x); guide.setAttribute('x2', x);
      guide.setAttribute('y1', y); guide.setAttribute('y2', plot.h);
      g.classList.toggle('is-lit', hovered === i);
    });

    // Cociente entre la velocidad en el borde y cerca del centro: mide la planitud
    const flat = vTotal(HALO.rMax, f) / vTotal(6, f);
    flatNote.textContent = flat > 0.85 ? 'CURVA PLANA' : flat > 0.68 ? 'CAE POCO' : 'CURVA QUE CAE';
    flatNote.classList.toggle('is-flat', flat > 0.85);

    const halo = Math.min(1, f);
    particles.style.opacity = showParticles ? (0.15 + halo * 0.85).toFixed(2) : 0;
    rings.forEach((ring) => {
      ring.style.opacity = (0.1 + halo * 0.7).toFixed(2);
      ring.setAttribute('r', galaxy.maxR * +ring.dataset.k * (0.55 + 0.45 * halo));
    });
  }

  /* ---- órbitas animadas ---- */

  function placeClouds() {
    clouds.forEach((c) => {
      c.el.setAttribute('cx', galaxy.cx + Math.cos(c.angle) * rPix(c.r));
      c.el.setAttribute('cy', galaxy.cy + Math.sin(c.angle) * rPix(c.r) * 0.3);
    });
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (running && onScreen) {
      // La velocidad angular sale de la propia curva: ω = v(r)/r
      clouds.forEach((c) => { c.angle += (vTotal(c.r, f) / c.r) * 0.052 * dt; });
      placeClouds();
    }
    requestAnimationFrame(tick);
  }

  placeClouds();
  renderCurve();
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);

  /* ---- interacción con las nubes ---- */

  clouds.forEach((c, i) => {
    const show = () => {
      hovered = i;
      const v = Math.round(vTotal(c.r, f));
      tracerLabel.textContent = `${c.r} kpc · ${v} km/s`;
      tracerLabel.setAttribute('x', Math.min(galaxy.cx + rPix(c.r) + 12, plot.x - 90));
      tracerLabel.setAttribute('y', galaxy.cy - rPix(c.r) * 0.3 - 12);
      renderCurve();
    };
    c.el.addEventListener('mouseenter', show);
    c.el.addEventListener('click', show);
    c.el.addEventListener('mouseleave', () => {
      hovered = -1;
      tracerLabel.textContent = '';
      renderCurve();
    });
  });

  /* ---- la curva se dibuja sola al entrar en pantalla ---- */

  if (!reduceMotion) {
    const len = live.getTotalLength();
    live.style.strokeDasharray = len;
    live.style.strokeDashoffset = len;
    new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        live.style.transition = 'stroke-dashoffset 1.4s var(--ease)';
        live.style.strokeDashoffset = 0;
        setTimeout(() => {
          live.style.strokeDasharray = '';
          live.style.transition = '';
        }, 1500);
        obs.disconnect();
      });
    }, { threshold: 0.3 }).observe(svg);
  }

  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(svg);

  /* ---- API ---- */

  return {
    setMass(value) { f = value; renderCurve(); },
    getMass() { return f; },
    setRunning(v) { running = v; last = performance.now(); },
    isRunning() { return running; },
    setParticles(v) { showParticles = v; renderCurve(); },
    setExpected(v) { expected.style.display = v ? '' : 'none'; },
    velocityAt(r) { return vTotal(r, f); },
    ratio() { return massRatio(f); },
    tracerRadii: tracers
  };
}

/* Anima el control de masa de un valor a otro (para los presets) */
function tweenMass(lab, slider, to, onFrame, ms = 900) {
  const from = lab.getMass();
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / ms);
    const eased = 1 - Math.pow(1 - p, 3);
    const value = from + (to - from) * eased;
    lab.setMass(value);
    slider.value = Math.round(value * 100);
    onFrame();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------------- Montaje en la portada ---------------- */

function initHaloScene() {
  const svg = document.getElementById('haloArt');
  if (!svg) return;

  const lab = createHaloLab({
    svg,
    galaxy: { cx: 165, cy: 210, maxR: 130 },
    plot: { x: 330, y: 105, w: 235, h: 195 },
    tracers: [10, 22, 34],
    initialMass: 0
  });

  const slider = document.getElementById('haloMass');
  const preset = document.getElementById('haloPreset');
  const ratioOut = document.getElementById('haloRatio');
  const velOut = document.getElementById('haloVel');

  function readouts() {
    const ratio = lab.ratio();
    ratioOut.textContent = ratio < 0.05
      ? 'Solo materia visible'
      : `Halo · ${ratio.toFixed(1)}× la masa visible`;
    velOut.textContent = `Gas a 34 kpc: ${Math.round(lab.velocityAt(34))} km/s`;
    preset.setAttribute('aria-pressed', String(lab.getMass() > 0.05));
    preset.textContent = lab.getMass() > 0.05 ? 'QUITAR EL HALO' : 'AÑADIR EL HALO';
  }

  slider.addEventListener('input', () => {
    lab.setMass(+slider.value / 100);
    readouts();
  });

  preset.addEventListener('click', () => {
    tweenMass(lab, slider, lab.getMass() > 0.05 ? 0 : 0.85, readouts);
  });

  readouts();
}

/* ---------------- Montaje en halos.html ---------------- */

function initHaloFigure() {
  const svg = document.getElementById('haloArtFull');
  if (!svg) return;

  const lab = createHaloLab({
    svg,
    galaxy: { cx: 150, cy: 170, maxR: 118 },
    plot: { x: 315, y: 55, w: 245, h: 205 },
    tracers: [8, 18, 28, 38],
    initialMass: 0.85
  });

  const slider = document.getElementById('haloMassFull');
  const out = document.getElementById('haloMassOut');
  const play = document.getElementById('haloPlay');
  const dust = document.getElementById('haloParticlesBtn');
  const expected = document.getElementById('haloExpectedBtn');
  const readout = document.getElementById('haloReadoutFull');

  function readouts() {
    const ratio = lab.ratio();
    out.textContent = ratio < 0.05 ? 'sin halo' : `${ratio.toFixed(1)}× la masa visible`;
    readout.textContent = lab.tracerRadii
      .map((r) => `${r} kpc: ${Math.round(lab.velocityAt(r))} km/s`)
      .join('  ·  ');
  }

  slider.value = Math.round(lab.getMass() * 100);
  slider.addEventListener('input', () => { lab.setMass(+slider.value / 100); readouts(); });

  play.addEventListener('click', () => {
    lab.setRunning(!lab.isRunning());
    play.textContent = lab.isRunning() ? 'PAUSAR' : 'REANUDAR';
    play.setAttribute('aria-pressed', String(!lab.isRunning()));
  });

  let dustOn = true;
  dust.addEventListener('click', () => {
    dustOn = !dustOn;
    lab.setParticles(dustOn);
    dust.setAttribute('aria-pressed', String(dustOn));
  });

  let expOn = true;
  expected.addEventListener('click', () => {
    expOn = !expOn;
    lab.setExpected(expOn);
    expected.setAttribute('aria-pressed', String(expOn));
  });

  readouts();
}

document.addEventListener('DOMContentLoaded', () => {
  arranca('HaloScene', initHaloScene);
  arranca('HaloFigure', initHaloFigure);
});
