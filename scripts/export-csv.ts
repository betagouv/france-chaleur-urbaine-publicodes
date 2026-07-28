import { createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Engine from 'publicodes';
import rules from '../publicodes-build/france-chaleur-urbaine-publicodes.model.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));

const engine = new Engine(rules, {
  logger: { warn: () => {}, error: () => {}, log: () => {} },
});

// Situation par défaut : 20 Avenue de Ségur, 75007 Paris
engine.setSituation({
  'climatisation . incluse': 'non',
  'ecs . production': 'oui',
  'ecs . type de production': "'Avec équipement chauffage'",
  'réseau de chaleur . caractéristiques . contenu CO2': 0.157,
  'réseau de chaleur . caractéristiques . contenu CO2 ACV': 0.182,
  'réseau de chaleur . caractéristiques . livraisons totales': 3739841,
  'réseau de chaleur . caractéristiques . part fixe': 23.6851545755077,
  'réseau de chaleur . caractéristiques . part variable': 76.3148454244923,
  'réseau de chaleur . caractéristiques . prix moyen': 109.502957238406,
  'réseau de chaleur . caractéristiques . production totale': 5907294.94,
  'réseau de chaleur . caractéristiques . taux EnRR': 48.8,
  'réseau de froid . caractéristiques . contenu CO2': 0.008,
  'réseau de froid . caractéristiques . contenu CO2 ACV': 0.016,
  'réseau de froid . caractéristiques . livraisons totales': 425178,
  'réseau de froid . caractéristiques . production totale': 515292,
  'climat . code département': "'75'",
  'climat . température de référence chaud commune': -5,
});

// --- Modes de chauffage (une racine par mode, miroir de mappings.ts) ---

const modesDeChauffage = [
  { label: 'Réseau de chaleur', key: 'réseau de chaleur' },
  { label: 'Chaudière à granulés collective', key: 'chaudière à granulés' },
  { label: 'Gaz à condensation collectif', key: 'gaz coll avec cond' },
  { label: 'Gaz sans condensation collectif', key: 'gaz coll sans cond' },
  { label: 'Fioul collectif', key: 'fioul coll' },
  { label: 'PAC air/air collective', key: 'PAC air-air coll' },
  { label: 'PAC air/eau collective', key: 'PAC air-eau coll' },
  { label: 'PAC eau/eau collective', key: 'PAC eau-eau coll' },
  { label: 'Poêle à granulés individuel', key: 'poêle à granulés' },
  { label: 'Gaz à condensation individuel', key: 'gaz indiv avec cond' },
  { label: 'Gaz sans condensation individuel', key: 'gaz indiv sans cond' },
  { label: 'Fioul individuel', key: 'fioul indiv' },
  { label: 'PAC air/air individuelle', key: 'PAC air-air indiv' },
  { label: 'PAC air/eau individuelle', key: 'PAC air-eau indiv' },
  { label: 'PAC eau/eau individuelle', key: 'PAC eau-eau indiv' },
  { label: 'Radiateur électrique individuel', key: 'radiateur électrique' },
] as const;

// Le réseau de froid n'est pas un mode de chauffage mais porte un dimensionnement.
const modesAvecDimensionnement = [...modesDeChauffage, { label: 'Réseau de froid', key: 'réseau de froid' }] as const;

// --- Helpers ---

const ruleNames = new Set(Object.keys(rules));

/** Évalue une règle ; renvoie '' si elle n'existe pas pour ce mode (ex. puissance ECS d'un radiateur). */
function evaluate(key: string): number | string {
  if (!ruleNames.has(key)) return '';
  try {
    const result = engine.evaluate(key);
    const value = result?.nodeValue;
    if (typeof value === 'boolean') return value ? 'oui' : 'non';
    if (typeof value === 'number') return Math.round(value * 1000) / 1000;
    return String(value ?? '');
  } catch {
    return 'ERREUR';
  }
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toCsvLine(values: (string | number)[]): string {
  return values.map(escapeCsv).join(';');
}

// --- Génération des tableaux ---

const outputPath = join(__dirname, '..', 'debug-tables.csv');
const out = createWriteStream(outputPath, 'utf-8');

function writeLine(line: string) {
  out.write(`${line}\n`);
}

function addSection(title: string) {
  writeLine('');
  writeLine(`${'#'.repeat(60)}`);
  writeLine(escapeCsv(`### ${title}`));
  writeLine(`${'#'.repeat(60)}`);
}

function addTable(caption: string, headers: string[], rows: (string | number)[][]) {
  writeLine('');
  writeLine(`${'='.repeat(40)}`);
  writeLine(escapeCsv(`>>> ${caption}`));
  writeLine(`${'='.repeat(40)}`);
  writeLine(toCsvLine(headers));
  for (const row of rows) {
    writeLine(toCsvLine(row));
  }
}

/** Une ligne par mode, une colonne par suffixe de règle sous le namespace donné. */
function tableParMode(
  caption: string,
  headers: string[],
  namespace: string,
  suffixes: string[],
  modes: readonly { label: string; key: string }[] = modesDeChauffage
) {
  addTable(
    caption,
    headers,
    modes.map((m) => [m.label, ...suffixes.map((s) => evaluate(`${m.key} . ${namespace} . ${s}`))])
  );
}

addSection('BILAN 1AN');

tableParMode(
  'Coûts par logement / tertiaire',
  ['Installation', 'P1 abo', 'P1 conso chaud', "P1'", 'P1 ECS', 'P1 conso froid', 'P2', 'P3', 'P4', 'P4 moins aides', 'Aides', 'Total sans aides', 'Total avec aides'],
  'bilan',
  ['P1abo', 'P1conso', 'P1prime', 'P1ECS', 'P1Consofroid', 'P2', 'P3', 'P4', 'P4 moins aides', 'aides', 'total sans aides', 'total avec aides']
);

addSection('CALCULS ÉCONOMIQUES');

addTable(
  "Coût d'achat du combustible",
  ['Paramètres', 'Part abonnement', 'Part consommation', 'Heures creuses'],
  [
    ['Chaleur (RCU)', evaluate('combustibles . réseau de chaleur . abonnement'), evaluate('combustibles . réseau de chaleur . consommation'), ''],
    ['Froid (RFU)', evaluate('combustibles . réseau de froid . abonnement'), evaluate('combustibles . réseau de froid . consommation'), ''],
    [
      'Electricité indiv',
      evaluate('combustibles . électricité . abonnement individuel'),
      evaluate('combustibles . électricité . consommation individuel HP'),
      evaluate('combustibles . électricité . consommation individuel HC'),
    ],
    ['Electricité coll', evaluate('combustibles . électricité . abonnement collectif'), evaluate('combustibles . électricité . consommation collectif'), ''],
    ['Gaz individuel', evaluate('combustibles . gaz . abonnement individuel'), evaluate('combustibles . gaz . consommation individuel'), ''],
    ['Gaz collectif', evaluate('combustibles . gaz . abonnement collectif'), evaluate('combustibles . gaz . consommation collectif'), ''],
    ['Granulés', '', evaluate('combustibles . granulés . consommation'), ''],
    ['Fioul', '', evaluate('combustibles . fioul . consommation'), ''],
  ]
);

tableParMode(
  'P4 - Investissement total (sans aide) €TTC',
  ['Installation', 'Investissement équipement total (€)', 'Investissement par lgt type / tertiaire (€)', 'Investissement ballon ECS à accumulation (€)', 'Investissement ballon ECS solaire panneau inclus (€)', 'Total investissement avec ballon ECS à accumulation (€)', 'Total investissement ballon ECS solaire panneaux (€)'],
  'coûts',
  ['investissement équipement', 'investissement par logement', 'investissement ballon ECS', 'investissement chauffe-eau solaire', 'investissement total avec ballon ECS', 'investissement total avec chauffe-eau solaire']
);

tableParMode(
  'P1 - Coût du combustible par lgt type / tertiaire',
  ['Installation', 'Coût combustible abonnement (P1 abo) €TTC/an', 'Coût combustible consommation (P1 conso) €TTC/an', "Coût électricité auxiliaire (P1') €TTC/an", 'Coût combustible ballon ECS à accumulation (P1 ECS) €TTC/an', 'Coût combustible ballon ECS solaire (P1 ECS) €TTC/an'],
  'coûts',
  ['P1 abonnement', 'P1 consommation', 'P1 auxiliaires', 'P1 ballon ECS', 'P1 chauffe-eau solaire']
);

tableParMode(
  "P2, P3 - Coût de l'entretien",
  ['Installation', 'Petit entretien (P2) €TTC/an', 'Gros entretien (P3) €TTC/an', 'Par logement/tertiaire - Petit entretien (P2) €TTC/an', 'Par logement/tertiaire - Gros entretien (P3) €TTC/an'],
  'coûts',
  ['petit entretien P2', 'gros entretien P3', 'petit entretien P2 par logement tertiaire', 'gros entretien P3 par logement tertiaire']
);

addTable(
  'Montant des aides par logement/tertiaire',
  ['Installation', "Ma prime renov' (€)", 'Coup de pouce (€)', 'CEE (€)', 'Coût total des aides (€)'],
  [
    ...modesDeChauffage.map(
      (m) =>
        [
          m.label,
          evaluate(`${m.key} . aides . ma prime rénov`),
          evaluate(`${m.key} . aides . coup de pouce`),
          evaluate(`${m.key} . aides . CEE`),
          evaluate(`${m.key} . aides . total`),
        ] as (string | number)[]
    ),
    [
      'Panneau solaire thermique pour production ECS',
      evaluate('ecs additionnelle . aides panneau solaire . ma prime rénov'),
      evaluate('ecs additionnelle . aides panneau solaire . coup de pouce'),
      evaluate('ecs additionnelle . aides panneau solaire . CEE'),
      evaluate('ecs additionnelle . aides panneau solaire . total'),
    ],
  ]
);

addSection('CALCULS TECHNIQUES');

tableParMode(
  'Puissance totale des installations',
  ['Installation', 'Production eau chaude sanitaire ?', 'Puissance nécessaire chauffage (kW)', 'Puissance nécessaire ECS (kW)', 'Puissance nécessaire refroidissement (kW)', 'Puissance équipement (kW)', 'Gamme de puissance existante (kW)'],
  'installation',
  ['production eau chaude sanitaire', 'puissance chauffage', 'puissance ECS', 'puissance refroidissement', 'puissance équipement', 'puissance retenue'],
  modesAvecDimensionnement
);

tableParMode(
  'Si besoins équipements ECS différenciés',
  ['Installation', "Besoin d'installation supplémentaire pour ECS ?", 'Volume du ballon ECS (L)', "Consommation d'électricité (kWh/an)", "Appoint d'électricité (kWh/an)"],
  'installation',
  ['ECS additionnelle nécessaire', 'volume du ballon ECS', 'consommation chauffe-eau électrique', 'appoint chauffe-eau solaire']
);

tableParMode(
  'Bilan par lgt / tertiaire',
  ['Installation', 'Consommation combustible chaleur', 'Consommation combustible froid', 'Consommation auxiliaire (kWh elec/an)'],
  'installation',
  ['consommation combustible chaleur', 'consommation combustible froid', 'consommation auxiliaire']
);

tableParMode(
  'Bilan des consommations par lgt / tertiaire',
  ['Installation', 'Consommation combustible hors électricité', "Consommation d'électricité chauffage/refroidissement et ECS (kWh/an)"],
  'installation',
  ['consommation hors électricité', 'consommation électricité']
);

addSection('CALCULS ENVIRONNEMENTAUX');

addTable(
  'Emissions de CO2',
  ['Installation', "Besoin installation supplémentaire ECS ?", 'Scope 1 - Besoins chauffage et ECS si même équipement (kgCO2 équ.)', 'Scope 2 - Auxiliaires et combustible électrique (kgCO2 équ.)', 'Scope 2 - ECS solaire thermique', 'Scope 2 - ECS avec ballon électrique', 'Scope 2 - Total', 'Scope 3', 'Total des émissions'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`${m.key} . installation . ECS additionnelle nécessaire`),
    evaluate(`${m.key} . environnement . besoins de chauffage et ECS si même équipement`),
    evaluate(`${m.key} . environnement . auxiliaires et combustible électrique`),
    evaluate(`${m.key} . environnement . ECS solaire thermique`),
    evaluate(`${m.key} . environnement . ECS avec ballon électrique`),
    evaluate(`${m.key} . environnement . scope 2`),
    evaluate(`${m.key} . environnement . scope 3`),
    evaluate(`${m.key} . environnement . total`),
  ])
);

out.end(() => {
  console.log(`CSV généré : ${outputPath}`);
});
