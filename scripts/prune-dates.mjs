// Retire les dates passées des blocs « Prochaines dates » (npm run prune:dates, lancé chaque jour par
// GitHub Actions avec les jauges). Le site n'a pas de JavaScript (CSP) : le ménage se fait dans le HTML.
//
// Chaque date est un <li class="ic-day…"> contenant <time datetime="AAAA-MM-JJ">. Elle disparaît le
// lendemain de cette date, ou le lendemain de data-fin="AAAA-MM-JJ" posé sur le <li> (événement sur
// plusieurs jours). Quand la liste est vide, un message de fin de saison la remplace.
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const PAGES = ['competitions-adultes.html', 'competitions-jeunes.html'];
const EMPTY = '      <li class="ic-days__empty">Plus de date prévue cette saison : rendez-vous à la rentrée !</li>\n';

// TODAY=AAAA-MM-JJ permet de tester le ménage à une autre date.
const today = process.env.TODAY ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());

for (const page of PAGES) {
  const file = new URL(page, ROOT);
  const html = readFileSync(file, 'utf8');
  let removed = 0;
  let out = html.replace(/ *<li class="ic-day[ "][^>]*>[\s\S]*?<\/li>\n/g, (li) => {
    const fin = /data-fin="(\d{4}-\d{2}-\d{2})"/.exec(li)?.[1] ?? /datetime="(\d{4}-\d{2}-\d{2})"/.exec(li)?.[1];
    if (!fin || fin >= today) return li;
    removed++;
    return '';
  });
  out = out.replace(/(<ul class="ic-days">\n)(\s*<\/ul>)/g, `$1${EMPTY}$2`);
  if (out !== html) writeFileSync(file, out);
  console.log(`${page} : ${removed} date(s) passée(s) retirée(s)`);
}
