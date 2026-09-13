// Reveal successif des cartes d'index en fondu rapide.
// La classe .js est posee des le <head> (default.html) pour eviter tout flash.
// Sans JS : cartes visibles (pas de .js). Sans IntersectionObserver : tout revele.
// Les cartes deja dans le viewport au chargement sont revelees immediatement
// (pas de premier paint vide). Securite : beforeprint + timeout de rattrapage.
// Decoupage du stagger par lots de 6 (60ms), transition 0.35s, mouvement reduit respecte en CSS.
(function() {
  var cards = document.querySelectorAll('.posts-grid .post-card');
  if (!cards.length) return;

  function show(el) { el.classList.add('revealed'); }
  function showAll() { Array.prototype.forEach.call(cards, show); }

  if (!('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      var i = parseInt(entry.target.getAttribute('data-reveal-index') || '0', 10);
      setTimeout(show, Math.min(i, 5) * 60, entry.target);
    });
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });

  Array.prototype.forEach.call(cards, function(el, i) {
    el.setAttribute('data-reveal-index', String(i % 6));
    // Carte deja visible au chargement : pas d'attente, pas de paint vide.
    if (inViewport(el)) { show(el); return; }
    io.observe(el);
  });

  // Rattrapage : si l'observer ne se declenche jamais (onglet en tache de fond,
  // screenshot headless...), on affiche tout au bout de 1,5 s. Idem en print.
  setTimeout(showAll, 1500);
  window.addEventListener('beforeprint', showAll);
})();
