// Génère les agendas .ics des compétitions dans assets/cal/ (npm run build:ics).
// Les dates sont aussi affichées dans les pages HTML : les modifier aux deux endroits.
// Les UID sont stables : réimporter un fichier met à jour les événements au lieu de les dupliquer.
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../assets/cal/', import.meta.url);
const SITE = 'https://www.bob14.fr';
// Date de dernière modification des données (à changer à chaque mise à jour des dates)
const STAMP = '20260925T000000Z';

const ADULTES = `${SITE}/competitions-adultes.html`;
const JEUNES = `${SITE}/competitions-jeunes.html`;
const TOURNOIS = `${SITE}/tournois.html`;
const GYM_ROTS = 'Gymnase de Rots, rue Haute Bonny, 14980 Rots';

// Événements « journée entière » : start = 'AAAA-MM-JJ', end (inclus, facultatif) pour plusieurs jours.
// Événements avec horaires : at = [début, fin] en heure locale avec décalage, ex. '2026-10-23T19:30+02:00'.
// Interclubs : un fichier PAR ÉQUIPE (ex. bob-ic-mixte-2 pour l'équipe 14-BOB-2), jamais tout l'interclub.
const calendars = {
  // Équipe 14-BOB-1
  'bob-r2': {
    name: 'BOB 1 · Interclubs R2',
    url: ADULTES,
    events: [
      ['J1', '2026-10-04', 'Bricquebec'],
      ['J2', '2026-11-08', 'Ifs'],
      ['J3', '2026-11-29', 'Condé-sur-Sarthe'],
      ['J4', '2026-12-20', 'Rots (domicile)'],
      ['J5', '2027-01-17', 'Bricquebec'],
      ['J6', '2027-01-31', 'Rots (domicile)'],
      ['J7', '2027-03-21', 'Condé-sur-Sarthe'],
    ].map(([j, start, lieu]) => ({
      uid: `r2-${j.toLowerCase()}-2026`,
      start,
      summary: `Interclubs R2 · ${j} · ${lieu}`,
      location: lieu,
      description: 'Régionale 2, poule A (équipe 14-BOB-1). Horaires et composition sur icbad : https://icbad.ffbad.org/competition/2601038',
    })),
  },
  'bob-cda': {
    name: 'BOB · Circuit Départemental Adultes',
    url: ADULTES,
    events: [
      ['CDA1', '2026-10-18', 'Doubles'],
      ['CDA2', '2026-11-22', 'Simples'],
      ['CDA3', '2026-12-13', 'Mixtes'],
      ['CDA4', '2027-01-03', 'Simples'],
      ['CDA5', '2027-03-07', 'Doubles'],
      ['CDA6', '2027-04-25', 'Mixtes'],
    ].map(([n, start, disc]) => ({
      uid: `${n.toLowerCase()}-2026`,
      start,
      summary: `${n} · ${disc}`,
      description: 'Circuit Départemental Adultes (R4 max). Inscription sur Badnet au plus tard 11 jours avant. Lieux publiés par le Comité du Calvados.',
    })),
  },
  'bob-cdf': {
    name: 'BOB · Circuit Départemental Féminin',
    url: ADULTES,
    events: [
      ['CDF1', '2026-11-02', '2026-11-06'],
      ['CDF2', '2027-01-18', '2027-01-22'],
      ['CDF3', '2027-03-22', '2027-03-26'],
      ['CDF4', '2027-05-10', '2027-05-14'],
    ].map(([n, start, end]) => ({
      uid: `${n.toLowerCase()}-2026`,
      start,
      end,
      summary: `${n} · semaine (un soir, 19 h – 23 h 30)`,
      description: 'Circuit Départemental Féminin (R4 max), un soir dans la semaine. Le soir exact est précisé à l’ouverture des inscriptions sur Badnet.',
    })),
  },
  'bob-rdj': {
    name: 'BOB · Rencontres Départementales Jeunes',
    url: JEUNES,
    events: ['2026-09-26', '2026-11-07', '2026-12-12', '2027-01-16', '2027-03-20'].map((start, i) => ({
      uid: `rdj${i + 1}-2026`,
      start,
      summary: `RDJ ${i + 1} · Rencontres Départementales Jeunes`,
      description: 'Le samedi, niveau départemental. Encadrement par l’entraîneur du club.',
    })),
  },
  'bob-tcj': {
    name: 'BOB · Trophée Calvados Jeunes',
    url: JEUNES,
    events: [
      ...['2026-10-11', '2026-11-15', '2026-11-29', '2027-01-24', '2027-02-14'].map((start, i) => ({
        uid: `tcj${i + 1}-2026`,
        start,
        summary: `TCJ ${i + 1} · Trophée Calvados Jeunes`,
        description: 'Le dimanche, simple ou double. Encadrement par l’entraîneur du club.',
      })),
      {
        uid: 'tcj-finale-2027',
        start: '2027-06-05',
        end: '2027-06-06',
        summary: 'TCJ · Finale (2 jours)',
        description: 'Finale du Trophée Calvados Jeunes.',
      },
    ],
  },
  // ---- Tournois organisés par le club (sources : Badnet + règlements particuliers Poona) ----
  'bob-tournoi-interne-2026': {
    name: 'BOB · Tournoi interne d’intégration',
    url: TOURNOIS,
    events: [{
      uid: 'tournoi-interne-2026',
      start: '2026-10-06',
      summary: 'BOB · Tournoi interne d’intégration (doubles)',
      location: 'Saint-Manvieu-Norrey',
      description: 'Tournoi de doubles réservé aux adhérents du BOB. Inscription sur Badnet jusqu’au 5 octobre 20 h : https://badnet.fr/tournoi/public?eventid=51743',
    }],
  },
  'bob-tournoi-after-bob-2': {
    name: 'BOB · After BOB #2',
    url: TOURNOIS,
    events: [{
      uid: 'after-bob-2-2026',
      at: ['2026-10-23T19:30+02:00', '2026-10-24T02:00+02:00'],
      summary: 'After BOB #2 · tournoi nocturne de double mixte',
      location: GYM_ROTS,
      description: 'Tournoi nocturne de double mixte, NC à R4. 7 poules de 6 paires : 5 matchs assurés. Badnet : https://badnet.fr/tournoi/public?eventid=51327',
    }],
  },
  'bob-tournoi-simplement-bob-4': {
    name: 'BOB · Simplement BOB 4',
    url: TOURNOIS,
    events: [{
      uid: 'simplement-bob-4-2026',
      at: ['2026-12-05T08:00+01:00', '2026-12-05T23:00+01:00'],
      summary: 'Simplement BOB 4 · tournoi de simples',
      location: GYM_ROTS,
      description: 'Tournoi de simples (SH, SD), NC à R4. Inscription sur Badnet jusqu’au 25 novembre : https://badnet.fr/tournoi/public?eventid=51641',
    }],
  },
  'bob-tournoi-bobminton-2027': {
    name: 'BOB · Bobminton 2027',
    url: TOURNOIS,
    events: [
      {
        uid: 'bobminton-2027-doubles',
        start: '2027-02-06',
        summary: 'Bobminton 2027 · doubles hommes et dames',
        location: GYM_ROTS,
        description: 'Doubles hommes et dames, à partir de 8 h. NC à R4. Badnet : https://badnet.fr/tournoi/public?eventid=51493',
      },
      {
        uid: 'bobminton-2027-mixtes',
        start: '2027-02-07',
        summary: 'Bobminton 2027 · doubles mixtes',
        location: GYM_ROTS,
        description: 'Doubles mixtes, à partir de 8 h. NC à R4. Badnet : https://badnet.fr/tournoi/public?eventid=51493',
      },
    ],
  },
};

const ymd = (d) => d.replaceAll('-', '');
const nextDay = (d) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
};
const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

// Repli des lignes à 75 octets (RFC 5545), sans couper un caractère UTF-8
function fold(line) {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function ics({ name, url, events }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BOB Badminton//bob14.fr//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:Europe/Paris',
  ];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@bob14.fr`,
      `DTSTAMP:${STAMP}`,
      ...(e.at
        ? [`DTSTART:${utc(e.at[0])}`, `DTEND:${utc(e.at[1])}`]
        : [`DTSTART;VALUE=DATE:${ymd(e.start)}`, `DTEND;VALUE=DATE:${ymd(nextDay(e.end ?? e.start))}`]),
      `SUMMARY:${esc(e.summary)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      `DESCRIPTION:${esc(e.description)}`,
      `URL:${url}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

mkdirSync(OUT, { recursive: true });
for (const [file, cal] of Object.entries(calendars)) {
  writeFileSync(new URL(`${file}.ics`, OUT), ics(cal));
}
console.log(`ics : ${Object.keys(calendars).length} fichiers dans assets/cal/`);
