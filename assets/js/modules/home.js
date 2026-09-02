// Homepage behaviour for the Omarchy-session desktop: a live clock in the
// Omarchy bar, workspace focus that tracks scrolling, the Omarchy-menu search,
// and a theme switch that repaints everything by rewriting the eight --rgb-*
// channels root.css derives every colour from — the same way an Omarchy theme
// swap recolours the whole shell.

const STORAGE_KEY = 'omarchy-vibe';

const THEMES = {
  'tokyo-night': {
    label: 'Tokyo Night', accent: '158, 206, 106',
    vars: { 'background-night': '26, 27, 38', 'background-storm': '36, 40, 59', 'terminal-black': '65, 72, 104', 'terminal-blue': '122, 162, 247', 'terminal-cyan': '125, 207, 255', 'terminal-white': '192, 202, 245', 'green': '158, 206, 106', 'turquoise': '180, 249, 248' },
  },
  'gruvbox': {
    label: 'Gruvbox', accent: '184, 187, 38',
    vars: { 'background-night': '40, 40, 40', 'background-storm': '60, 56, 54', 'terminal-black': '102, 92, 84', 'terminal-blue': '235, 219, 178', 'terminal-cyan': '131, 165, 152', 'terminal-white': '251, 241, 199', 'green': '184, 187, 38', 'turquoise': '254, 128, 25' },
  },
  'catppuccin': {
    label: 'Catppuccin', accent: '203, 166, 247',
    vars: { 'background-night': '30, 30, 46', 'background-storm': '49, 50, 68', 'terminal-black': '69, 71, 90', 'terminal-blue': '205, 214, 244', 'terminal-cyan': '137, 180, 250', 'terminal-white': '245, 224, 220', 'green': '166, 227, 161', 'turquoise': '148, 226, 213' },
  },
  'everforest': {
    label: 'Everforest', accent: '167, 192, 128',
    vars: { 'background-night': '45, 53, 59', 'background-storm': '52, 63, 68', 'terminal-black': '71, 82, 88', 'terminal-blue': '211, 198, 170', 'terminal-cyan': '127, 187, 179', 'terminal-white': '230, 226, 204', 'green': '167, 192, 128', 'turquoise': '230, 152, 117' },
  },
  'nord': {
    label: 'Nord', accent: '143, 188, 187',
    vars: { 'background-night': '46, 52, 64', 'background-storm': '59, 66, 82', 'terminal-black': '76, 86, 106', 'terminal-blue': '216, 222, 233', 'terminal-cyan': '136, 192, 208', 'terminal-white': '236, 239, 244', 'green': '163, 190, 140', 'turquoise': '143, 188, 187' },
  },
  'rose-pine': {
    label: 'Rosé Pine', accent: '196, 167, 231',
    vars: { 'background-night': '25, 23, 36', 'background-storm': '31, 29, 46', 'terminal-black': '64, 61, 82', 'terminal-blue': '224, 222, 244', 'terminal-cyan': '156, 207, 216', 'terminal-white': '224, 222, 244', 'green': '246, 193, 119', 'turquoise': '235, 188, 186' },
  },
};

const DEFAULT_THEME = 'tokyo-night';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value != null && Object.hasOwn(THEMES, value) ? value : null;
  } catch { return null; }
}

function store(name) {
  try { localStorage.setItem(STORAGE_KEY, name); } catch { /* blocked storage */ }
}


/* ----------------------------------------------------------------- clock -- */

function startClock() {
  const out = document.querySelector('[data-clock]');
  if (out == null) return;
  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    out.textContent = `${hh}:${mm}`;
  };
  tick();
  window.setInterval(tick, 15000);
}


/* ------------------------------------------------------------ theme swap -- */

function applyTheme(name) {
  const theme = THEMES[name];
  if (theme == null) return;
  const root = document.documentElement;
  for (const [channel, value] of Object.entries(theme.vars)) {
    root.style.setProperty(`--rgb-${channel}`, value);
  }
  root.style.setProperty('--vibe-accent', `rgb(${theme.accent})`);
  root.dataset.vibe = name;
  for (const el of document.querySelectorAll('[data-theme-name]')) {
    el.textContent = theme.label;
  }
}

const CONTROL_SELECTOR = '.vibe__chip[data-theme], .thememenu__item[data-theme]';

function startVibe() {
  // Every place a theme can be picked — the tile chips and the bar menu —
  // is one flat list of controls that all reflect the same current choice.
  const controls = [...document.querySelectorAll(CONTROL_SELECTOR)];

  for (const control of controls) {
    const accent = THEMES[control.dataset.theme]?.accent;
    if (accent == null) continue;
    control.style.setProperty('--vibe-accent', `rgb(${accent})`);
    const dot = control.querySelector('.vibe__dot, .thememenu__dot');
    if (dot != null) dot.style.background = `rgb(${accent})`;
  }

  const reflect = (name) => {
    for (const control of controls) {
      control.setAttribute('aria-pressed', control.dataset.theme === name ? 'true' : 'false');
    }
  };

  let current = readStored() ?? DEFAULT_THEME;
  applyTheme(current);
  reflect(current);

  // The Omarchy-bar theme dropdown, if present.
  const menu = document.querySelector('[data-theme-menu]');
  const toggle = menu?.querySelector('.bar__theme');
  const pop = menu?.querySelector('.thememenu__pop');
  const closeMenu = () => {
    if (toggle == null || pop == null) return;
    toggle.setAttribute('aria-expanded', 'false');
    pop.hidden = true;
  };
  if (toggle != null && pop != null) {
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = pop.hidden;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      pop.hidden = !open;
    });
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) closeMenu();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const pick = (name) => {
    if (name === 'surprise') {
      const pool = Object.keys(THEMES).filter((key) => key !== current);
      name = pool[Math.floor(Math.random() * pool.length)];
    }
    current = name;
    applyTheme(name);
    reflect(name);
    store(name);
  };

  // One delegated handler covers chips and menu items wherever they live.
  document.addEventListener('click', (event) => {
    const control = event.target.closest(CONTROL_SELECTOR);
    if (control == null) return;
    pick(control.dataset.theme);
    closeMenu();
  });
}


/* -------------------------------------------------------------- launcher -- */

function startLauncher() {
  const input = document.querySelector('.launcher__input');
  const grid = document.querySelector('.launcher__grid');
  if (input == null || grid == null) return;

  const apps = [...grid.querySelectorAll('.app')];
  const count = document.querySelector('[data-launcher-count]');
  const empty = document.querySelector('.launcher__empty');

  const filter = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    for (const app of apps) {
      const hit = q === '' || (app.dataset.name ?? app.textContent).toLowerCase().includes(q);
      app.hidden = !hit;
      if (hit) shown += 1;
    }
    if (count != null) count.textContent = `${shown}/${apps.length}`;
    if (empty != null) empty.hidden = shown !== 0;
  };

  input.addEventListener('input', filter);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const first = apps.find((app) => !app.hidden);
      if (first != null) first.click();
    }
    if (event.key === 'Escape') { input.value = ''; filter(); }
  });
  filter();
  return input;
}


/* ------------------------------------------------------- workspace focus -- */

function startWorkspaces(launcherInput) {
  const pills = [...document.querySelectorAll('.bar__ws[data-ws]')];
  const sections = pills
    .map((pill) => document.getElementById(pill.dataset.ws))
    .filter((el) => el != null);
  if (sections.length === 0) return;

  const setActive = (id) => {
    for (const pill of pills) pill.classList.toggle('is-active', pill.dataset.ws === id);
  };

  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) seen.set(entry.target.id, entry.intersectionRatio);
        let best = null;
        let bestRatio = 0;
        for (const [id, ratio] of seen) {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        }
        if (best != null && bestRatio > 0) setActive(best);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    for (const section of sections) observer.observe(section);
  }

  // SUPER-key muscle memory: 1–4 jump workspaces, / focuses the launcher.
  window.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!typing && event.key === '/') {
      if (launcherInput != null) { event.preventDefault(); launcherInput.focus(); }
      return;
    }
    if (typing) return;
    const n = Number.parseInt(event.key, 10);
    if (Number.isInteger(n) && n >= 1 && n <= pills.length) {
      const pill = pills[n - 1];
      const target = document.getElementById(pill.dataset.ws);
      if (target != null) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActive(pill.dataset.ws); }
    }
  });
}


/* ----------------------------------------------------- fastfetch icon fit -- */

// Real fastfetch sizes the logo to the height of the info column beside it.
// The icon is a fixed-cell <pre>, so we scale its font-size until its rendered
// height matches the info block — but only when they sit side by side (wide
// screens); stacked, the icon keeps its own modest size.
function startFastfetchFit() {
  const icon = document.querySelector('.ff__icon');
  const info = document.querySelector('.ff__info');
  if (icon == null || info == null) return;

  const sideBySide = window.matchMedia('(min-width: 60em)');

  const fit = () => {
    if (!sideBySide.matches) { icon.style.fontSize = ''; return; }
    icon.style.fontSize = '';
    const ff = icon.closest('.ff');
    const baseFs = parseFloat(getComputedStyle(icon).fontSize);
    const baseH = icon.offsetHeight;
    const baseW = icon.offsetWidth;
    const gap = parseFloat(getComputedStyle(ff).columnGap) || 0;
    const availW = ff.clientWidth - info.offsetWidth - gap;
    const targetH = info.offsetHeight;
    if (baseFs > 0 && baseH > 0 && baseW > 0 && availW > 0 && targetH > 0) {
      // As large as fits: bounded by the info's height and the free width in
      // this column, whichever is tighter.
      const byHeight = baseFs * (targetH / baseH);
      const byWidth = baseFs * (availW / baseW);
      let fs = Math.min(byHeight, byWidth, baseFs * 3.2);
      fs = Math.max(fs, baseFs * 0.5); // don't shrink into illegibility
      icon.style.fontSize = `${fs}px`;
    }
  };

  fit();
  if (document.fonts?.ready != null) document.fonts.ready.then(fit);

  let frame = 0;
  window.addEventListener('resize', () => {
    if (frame !== 0) return;
    frame = requestAnimationFrame(() => { frame = 0; fit(); });
  });
}


function ready() {
  if (!document.documentElement.classList.contains('wte-home')) return;
  startClock();
  startVibe();
  const launcherInput = startLauncher();
  startWorkspaces(launcherInput);
  startFastfetchFit();
}

export { ready };
