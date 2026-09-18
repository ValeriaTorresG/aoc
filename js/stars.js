/* ============================================================
   El arte del cosmos — la estrella de la portada
   Aquí solo se elige una cosa, la masa. Todo lo demás sale de
   las relaciones de la secuencia principal:
     L ∝ M^3,5   ·   R ∝ M^0,57   ·   T = 5772·(L/R²)^¼
     vida ≈ 10 000 millones de años × M/L
   Por eso una estrella diez veces más masiva que el Sol brilla
   cuatro mil veces más y dura mil veces menos.
   Depende de js/common.js (svgEl, rampColor, reduceMotion).
   ============================================================ */

/* Del rojo frío al azul caliente, dentro de la paleta de la pieza */
const STAR_RAMP = [
  [2500,  [232, 69, 44]],
  [4200,  [255, 107, 74]],
  [5800,  [242, 188, 168]],
  [7500,  [239, 231, 218]],
  [12000, [200, 214, 255]],
  [40000, [169, 195, 255]]
];

const starColor = (k) => rampColor(STAR_RAMP, k);

const spectralType = (k) =>
  k >= 30000 ? 'O' : k >= 10000 ? 'B' : k >= 7500 ? 'A'
  : k >= 6000 ? 'F' : k >= 5200 ? 'G' : k >= 3700 ? 'K' : 'M';

/* Luminosidad en soles, por tramos de masa */
function msLuminosity(m) {
  if (m < 0.43) return 0.23 * Math.pow(m, 2.3);
  if (m < 2) return Math.pow(m, 4);
  return 1.4 * Math.pow(m, 3.5);
}

const msRadius = (m) => (m < 1 ? Math.pow(m, 0.8) : Math.pow(m, 0.57));
const msTemp = (m) => 5772 * Math.pow(msLuminosity(m) / Math.pow(msRadius(m), 2), 0.25);
const msLife = (m) => 10e9 * m / msLuminosity(m);          // en años

function starRandom(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/* 10 000 millones · 30 millones · 350 mil millones */
function formatYears(y) {
  if (y >= 1e12) return `${(y / 1e12).toFixed(1).replace('.', ',')} billones de años`;
  if (y >= 1e9) return `${Math.round(y / 1e8) / 10} mil millones de años`.replace('.', ',');
  return `${Math.round(y / 1e6)} millones de años`;
}

function initStarScene() {
  const svg = document.getElementById('starArt');
  if (!svg) return;

  const CX = 175, CY = 205;
  const rand = starRandom(67);
  const root = svgEl('g', { class: 'star-lab' });
  svg.appendChild(root);

  /* ---- la estrella ---- */

  const corona = svgEl('circle', { class: 'star-corona', cx: CX, cy: CY });
  const body = svgEl('circle', { class: 'star-body', cx: CX, cy: CY });
  const grainG = svgEl('g', { class: 'granulation' });
  const flareG = svgEl('g', { class: 'flares' });
  root.appendChild(corona);
  root.appendChild(body);
  root.appendChild(grainG);
  root.appendChild(flareG);

  const grains = Array.from({ length: 46 }, () => {
    const el = svgEl('circle', { class: 'grain' });
    if (!reduceMotion) el.style.animation = `simmer ${(2.5 + rand() * 3).toFixed(1)}s ease-in-out ${(rand() * 4).toFixed(1)}s infinite`;
    grainG.appendChild(el);
    return { u: rand(), th: rand() * Math.PI * 2, size: 0.1 + rand() * 0.16, drift: (rand() - 0.5) * 0.25, el };
  });

  const flares = Array.from({ length: 3 }, () => {
    const el = svgEl('path', { class: 'flare' });
    flareG.appendChild(el);
    return { el, th: rand() * 6.28, life: rand(), speed: 0.3 + rand() * 0.4 };
  });

  /* Referencia: el Sol al lado, para comparar tamaños */
  const sunRef = svgEl('circle', { class: 'sun-ref', cx: 66, cy: 352, r: 40 * Math.pow(1, 0.45) });
  root.appendChild(sunRef);
  root.appendChild(Object.assign(svgEl('text', { class: 'axis-label', x: 66, y: 400, 'text-anchor': 'middle' }), { textContent: 'EL SOL' }));

  /* ---- diagrama H-R en miniatura ---- */

  const plot = { x: 360, y: 70, w: 190, h: 250 };
  const HX = (k) => plot.x + plot.w * (Math.log10(50000) - Math.log10(k)) / (Math.log10(50000) - Math.log10(2400));
  const HY = (l) => plot.y + plot.h * (Math.log10(3e5) - Math.log10(l)) / (Math.log10(3e5) - Math.log10(1e-4));

  const hr = svgEl('g', { class: 'hr-mini' });
  const axes = svgEl('g', { class: 'axes' });
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} H${plot.x + plot.w}` }));
  axes.appendChild(svgEl('path', { d: `M${plot.x} ${plot.y + plot.h} V${plot.y}` }));
  hr.appendChild(axes);

  let dMS = '';
  for (let i = 0; i <= 60; i++) {
    const m = 0.1 * Math.pow(300, i / 60);
    dMS += `${i ? 'L' : 'M'}${HX(msTemp(m)).toFixed(1)} ${HY(msLuminosity(m)).toFixed(1)}`;
  }
  hr.appendChild(svgEl('path', { class: 'ms-line', d: dMS }));
  hr.appendChild(svgEl('circle', { class: 'hr-sun', cx: HX(5772), cy: HY(1), r: 3.5 }));
  hr.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label', x: HX(5772) + 8, y: HY(1) + 4, 'text-anchor': 'start' }), { textContent: 'SOL' }));
  hr.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label', x: plot.x, y: plot.y - 12, 'text-anchor': 'start' }), { textContent: 'LUMINOSIDAD' }));
  hr.appendChild(Object.assign(svgEl('text', { class: 'axis-label plot-label', x: plot.x + plot.w, y: plot.y + plot.h + 22, 'text-anchor': 'end' }), { textContent: '← MÁS FRÍA' }));
  const marker = svgEl('circle', { class: 'hr-marker', r: 6 });
  hr.appendChild(marker);
  root.appendChild(hr);

  /* ---- estado ---- */

  const slider = document.getElementById('starMass');
  const massOut = document.getElementById('starMassOut');
  const detail = document.getElementById('starDetail');

  let M = 1, T = 5772, R = 1, L = 1, rPix = 40;

  function update() {
    M = 0.1 * Math.pow(300, +slider.value / 100);
    L = msLuminosity(M);
    R = msRadius(M);
    T = msTemp(M);
    rPix = 40 * Math.pow(R, 0.45);

    const color = starColor(T);
    body.setAttribute('r', rPix.toFixed(1));
    body.style.fill = color;
    corona.setAttribute('r', (rPix * 1.42).toFixed(1));
    corona.style.fill = color;
    corona.style.opacity = (0.1 + Math.min(0.3, Math.log10(L + 1) * 0.12)).toFixed(2);

    marker.setAttribute('cx', HX(T).toFixed(1));
    marker.setAttribute('cy', HY(L).toFixed(1));
    marker.style.fill = color;

    massOut.textContent = `${M < 10 ? M.toFixed(1).replace('.', ',') : Math.round(M)} masas solares`;
    detail.textContent = `${Math.round(T / 10) * 10} K · tipo ${spectralType(T)} · `
      + `${L < 10 ? L.toFixed(2).replace('.', ',') : Math.round(L).toLocaleString('es-ES')} veces la luz del Sol · `
      + `vive ${formatYears(msLife(M))}`;
  }

  /* ---- animación: granulación y fulguraciones ---- */

  let t = 0, onScreen = true;
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    if (onScreen) {
      grains.forEach((g) => {
        g.th += g.drift * dt;
        const rr = Math.sqrt(g.u) * rPix * 0.86;
        g.el.setAttribute('cx', (CX + Math.cos(g.th) * rr).toFixed(1));
        g.el.setAttribute('cy', (CY + Math.sin(g.th) * rr).toFixed(1));
        g.el.setAttribute('r', (g.size * rPix).toFixed(1));
      });

      // Cuanto más caliente, más actividad en la superficie
      const rate = 0.25 + Math.min(1.4, T / 14000);
      flares.forEach((f) => {
        f.life += dt * f.speed * rate;
        if (f.life > 1) { f.life = 0; f.th = Math.random() * 6.28; }
        const grow = Math.sin(f.life * Math.PI);
        const r0 = rPix * 0.98, r1 = rPix * (1 + 0.45 * grow);
        const a = f.th, spread = 0.32;
        f.el.setAttribute('d',
          `M${CX + Math.cos(a - spread) * r0} ${CY + Math.sin(a - spread) * r0} `
          + `Q${CX + Math.cos(a) * r1 * 1.15} ${CY + Math.sin(a) * r1 * 1.15} `
          + `${CX + Math.cos(a + spread) * r0} ${CY + Math.sin(a + spread) * r0}`);
        f.el.style.opacity = (grow * 0.75).toFixed(2);
        f.el.style.stroke = starColor(Math.min(40000, T * 1.4));
      });
    }
    requestAnimationFrame(tick);
  }

  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(svg);
  slider.addEventListener('input', update);

  update();
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => arranca('estrella', initStarScene));
