/* ============================================================
   El arte del cosmos — armazón de la portada
   Cada escena vive en su propio módulo:
     js/planets.js · js/stars.js · js/galaxies.js · js/halos.js · js/web.js
   Aquí solo queda lo que comparten: los puntos de navegación y
   la aparición de las escenas al entrar en pantalla.
   Depende de js/common.js (initReveal).
   ============================================================ */

function initDots() {
  const dots = [...document.querySelectorAll('.dots a')];

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      dots.forEach((d) => d.classList.toggle('is-active', d.dataset.dot === e.target.id));
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.scene').forEach((s) => spy.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  initDots();
  initReveal('.scene');
});
