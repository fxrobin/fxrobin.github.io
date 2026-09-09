// Condense le header quand la lecture d'un article commence.
// Pages article uniquement (presence de .post .post-header), tous themes.
// Bascule .is-condensed sur .wrapper-masthead des que le titre sort de l'ecran.
(function() {
  var header = document.querySelector('.wrapper-masthead');
  var marker = document.querySelector('.post .post-header');
  if (!header || !marker) return;

  var ticking = false;
  function update() {
    ticking = false;
    var past = marker.getBoundingClientRect().bottom < 70;
    header.classList.toggle('is-condensed', past);
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
