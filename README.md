# Site du BOB — Bretteville-l'Orgueilleuse Badminton

Site vitrine **statique** du club, hébergé sur **GitHub Pages**.

## Styles (SCSS)

Le CSS est généré depuis `scss/` — **ne pas éditer `assets/css/site.css` à la main**
(il est écrasé à chaque build). `assets/css/tokens.css` est le design system (variables) et
reste tel quel.

```bash
npm install        # une fois (installe sass)
npm run build:css  # compile scss/ → assets/css/site.css (à faire avant de committer)
npm run watch:css  # recompile en continu pendant le développement
```

Organisation : `scss/_tokens` (couleurs), `_mixins`, `_base`, `_layout`, `_header`, `_hero`,
`_buttons`, `_components`, `_schedule`, `_footer`, assemblés dans `scss/main.scss`.
Le `site.css` compilé est committé pour que GitHub Pages reste 100 % statique (aucun build CI).
