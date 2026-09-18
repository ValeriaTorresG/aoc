/* ============================================================
   El arte del cosmos — el sistema planetario de la portada
   Las órbitas son elipses de verdad, con la estrella en un foco,
   y los planetas se mueven resolviendo la ecuación de Kepler:
     · segunda ley → cerca del sol corren, lejos se demoran
     · tercera ley → el periodo crece como a^1,5
   Las distancias están calibradas con el sistema solar: 0,39 UA
   para la órbita interior, así que los periodos y las velocidades
   que aparecen son los reales.
   Depende de js/common.js (svgEl, reduceMotion).
   ============================================================ */

const PX_PER_AU = 159;
const AU_KMS = 29.78;          // velocidad de la Tierra, en km/s

/* Ecuación de Kepler: de la anomalía media a la excéntrica */
function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/* Posición en la elipse, con el foco en el origen */
function orbitPoint(a, e, E, omega) {
  const b = a * Math.sqrt(1 - e * e);
  const x = a * (Math.cos(E) - e);
  const y = b * Math.sin(E);
  return {
    x: x * Math.cos(omega) - y * Math.sin(omega),
    y: x * Math.sin(omega) + y * Math.cos(omega)
  };
}

function initPlanetScene() {
  const svg = document.getElementById('planetArt');
  if (!svg) return;

  const CX = 300, CY = 205;
  const root = svgEl('g', { class: 'planet-lab' });
  svg.appendChild(root);

  const BODIES = [
    { a: 62, e: 0.02, omega: 0.4, size: 6, cls: 'planet--coral', name: 'roca pequeña' },
    { a: 104, e: 0.24, omega: 2.6, size: 11, cls: 'planet--blush', name: 'mundo excéntrico' },
    { a: 152, e: 0.05, omega: 4.2, size: 9, cls: 'planet--cream', name: 'gemelo de la Tierra', moon: true },
    { a: 214, e: 0.33, omega: 1.2, size: 14, cls: 'planet--blush', name: 'gigante con anillo', ring: true }
  ];

  /* Órbitas: elipses con la estrella en un foco */
  BODIES.forEach((p) => {
    const b = p.a * Math.sqrt(1 - p.e * p.e);
    root.appendChild(svgEl('ellipse', {
      class: 'ring orbit-path',
      cx: CX - p.a * p.e, cy: CY, rx: p.a, ry: b,
      transform: `rotate(${(p.omega * 180 / Math.PI).toFixed(1)} ${CX} ${CY})`
    }));
  });

  root.appendChild(svgEl('circle', { class: 'star-corona', cx: CX, cy: CY, r: 52 }));
  root.appendChild(svgEl('circle', { class: 'sun', cx: CX, cy: CY, r: 26 }));

  /* Cada planeta: estela, cara iluminada y cara nocturna */
  BODIES.forEach((p) => {
    p.trail = svgEl('path', { class: 'orbit-trail' });
    p.g = svgEl('g', { class: 'planet-body', tabindex: '0' });
    if (p.ring) p.g.appendChild(svgEl('ellipse', { class: 'planet-ring', rx: p.size * 2.1, ry: p.size * 0.7 }));
    p.night = svgEl('circle', { class: `planet planet--night ${p.cls}`, r: p.size });
    p.day = svgEl('path', { class: `planet ${p.cls}` });
    p.g.appendChild(p.night);
    p.g.appendChild(p.day);
    if (p.moon) {
      p.moonEl = svgEl('circle', { class: 'moon-dot', r: 3 });
      p.g.appendChild(p.moonEl);
    }
    root.appendChild(p.trail);
    root.appendChild(p.g);
  });

  const slider = document.getElementById('planetSpeed');
  const speedOut = document.getElementById('planetSpeedOut');
  const readout = document.getElementById('planetReadout');

  let speed = +slider.value;
  let t = 0;
  let onScreen = true;

  const periodYears = (p) => Math.pow(p.a / PX_PER_AU, 1.5);      // tercera ley de Kepler

  function place() {
    BODIES.forEach((p) => {
      const n = 2 * Math.PI / (periodYears(p) * 9);                // 9 segundos por año terrestre
      const M = t * n;
      const E = solveKepler(M % (2 * Math.PI), p.e);
      const pos = orbitPoint(p.a, p.e, E, p.omega);
      const x = CX + pos.x, y = CY + pos.y;
      p.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

      // La mitad iluminada mira siempre a la estrella
      const phi = Math.atan2(CY - y, CX - x);
      const r = p.size;
      p.day.setAttribute('d',
        `M${(Math.cos(phi - Math.PI / 2) * r).toFixed(1)} ${(Math.sin(phi - Math.PI / 2) * r).toFixed(1)} `
        + `A${r} ${r} 0 0 1 ${(Math.cos(phi + Math.PI / 2) * r).toFixed(1)} ${(Math.sin(phi + Math.PI / 2) * r).toFixed(1)} Z`);

      if (p.moonEl) {
        const ma = M * 11;   // la luna da once vueltas por cada una del planeta
        p.moonEl.setAttribute('cx', (Math.cos(ma) * (p.size + 9)).toFixed(1));
        p.moonEl.setAttribute('cy', (Math.sin(ma) * (p.size + 9)).toFixed(1));
      }

      // Estela: el trocito de órbita que acaba de recorrer
      let d = '';
      for (let k = 0; k <= 12; k++) {
        const back = solveKepler(((M - 0.55 * (k / 12)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), p.e);
        const q = orbitPoint(p.a, p.e, back, p.omega);
        d += `${k ? 'L' : 'M'}${(CX + q.x).toFixed(1)} ${(CY + q.y).toFixed(1)}`;
      }
      p.trail.setAttribute('d', d);
    });
  }

  function describe(p) {
    const aAU = p.a / PX_PER_AU;
    const T = periodYears(p);
    const v = AU_KMS / Math.sqrt(aAU);
    const fast = Math.sqrt((1 + p.e) / (1 - p.e));
    readout.textContent = `${aAU.toFixed(2).replace('.', ',')} UA · una vuelta cada `
      + `${T < 1 ? `${Math.round(T * 365)} días` : `${T.toFixed(2).replace('.', ',')} años`} · `
      + `${Math.round(v)} km/s de media`
      + (p.e > 0.1 ? ` · en el perihelio corre un ${Math.round((fast - 1) * 100)} % más` : '');
  }

  BODIES.forEach((p) => {
    p.g.addEventListener('mouseenter', () => describe(p));
    p.g.addEventListener('focus', () => describe(p));
    p.g.addEventListener('mouseleave', () => { readout.textContent = 'Pasa el cursor por un planeta'; });
  });

  slider.addEventListener('input', () => {
    speed = +slider.value;
    speedOut.textContent = `${speed.toFixed(2).replace('.', ',')}×`;
  });

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (onScreen) { t += dt * speed; place(); }
    requestAnimationFrame(tick);
  }

  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(svg);

  place();
  readout.textContent = 'Pasa el cursor por un planeta';
  // El movimiento no es adorno en esta pieza: es lo que se explica. Si el sistema
  // pide reducir movimiento se apagan los efectos decorativos (destellos, derivas,
  // trazos animados, todo eso vive en el CSS), pero las órbitas y los recorridos
  // siguen, porque sin ellos no queda nada que mirar. Cada uno tiene su control
  // para pararlo o ajustarlo.
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', () => arranca('planetas', initPlanetScene));
