// Ecran CRT des blocs .intro (theme retro).
// - injecte le bandeau VBL .crt-vbl (anime en CSS, voir _sass/_article.scss) ;
// - pose .crt-paused hors viewport ou onglet cache (animation suspendue) ;
// - pose .glitching 0,22 s a intervalles aleatoires (4 a 12 s) quand l'ecran est visible.
// Le rendu reste pilote par le CSS : en Classic/Dark, mobile ou mouvement reduit,
// le bandeau et le glitch ne sont pas affiches.
(function() {
  var screens = document.querySelectorAll('.entry .intro');
  if (!screens.length) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(screens, function(el) {
    if (el.querySelector('.crt-vbl')) return;
    var vbl = document.createElement('div');
    vbl.className = 'crt-vbl';
    vbl.setAttribute('aria-hidden', 'true');
    el.insertBefore(vbl, el.firstChild);
  });

  function isPaused(el) { return document.hidden || el.getAttribute('data-crt-visible') === 'false'; }
  function refresh(el) { el.classList.toggle('crt-paused', isPaused(el)); }
  function refreshAll() { Array.prototype.forEach.call(screens, refresh); }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        entry.target.setAttribute('data-crt-visible', entry.isIntersecting ? 'true' : 'false');
        refresh(entry.target);
      });
    });
    Array.prototype.forEach.call(screens, function(el) { io.observe(el); });
  }
  document.addEventListener('visibilitychange', refreshAll);

  if (reduced) return;

  function glitch(el) {
    if (!isPaused(el)) {
      el.classList.add('glitching');
      setTimeout(function() { el.classList.remove('glitching'); }, 220);
    }
    setTimeout(glitch, 4000 + Math.random() * 8000, el);
  }
  Array.prototype.forEach.call(screens, function(el) {
    setTimeout(glitch, 2000 + Math.random() * 6000, el);
  });
})();
