# Site du BOB — Bretteville-l'Orgueilleuse Badminton

Site vitrine **statique** du club, hébergé sur **GitHub Pages**.

## Styles (SCSS)

Le CSS est généré depuis `scss/` — **ne pas éditer `assets/css/site.css` ni `assets/css/bob.css`
à la main** (ils sont écrasés à chaque build). `assets/css/tokens.css` est le design system
(variables) et `assets/css/fonts.css` les déclarations `@font-face` : les deux s'éditent
directement, mais rarement.

```bash
npm install        # une fois (installe sass)
npm run build:css  # compile scss/ → site.css puis bundle → bob.css (à faire avant de committer)
npm run watch:css  # recompile en continu pendant le développement
```

⚠️ `watch:css` ne régénère que `site.css`. Lancer `npm run build:css` (ou `npm run bundle:css`)
avant de committer, car **les pages ne chargent que `bob.css`** — la concaténation
`fonts.css + tokens.css + site.css`, servie en une seule requête.

Organisation : `scss/_tokens` (couleurs), `_mixins`, `_base`, `_layout`, `_header`, `_hero`,
`_buttons`, `_components`, `_schedule`, `_footer`, assemblés dans `scss/main.scss`.
Le CSS compilé est committé pour que GitHub Pages reste 100 % statique (aucun build CI).

## Flyers PDF

Les PDF de `assets/docs/` sont **générés** depuis les sources HTML de `flyers/` — ne pas les
éditer autrement qu'en régénérant.

```bash
npm run build:flyers   # flyers/*.dc.html → assets/docs/BOB-*.pdf (impression Chrome headless)
```

Le rendu a besoin du réseau : polices depuis `fonts.googleapis.com`, générateur de QR codes
depuis `cdn.jsdelivr.net`. Hors ligne, les PDF sortent en police de repli et sans QR code.
Après régénération, reporter les tailles de fichier dans les cartes `dl-card__meta` de
`jeunes.html`, `adultes.html`, `infos-pratiques.html` et `tournois.html` (le script les affiche).

`BOB-Tournois-2026-2027.pdf` reprend les dates des tournois de `tournois.html` : les modifier aux deux endroits.

`BOB-Competitions-Jeunes-2026-2027.pdf` fait exception : il vient de Canva, pas de `flyers/`.

## Jauges d'inscriptions des tournois

Les jauges de `tournois.html` et de l'encart de `index.html` sont mises à jour **chaque jour** par
le workflow GitHub Actions `.github/workflows/jauges.yml` (lancement manuel possible depuis l'onglet
Actions, « Jauges des tournois » → *Run workflow*).

```bash
npm run update:jauges   # relevé Badnet (Chrome headless) → scripts/jauges.json + HTML entre <!-- jauge:slug -->
```

- Seul le nombre d'inscrits est relevé, jamais les noms. Commit uniquement si un chiffre change.
- La liste des tournois suivis (eventid Badnet, clôture, dernier jour) est en tête de
  `scripts/update-jauges.mjs` : à mettre à jour chaque saison, avec les marqueurs dans les pages.
- Si Badnet change sa page, le relevé échoue : les jauges gardent leur dernière valeur et
  GitHub envoie un e-mail d'échec du workflow.

## Icônes

Pas de webfont : les icônes sont un **sprite SVG inline** injecté en début de `<body>` de chaque
page (26 symboles, ~5 Ko, contre 1,1 Mo pour la webfont Tabler auparavant). Une icône s'écrit :

```html
<svg class="ic" aria-hidden="true"><use href="#i-trophy"/></svg>
```

Pour **ajouter une icône**, récupérer le SVG Tabler correspondant et ajouter un `<symbol
id="i-nom" viewBox="0 0 24 24">` au sprite — dans les 6 pages, le sprite y est dupliqué.

## SEO

- `sitemap.xml` (à mettre à jour si une page est ajoutée) + `robots.txt`, déclarés dans la
  Google Search Console.
- Chaque page a un `<link rel="canonical">` absolu vers `https://www.bob14.fr/…` (l'apex
  `bob14.fr` redirige en 301 vers `www`), des balises Open Graph / Twitter Card, et un JSON-LD
  `BreadcrumbList`. L'accueil porte en plus le JSON-LD `SportsClub` (adresses des 3 gymnases,
  contacts, réseaux) qui alimente le référencement local.
- `assets/img/og-image.jpg` (1200×630) est l'image d'aperçu au partage.

## Images

`assets/img/bob-logo.png` (500×500) est la **source** du logo ; elle n'est pas servie aux
visiteurs. Les déclinaisons utilisées (`bob-logo-128.png`, `favicon-32.png`,
`apple-touch-icon.png`, `icon-192/512.png`) en sont dérivées. Toutes les balises `<img>` portent
`width`/`height` explicites pour éviter les décalages de mise en page (CLS) : si on remplace une
image, penser à reporter ses vraies dimensions intrinsèques.
