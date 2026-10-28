// Bibliothèque : les médias de fixtures/, listés au build dans fixtures/index.txt
// (un hébergement statique ne liste pas ses répertoires). Un toucher télécharge
// le fichier et le confie à mount(nom, octets), qui l'oriente selon l'extension.

const FORMATS = {
  fd: { label: 'FD', title: 'Disquette' },
  sd: { label: 'SD', title: 'Carte SDDrive' },
  rom: { label: 'ROM', title: 'Cartouche' },
};

/** Format d'un nom de fichier (fd, sd, rom) ou null. */
export function formatOf(name) {
  const ext = name.toLowerCase().split('.').pop();
  return ext in FORMATS ? ext : null;
}

function niceName(file) {
  return file.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
}

/**
 * Remplit `list` avec la bibliothèque et branche les filtres `chips`
 * (boutons data-format = all | fd | sd | rom). `version` invalide le cache
 * d'un déploiement à l'autre ; `onStatus` rend compte du téléchargement.
 */
export async function createLibrary(list, chips, version, mount, onStatus) {
  let files = [];
  try {
    const response = await fetch(`fixtures/index.txt?v=${version}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    files = (await response.text()).split('\n').map(s => s.trim()).filter(formatOf);
  } catch (e) {
    list.textContent = 'Bibliothèque indisponible.';
    console.error(e);
    return;
  }

  let filter = 'all';
  function render() {
    list.replaceChildren();
    for (const file of files) {
      const format = formatOf(file);
      if (filter !== 'all' && filter !== format) continue;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'lib-item';
      item.title = `${FORMATS[format].title} : ${file}`;
      const badge = document.createElement('span');
      badge.className = `badge badge-${format}`;
      badge.textContent = FORMATS[format].label;
      const name = document.createElement('span');
      name.className = 'lib-name';
      name.textContent = niceName(file);
      item.append(badge, name);
      item.addEventListener('click', () => load(file));
      list.append(item);
    }
  }

  async function load(file) {
    onStatus(`chargement de ${file}…`);
    try {
      const response = await fetch(`fixtures/${encodeURIComponent(file)}?v=${version}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      mount(file, new Int8Array(await response.arrayBuffer()));
    } catch (e) {
      onStatus(`échec : ${file}`);
      console.error(e);
    }
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      filter = chip.dataset.format;
      for (const c of chips) c.setAttribute('aria-pressed', String(c === chip));
      render();
    });
  }
  render();
}
