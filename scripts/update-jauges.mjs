// Relève le nombre d'inscrits des tournois du club sur Badnet et met à jour les jauges
// de tournois.html et index.html (npm run update:jauges, lancé chaque jour par GitHub Actions).
//
// Badnet charge le compteur en JavaScript : on rend la page avec Chrome headless (--dump-dom)
// puis on lit « Nombre de joueurs : 21/110 » (ou « : 6 » quand aucun maximum n'est fixé).
// Seul le total est relevé, jamais les noms des joueurs.
//
// Les jauges sont du HTML statique entre deux marqueurs : <!-- jauge:slug --> … <!-- /jauge:slug -->.
// La date affichée est celle du dernier changement de chiffres : sans changement, les fichiers
// restent identiques et le workflow ne crée pas de commit.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('../', import.meta.url);
const STATE = new URL('scripts/jauges.json', ROOT);
const PAGES = ['tournois.html', 'index.html'];

// Tournois suivis : eventid Badnet, clôture des inscriptions et dernier jour (AAAA-MM-JJ).
// À mettre à jour chaque saison, avec les marqueurs correspondants dans les pages.
const TOURNOIS = [
  { slug: 'interne', eventid: 51743, cloture: '2026-10-05', fin: '2026-10-06' },
  { slug: 'after-bob', eventid: 51327, cloture: '2026-10-14', fin: '2026-10-24' },
  { slug: 'simplement-bob', eventid: 51641, cloture: '2026-11-25', fin: '2026-12-05' },
  { slug: 'bobminton', eventid: 51493, cloture: '2027-01-27', fin: '2027-02-07' },
];

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());

function findChrome() {
  for (const c of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    if (spawnSync('which', [c]).status === 0) return c;
  }
  throw new Error('Chrome/Chromium introuvable');
}

function releve(chrome, eventid) {
  const url = `https://badnet.fr/tournoi/public?eventid=${eventid}`;
  for (let essai = 1; essai <= 3; essai++) {
    const r = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox',
      '--virtual-time-budget=10000', '--dump-dom', url], { encoding: 'utf8', timeout: 90_000 });
    const m = /Nombre de joueurs\s*:\s*(\d+)(?:\s*\/\s*(\d+))?/.exec(r.stdout ?? '');
    if (m) return { count: Number(m[1]), max: m[2] ? Number(m[2]) : null };
  }
  return null;
}

const dateFr = (d) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  .format(new Date(`${d}T00:00:00Z`));
const inscrits = (n) => `${n} inscrit${n > 1 ? 's' : ''}`;

function texte(t, s, compact) {
  const ouvert = today <= t.cloture;
  if (s.max && s.count >= s.max) {
    if (compact) return `<strong>Complet</strong>${ouvert ? ' · liste d’attente' : ''}`;
    return `<strong>Complet</strong> : ${inscrits(s.count)} pour ${s.max} places${ouvert ? ', liste d’attente ouverte' : ''}`;
  }
  if (s.max) return compact ? `<strong>${s.count} / ${s.max}</strong> inscrits` : `<strong>${inscrits(s.count)}</strong> sur ${s.max} places`;
  return `<strong>${inscrits(s.count)}</strong>`;
}

function jauge(t, s, compact) {
  const full = s.max && s.count >= s.max;
  const cls = `jauge${compact ? ' jauge--compact' : ''}${full ? ' jauge--full' : ''}`;
  const bar = s.max
    ? `<progress class="jauge__bar" value="${Math.min(s.count, s.max)}" max="${s.max}" aria-label="${s.count} inscrits pour ${s.max} places">${s.count} / ${s.max}</progress>`
    : '';
  const quand = compact ? '' : `<span class="jauge__date">Badnet · dernier changement le ${dateFr(s.changed)}</span>`;
  return `<span class="${cls}">${bar}<span class="jauge__text">${texte(t, s, compact)}</span>${quand}</span>`;
}

// ---- Relevé ----
const state = JSON.parse(readFileSync(STATE, 'utf8'));
const chrome = findChrome();
let echecs = 0;
for (const t of TOURNOIS) {
  if (today > t.fin) { console.log(`${t.slug} : terminé, jauge figée`); continue; }
  const r = releve(chrome, t.eventid);
  if (!r) { echecs++; console.error(`${t.slug} : compteur introuvable sur Badnet (eventid ${t.eventid})`); continue; }
  const prev = state[t.slug];
  const changed = !prev || prev.count !== r.count || prev.max !== r.max;
  state[t.slug] = { ...r, changed: changed ? today : prev.changed };
  console.log(`${t.slug} : ${r.count}${r.max ? `/${r.max}` : ''}${changed ? ' (changé)' : ''}`);
}
writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');

// ---- Rendu dans les pages ----
for (const page of PAGES) {
  const file = new URL(page, ROOT);
  let html = readFileSync(file, 'utf8');
  for (const t of TOURNOIS) {
    const s = state[t.slug];
    if (!s) continue;
    const re = new RegExp(`(<!-- jauge:${t.slug} -->)[\\s\\S]*?(<!-- /jauge:${t.slug} -->)`, 'g');
    html = html.replace(re, `$1${jauge(t, s, page === 'index.html')}$2`);
  }
  writeFileSync(file, html);
}

if (echecs) {
  console.error(`${echecs} relevé(s) en échec : les jauges concernées gardent leur dernière valeur.`);
  process.exit(1);
}
