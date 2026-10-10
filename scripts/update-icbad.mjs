// Relève les classements et les résultats des interclubs sur icbad et les écrit dans
// competitions-adultes.html (npm run update:icbad, lancé chaque jour par GitHub Actions).
//
// icbad sert du HTML statique : une requête par poule suffit (classement + toutes les rencontres).
// Le résultat est du HTML statique entre deux marqueurs :
//   <!-- icbad:poule-slug --> … <!-- /icbad:poule-slug -->  classement de la poule (dépliant des poules)
//   <!-- icbad:equipe-slug --> … <!-- /icbad:equipe-slug -->  rang et résultats dans la carte de l'équipe
// Si une poule ne peut pas être lue, ses blocs gardent leur dernière valeur et le script sort en erreur.
import { readFileSync, writeFileSync } from 'node:fs';

const PAGE = new URL('../competitions-adultes.html', import.meta.url);
const ICBAD = 'https://icbad.ffbad.org';

// Poules et équipes suivies : à mettre à jour à chaque phase (adresses des poules sur
// icbad.ffbad.org/instance/BOB14), avec les marqueurs correspondants dans la page.
const POULES = [
  { slug: 'r2-a', tableau: '2601038/tableau/18627' },
  { slug: 'd1-c1', tableau: '2603001/tableau/19783' },
  { slug: 'd1-f1', tableau: '2603001/tableau/19383' },
  { slug: 'ch-a1', tableau: '2603588/tableau/19869' },
  { slug: 'ch-b1', tableau: '2603588/tableau/19870' },
];
const EQUIPES = [
  { slug: 'bob1', code: 'BOB-1', poule: 'r2-a' },
  { slug: 'bob2', code: 'BOB-2', poule: 'd1-c1' },
  { slug: 'bob3', code: 'BOB-3', poule: 'd1-c1' },
  { slug: 'bob4', code: 'BOB-4', poule: 'd1-f1' },
  { slug: 'bob5', code: 'BOB-5', poule: 'ch-a1' },
  { slug: 'bob6', code: 'BOB-6', poule: 'ch-b1' },
];
// Noms courts des clubs (sigle icbad → nom affiché). Sigle inconnu : nom complet icbad.
const CLUBS = {
  ASGIBAD: 'Giberville', ASL: 'Condé-sur-Sarthe', ASLNM: 'Noyers-Missy', BADCO: 'Ouistreham',
  BCMF: 'Merville-Franceville', BED: 'Bad Ès Dunes', CBBE: 'Bretteville-Épron', CBC: 'Cormelles',
  CBCA: 'Carentan', CBCC: 'Conquérant Caen', ESF: 'Falaise', IFS: "Badmint'ifs", LVB: 'Volants Baventais',
  PAB: "Pays d'Auge", SABA: 'Section Agnelaise', SLSNBC: 'SLSN Condé', UBCB: 'Union Bad. de la Baie',
  UCBB: 'Bricquebec', USP: 'St-Pierre-en-Auge', USSA: 'St-André',
};

const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&#0?39;|&apos;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cells = (tr) => [...tr.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)].map(([, attrs, html]) => ({ attrs, html }));

// « Club de Badminton de Carentan (50-CBCA-1) » → { code: 'CBCA-1', nom: 'Carentan (CBCA 1)' }
function equipe(libelle) {
  const m = /^(.*)\((?:\d+-)?([A-Z0-9]+)-(\d+)\)$/.exec(libelle);
  if (!m) return { code: libelle, nom: libelle };
  const [, club, sigle, n] = m;
  if (sigle === 'BOB') return { code: `BOB-${n}`, nom: `BOB ${n}` };
  return { code: `${sigle}-${n}`, nom: `${CLUBS[sigle] ?? club.trim()} (${sigle} ${n})` };
}

function lirePoule(html) {
  const debut = html.indexOf('classement-poule');
  const fin = html.indexOf('Toutes les rencontres');
  if (debut < 0 || fin < 0) throw new Error('structure de page inattendue');

  const classement = [...html.slice(debut, fin).matchAll(/<tr class="[^"]*">([\s\S]*?)<\/tr>/g)].map(([, tr]) => {
    const td = cells(tr).map((c) => text(c.html));
    return { rang: Number(td[0]), ...equipe(td[2]), joues: Number(td[3]), pts: Number(td[10]) };
  });
  if (!classement.length || classement.some((e) => Number.isNaN(e.rang) || Number.isNaN(e.pts))) {
    throw new Error('classement illisible');
  }

  const rencontres = [];
  for (const bloc of html.slice(fin).split('<th colspan="7" class="uk-text-center">').slice(1)) {
    const journee = text(bloc.slice(0, bloc.indexOf('</th>')));
    for (const [, tr] of bloc.matchAll(/<tr class="uk-visible@m clickable-row">([\s\S]*?)<\/tr>/g)) {
      const td = cells(tr);
      const date = /Le (\d\d)\/(\d\d)/.exec(text(td[0].html));
      const score = /(\d+) - (\d+)/.exec(text(td[3].html));
      const issue = (attrs) => (/ic-win/.test(attrs) ? 'win' : /ic-loose/.test(attrs) ? 'loss' : null);
      if (!date || !score) continue;
      rencontres.push({
        journee,
        date: `${date[1]}/${date[2]}`,
        a: { ...equipe(text(td[2].html)), score: Number(score[1]), issue: issue(td[2].attrs) },
        b: { ...equipe(text(td[4].html)), score: Number(score[2]), issue: issue(td[4].attrs) },
      });
    }
  }
  return { classement, rencontres };
}

// Rencontre jouée : un vainqueur désigné, ou un score non nul (match nul).
const joue = (r) => Boolean(r.a.issue || r.b.issue || r.a.score + r.b.score);
const rangFr = (n) => (n === 1 ? '1<sup>re</sup>' : `${n}<sup>e</sup>`);
const pts = (n) => `${n} pt${Math.abs(n) > 1 ? 's' : ''}`;

function blocPoule(p) {
  const joue = p.classement.some((e) => e.joues > 0);
  const lignes = p.classement.map((e) => {
    const bob = e.code.startsWith('BOB-') ? ' class="poule__bob"' : '';
    if (!joue) return `<li${bob}>${esc(e.nom)}</li>`;
    return `<li${bob}><span class="poule__rang">${e.rang}</span><span class="poule__nom">${esc(e.nom)}</span><span class="poule__pts">${pts(e.pts)}</span></li>`;
  });
  return `<ol class="poule__list${joue ? ' poule__list--classement' : ''}">${lignes.join('')}</ol>`;
}

function blocEquipe(t, p) {
  const moi = p.classement.find((e) => e.code === t.code);
  const jouees = p.rencontres
    .filter((r) => joue(r) && (r.a.code === t.code || r.b.code === t.code))
    .map((r) => (r.a.code === t.code ? { ...r, nous: r.a, eux: r.b } : { ...r, nous: r.b, eux: r.a }));
  if (!moi || !jouees.length) return '';
  const v = jouees.filter((r) => r.nous.issue === 'win').length;
  const d = jouees.filter((r) => r.nous.issue === 'loss').length;
  const bilan = [v && `${v} victoire${v > 1 ? 's' : ''}`, d && `${d} défaite${d > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  // Dans la carte, seulement la dernière journée jouée (le détail complet est sur icbad).
  const derniere = jouees.at(-1).journee;
  const res = jouees.filter((r) => r.journee === derniere).map((r) => {
    const cls = r.nous.issue === 'win' ? 'win' : r.nous.issue === 'loss' ? 'loss' : 'draw';
    return `<li><span class="ic-res__score ic-res__score--${cls}">${r.nous.score}-${r.eux.score}</span>`
      + `<span>contre ${esc(r.eux.nom)}</span></li>`;
  });
  const quand = jouees.find((r) => r.journee === derniere).date;
  return `<div class="ic-res"><p class="ic-res__rang"><strong>${rangFr(moi.rang)}</strong> sur ${p.classement.length}`
    + ` · ${pts(moi.pts)} · ${bilan}</p><p class="ic-res__j">Dernière journée · ${derniere}, ${quand}</p>`
    + `<ul class="ic-res__list">${res.join('')}</ul></div>`;
}

// ---- Relevé ----
const poules = {};
let echecs = 0;
for (const p of POULES) {
  try {
    const r = await fetch(`${ICBAD}/competition/${p.tableau}`, { signal: AbortSignal.timeout(30_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    poules[p.slug] = lirePoule(await r.text());
    const nb = poules[p.slug].rencontres.filter(joue).length;
    console.log(`${p.slug} : ${poules[p.slug].classement.length} équipes, ${nb} rencontre(s) jouée(s)`);
  } catch (e) {
    echecs++;
    console.error(`${p.slug} : lecture impossible (${e.message}) — ${ICBAD}/competition/${p.tableau}`);
  }
}

// ---- Rendu dans la page ----
const remplace = (html, slug, contenu) => {
  const re = new RegExp(`(<!-- icbad:${slug} -->)[\\s\\S]*?(<!-- /icbad:${slug} -->)`);
  if (!re.test(html)) { echecs++; console.error(`marqueur icbad:${slug} absent de la page`); return html; }
  return html.replace(re, `$1${contenu}$2`);
};
let html = readFileSync(PAGE, 'utf8');
for (const p of POULES) if (poules[p.slug]) html = remplace(html, `poule-${p.slug}`, blocPoule(poules[p.slug]));
for (const t of EQUIPES) if (poules[t.poule]) html = remplace(html, `equipe-${t.slug}`, blocEquipe(t, poules[t.poule]));
writeFileSync(PAGE, html);

if (echecs) {
  console.error(`${echecs} erreur(s) : les blocs concernés gardent leur dernière valeur.`);
  process.exit(1);
}
