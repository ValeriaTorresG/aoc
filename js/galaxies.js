/* ============================================================
   El arte del cosmos — la galaxia de la portada
   El disco gira de verdad: cada estrella lleva la velocidad
   angular que le toca por su radio (ω = v/r con curva plana),
   así que gira más rápido por dentro que por fuera.
   De ahí sale el dilema que se puede probar aquí:
     · si los brazos fueran materia, se enrollarían en pocas vueltas
     · como son una onda de densidad, se mantienen y las estrellas
       los atraviesan, encendiéndose al pasar
   Depende de js/common.js (svgEl, reduceMotion).
   ============================================================ */

const GAL = {
  cx: 300, cy: 210,
  rMax: 16,            // radio del disco en kpc
  pxPerKpc: 12,        // escala del dibujo
  vFlat: 220,          // curva de rotación plana, en km/s
  rTurn: 3,            // dentro de este radio la velocidad sube de forma lineal
  corotation: 11,      // radio donde la onda gira al mismo ritmo que las estrellas
  pitch: 0.38,         // apertura de la espiral logarítmica
  clock: 0.019         // segundos reales → radianes; fija el ritmo de la escena
};

/* Curva de rotación sencilla: sube y se aplana */
const galV = (r) => (r < GAL.rTurn ? GAL.vFlat * (r / GAL.rTurn) : GAL.vFlat);
const galOmega = (r) => galV(r) / Math.max(0.6, r);

function galRandom(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

function initGalaxyScene() {
  const svg = document.getElementById('galaxyArt');
  if (!svg) return;

  const rand = galRandom(53);
  const root = svgEl('g', { class: 'galaxy-lab' });
  const tilt = svgEl('g', { class: 'galaxy-tilt' });
  root.appendChild(tilt);
  svg.appendChild(root);

  /* ---- halo y bulbo ---- */

  tilt.appendChild(svgEl('ellipse', {
    class: 'galaxy-disc', cx: GAL.cx, cy: GAL.cy,
    rx: GAL.rMax * GAL.pxPerKpc, ry: GAL.rMax * GAL.pxPerKpc
  }));

  /* ---- los dos brazos, como patrón que gira aparte ---- */

  const pattern = svgEl('g', { class: 'arm-pattern' });
  pattern.style.transformOrigin = `${GAL.cx}px ${GAL.cy}px`;
  for (let arm = 0; arm < 2; arm++) {
    let d = '';
    for (let i = 0; i <= 40; i++) {
      const r = 2.5 + (GAL.rMax - 2.5) * (i / 40);
      const th = Math.log(r / 2.5) / GAL.pitch + arm * Math.PI;
      const x = GAL.cx + Math.cos(th) * r * GAL.pxPerKpc;
      const y = GAL.cy + Math.sin(th) * r * GAL.pxPerKpc;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    pattern.appendChild(svgEl('path', { class: 'arm-wave', d }));
  }
  tilt.appendChild(pattern);

  /* ---- estrellas ---- */

  const starG = svgEl('g', { class: 'disc-stars' });
  const stars = [];
  for (let i = 0; i < 560; i++) {
    const inArm = i % 5 !== 0;                       // cuatro de cada cinco nacen en un brazo
    const r = 1.2 + Math.pow(rand(), 0.75) * (GAL.rMax - 1.2);
    const arm = rand() < 0.5 ? 0 : Math.PI;
    const spread = inArm ? (rand() - 0.5) * 0.5 : rand() * Math.PI * 2;
    const theta = Math.log(Math.max(2.5, r) / 2.5) / GAL.pitch + arm + spread;
    const el = svgEl('circle', { class: 'disc-star', r: (rand() * 1.7 + 0.7).toFixed(1) });
    starG.appendChild(el);
    stars.push({ r, theta, theta0: theta, inArm, el });
  }
  tilt.appendChild(starG);

  tilt.appendChild(svgEl('ellipse', { class: 'galaxy-bulge', cx: GAL.cx, cy: GAL.cy, rx: 34, ry: 34 }));
  tilt.appendChild(svgEl('ellipse', { class: 'galaxy-core', cx: GAL.cx, cy: GAL.cy, rx: 15, ry: 15 }));

  /* ---- el Sol, para tener una referencia ---- */

  const sun = svgEl('circle', { class: 'sun-marker', r: 4.5 });
  const sunTag = Object.assign(svgEl('text', { class: 'sun-tag', 'text-anchor': 'middle' }), { textContent: 'EL SOL' });
  tilt.appendChild(sun);
  tilt.appendChild(sunTag);
  const sunOrbit = { r: 8, theta: 1.1 };

  /* ---- estado ---- */

  const slider = document.getElementById('galaxyTilt');
  const out = document.getElementById('galaxyTiltOut');
  const waveBtn = document.getElementById('galaxyWave');
  const matterBtn = document.getElementById('galaxyMatter');
  const resetBtn = document.getElementById('galaxyReset');
  const clockOut = document.getElementById('galaxyClock');

  let mode = 'wave';
  let myr = 0;                 // millones de años transcurridos
  let patternAngle = 0;
  let onScreen = true;

  const MYR_PER_TURN = 230;   // una vuelta del Sol, a 8 kpc del centro

  function setTilt() {
    const deg = +slider.value;
    const k = Math.max(0.08, Math.cos(deg * Math.PI / 180));
    tilt.setAttribute('transform', `translate(${GAL.cx} ${GAL.cy}) scale(1 ${k.toFixed(3)}) translate(${-GAL.cx} ${-GAL.cy})`);
    out.textContent = `${deg}°`;
  }

  function place() {
    const wrap = (a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    stars.forEach((s) => {
      const x = GAL.cx + Math.cos(s.theta) * s.r * GAL.pxPerKpc;
      const y = GAL.cy + Math.sin(s.theta) * s.r * GAL.pxPerKpc;
      s.el.setAttribute('cx', x.toFixed(1));
      s.el.setAttribute('cy', y.toFixed(1));

      if (mode === 'wave') {
        // ¿Está la estrella dentro de la cresta de la onda ahora mismo?
        const armPhase = wrap(s.theta - patternAngle - Math.log(Math.max(2.5, s.r) / 2.5) / GAL.pitch);
        const d = Math.min(armPhase, Math.abs(armPhase - Math.PI), 2 * Math.PI - armPhase);
        s.el.classList.toggle('is-forming', d < 0.32);
      } else {
        s.el.classList.toggle('is-forming', s.inArm);
      }
    });

    const sx = GAL.cx + Math.cos(sunOrbit.theta) * sunOrbit.r * GAL.pxPerKpc;
    const sy = GAL.cy + Math.sin(sunOrbit.theta) * sunOrbit.r * GAL.pxPerKpc;
    sun.setAttribute('cx', sx.toFixed(1));
    sun.setAttribute('cy', sy.toFixed(1));
    sunTag.setAttribute('x', sx.toFixed(1));
    sunTag.setAttribute('y', (sy - 12).toFixed(1));

    pattern.style.opacity = mode === 'wave' ? 0.75 : 0;
    pattern.setAttribute('transform',
      `rotate(${(patternAngle * 180 / Math.PI).toFixed(2)} ${GAL.cx} ${GAL.cy})`);
  }

  function clock() {
    const vueltas = myr / MYR_PER_TURN;
    clockOut.textContent = `${Math.round(myr).toLocaleString('es-ES')} millones de años · `
      + `${vueltas.toFixed(1)} vueltas del Sol`
      + (mode === 'matter' && vueltas > 1.4 ? ' · los brazos ya se han enrollado' : '');
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (onScreen) {
      stars.forEach((s) => { s.theta += galOmega(s.r) * GAL.clock * dt; });
      sunOrbit.theta += galOmega(sunOrbit.r) * GAL.clock * dt;
      patternAngle += galOmega(GAL.corotation) * GAL.clock * dt;
      myr += (galOmega(8) * GAL.clock * dt) / (2 * Math.PI) * MYR_PER_TURN;
      place();
      clock();
    }
    requestAnimationFrame(tick);
  }

  function setMode(next) {
    mode = next;
    waveBtn.setAttribute('aria-pressed', String(mode === 'wave'));
    matterBtn.setAttribute('aria-pressed', String(mode === 'matter'));
    reset();
  }

  function reset() {
    stars.forEach((s) => { s.theta = s.theta0; });
    sunOrbit.theta = 1.1;
    patternAngle = 0;
    myr = 0;
    place();
    clock();
  }

  slider.addEventListener('input', setTilt);
  waveBtn.addEventListener('click', () => setMode('wave'));
  matterBtn.addEventListener('click', () => setMode('matter'));
  resetBtn.addEventListener('click', reset);

  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(svg);

  setTilt();
  setMode('wave');
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => arranca('galaxia', initGalaxyScene));
