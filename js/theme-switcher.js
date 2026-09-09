(function() {
  var STORAGE_KEY = 'fx-theme';
  var THEMES = ['retro', 'classic', 'dark'];
  var META_COLOR = { retro: '#0A0A0A', classic: '#FAFAF9', dark: '#0D1117' };
  var docEl = document.documentElement;

  function getStoredTheme() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return THEMES.indexOf(v) !== -1 ? v : 'retro';
    } catch(e) { return currentAttrTheme(); }
  }
  function currentAttrTheme() {
    var t = docEl.getAttribute('data-theme');
    return THEMES.indexOf(t) !== -1 ? t : 'retro';
  }
  function storeTheme(v) {
    try {
      if (v === 'retro') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, v);
    } catch(e) {}
  }
  function current() { return currentAttrTheme(); }
  function isClassic() { return current() === 'classic'; }

  function applyTheme(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'retro';
    if (theme === 'retro') docEl.removeAttribute('data-theme');
    else docEl.setAttribute('data-theme', theme);
    // theme-color meta for mobile browser chrome
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', META_COLOR[theme]);
    // Sync segmented control
    document.querySelectorAll('[data-theme-set]').forEach(function(btn){
      var active = btn.getAttribute('data-theme-set') === theme;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('active', active);
    });
  }

  function set(theme) {
    applyTheme(theme);
    storeTheme(current());
  }
  function cycle() {
    var next = THEMES[(THEMES.indexOf(current()) + 1) % THEMES.length];
    set(next);
  }

  // Init: sync UI with early inline script (data-theme already set before CSS)
  function init() {
    applyTheme(getStoredTheme());

    // Bind segmented buttons
    document.querySelectorAll('[data-theme-set]').forEach(function(btn){
      btn.addEventListener('click', function(){ set(btn.getAttribute('data-theme-set')); });
    });
    // Keyboard: Alt+C cycles through themes
    document.addEventListener('keydown', function(e){
      if ((e.key === 'c' || e.key === 'C') && e.altKey) { e.preventDefault(); cycle(); }
    });
    // Cross-tab sync
    window.addEventListener('storage', function(e){
      if (e.key === STORAGE_KEY) applyTheme(getStoredTheme());
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for console (toggle kept as cycle alias for backward compat)
  window.FXTheme = { set: set, toggle: cycle, cycle: cycle, current: current, isClassic: isClassic };
})();
