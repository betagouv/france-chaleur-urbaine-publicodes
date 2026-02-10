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
  'Inclure la climatisation': 'non',
  'Production eau chaude sanitaire': 'oui',
  'type de production ECS': "'Avec équipement chauffage'",
  'caractéristique réseau de chaleur . contenu CO2': 0.157,
  'caractéristique réseau de chaleur . contenu CO2 ACV': 0.182,
  'caractéristique réseau de chaleur . livraisons totales': 3739841,
  'caractéristique réseau de chaleur . part fixe': 23.6851545755077,
  'caractéristique réseau de chaleur . part variable': 76.3148454244923,
  'caractéristique réseau de chaleur . prix moyen': 109.502957238406,
  'caractéristique réseau de chaleur . production totale': 5907294.94,
  'caractéristique réseau de chaleur . taux EnRR': 48.8,
  'caractéristique réseau de froid . contenu CO2': 0.008,
  'caractéristique réseau de froid . contenu CO2 ACV': 0.016,
  'caractéristique réseau de froid . livraisons totales': 425178,
  'caractéristique réseau de froid . production totale': 515292,
  'code département': "'75'",
  'température de référence chaud commune': -5,
});

// --- Modes de chauffage (miroir de mappings.ts) ---

const modesDeChauffage = [
  { label: 'Réseau de chaleur', coutKey: 'Réseaux de chaleur', envKey: 'Réseaux de chaleur x Collectif' },
  { label: 'Chaudière à granulés collective', coutKey: 'Chaudière à granulés coll', envKey: 'Chaudière à granulés coll x Collectif' },
  { label: 'Gaz à condensation collectif', coutKey: 'Gaz coll avec cond', envKey: 'Gaz coll avec cond x Collectif' },
  { label: 'Gaz sans condensation collectif', coutKey: 'Gaz coll sans cond', envKey: 'Gaz coll sans cond x Collectif' },
  { label: 'Fioul collectif', coutKey: 'Fioul coll', envKey: 'Fioul coll x Collectif' },
  { label: 'PAC air/air collective', coutKey: 'PAC air-air coll', envKey: 'PAC air-air x Collectif' },
  { label: 'PAC air/eau collective', coutKey: 'PAC air-eau coll', envKey: 'PAC air-eau x Collectif' },
  { label: 'PAC eau/eau collective', coutKey: 'PAC eau-eau coll', envKey: 'PAC eau-eau x Collectif' },
  { label: 'Poêle à granulés individuel', coutKey: 'Poêle à granulés indiv', envKey: 'Poêle à granulés indiv x Individuel' },
  { label: 'Gaz à condensation individuel', coutKey: 'Gaz indiv avec cond', envKey: 'Gaz indiv avec cond x Individuel' },
  { label: 'Gaz sans condensation individuel', coutKey: 'Gaz indiv sans cond', envKey: 'Gaz indiv sans cond x Individuel' },
  { label: 'Fioul individuel', coutKey: 'Fioul indiv', envKey: 'Fioul indiv x Individuel' },
  { label: 'PAC air/air individuelle', coutKey: 'PAC air-air indiv', envKey: 'PAC air-air x Individuel' },
  { label: 'PAC air/eau individuelle', coutKey: 'PAC air-eau indiv', envKey: 'PAC air-eau x Individuel' },
  { label: 'PAC eau/eau individuelle', coutKey: 'PAC eau-eau indiv', envKey: 'PAC eau-eau x Individuel' },
  { label: 'Radiateur électrique individuel', coutKey: 'Radiateur électrique', envKey: 'Radiateur électrique x Individuel' },
] as const;

// --- Installations pour le tableau "Puissance totale" (statique dans DebugDrawer) ---

const installationsPuissance = [
  { label: 'Réseaux de chaleur', key: 'Réseaux de chaleur x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Réseaux de froid', key: 'Réseaux de froid x Collectif', fields: [null, null, 'puissance nécessaire pour refroidissement équipement', 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Poêle à granulés indiv', key: 'Poêle à granulés indiv x Individuel', fields: ['puissance nécessaire équipement chauffage', null, null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Chaudière à granulés coll', key: 'Chaudière à granulés coll x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Gaz indiv avec cond', key: 'Gaz indiv avec cond x Individuel', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Gaz indiv sans cond', key: 'Gaz indiv sans cond x Individuel', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Gaz coll avec cond', key: 'Gaz coll avec cond x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Gaz coll sans cond', key: 'Gaz coll sans cond x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Fioul indiv', key: 'Fioul indiv x Individuel', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Fioul coll', key: 'Fioul coll x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'PAC air/air indiv', key: 'PAC air-air x Individuel', fields: ['puissance nécessaire équipement chauffage', null, 'puissance nécessaire pour refroidissement équipement', 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'PAC air/air collectif/tertiaire', key: 'PAC air-air x Collectif', fields: ['puissance nécessaire équipement chauffage', null, 'puissance nécessaire pour refroidissement équipement', 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'PAC eau/eau indiv', key: 'PAC eau-eau x Individuel', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'PAC eau/eau collectif/tertiaire', key: 'PAC eau-eau x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'PAC air/eau indiv', key: 'PAC air-eau x Individuel', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', 'puissance nécessaire pour refroidissement équipement', 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'PAC air/eau collectif/tertiaire', key: 'PAC air-eau x Collectif', fields: ['puissance nécessaire équipement chauffage', 'puissance nécessaire pour ECS avec équipement', 'puissance nécessaire pour refroidissement équipement', 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
  { label: 'Radiateur électrique', key: 'Radiateur électrique x Individuel', fields: ['puissance nécessaire équipement chauffage', null, null, 'puissance équipement', 'gamme de puissance existante', 'production eau chaude sanitaire'] },
] as const;

// --- Helpers ---

function evaluate(key: string): number | string {
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

addSection('BILAN 1AN');

addTable(
  'Coûts par logement / tertiaire',
  ['Installation', 'P1 abo', 'P1 conso chaud', "P1'", 'P1 ECS', 'P1 conso froid', 'P2', 'P3', 'P4', 'P4 moins aides', 'Aides', 'Total sans aides', 'Total avec aides'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Bilan x ${m.coutKey} . P1abo`),
    evaluate(`Bilan x ${m.coutKey} . P1conso`),
    evaluate(`Bilan x ${m.coutKey} . P1prime`),
    evaluate(`Bilan x ${m.coutKey} . P1ECS`),
    evaluate(`Bilan x ${m.coutKey} . P1Consofroid`),
    evaluate(`Bilan x ${m.coutKey} . P2`),
    evaluate(`Bilan x ${m.coutKey} . P3`),
    evaluate(`Bilan x ${m.coutKey} . P4`),
    evaluate(`Bilan x ${m.coutKey} . P4 moins aides`),
    evaluate(`Bilan x ${m.coutKey} . aides`),
    evaluate(`Bilan x ${m.coutKey} . total sans aides`),
    evaluate(`Bilan x ${m.coutKey} . total avec aides`),
  ])
);

addSection('CALCULS ÉCONOMIQUES');

addTable(
  "Coût d'achat du combustible",
  ['Paramètres', 'Part abonnement', 'Part consommation', 'Heures creuses'],
  [
    ['Chaleur (RCU)', evaluate("Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement"), evaluate("Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation"), ''],
    ['Froid (RFU)', evaluate("Calcul Eco . Coût d'achat du combustible . Froid RFU x Part abonnement"), evaluate("Calcul Eco . Coût d'achat du combustible . Froid RFU x Part consommation"), ''],
    ['Electricité indiv', evaluate("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part abonnement"), evaluate("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HP"), evaluate("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HC")],
    ['Electricité coll', evaluate("Calcul Eco . Coût d'achat du combustible . Electricité coll x Part abonnement"), evaluate("Calcul Eco . Coût d'achat du combustible . Electricité coll x Part consommation"), ''],
    ['Gaz individuel', evaluate("Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part abonnement"), evaluate("Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part consommation"), ''],
    ['Gaz collectif', evaluate("Calcul Eco . Coût d'achat du combustible . Gaz coll x Part abonnement"), evaluate("Calcul Eco . Coût d'achat du combustible . Gaz coll x Part consommation"), ''],
    ['Granulés', '', evaluate("Calcul Eco . Coût d'achat du combustible . Granulés x Part consommation"), ''],
    ['Fioul', '', evaluate("Calcul Eco . Coût d'achat du combustible . Fioul x Part consommation"), ''],
  ]
);

addTable(
  'P4 - Investissement total (sans aide) €TTC',
  ['Installation', 'Investissement équipement total (€)', 'Investissement par lgt type / tertiaire (€)', 'Investissement ballon ECS à accumulation (€)', 'Investissement ballon ECS solaire panneau inclus (€)', 'Total investissement avec ballon ECS à accumulation (€)', 'Total investissement ballon ECS solaire panneaux (€)'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Calcul Eco . ${m.coutKey} . Investissement équipement Total`),
    evaluate(`Calcul Eco . ${m.coutKey} . Investissement équipement par logement type tertiaire`),
    evaluate(`Calcul Eco . ${m.coutKey} . Investissement ballon ECS à accumulation`),
    evaluate(`Calcul Eco . ${m.coutKey} . Investissement ballon ECS solaire panneau inclus`),
    evaluate(`Calcul Eco . ${m.coutKey} . Total investissement avec ballon ECS à accumulation`),
    evaluate(`Calcul Eco . ${m.coutKey} . Total investissement ballon ECS solaire panneaux`),
  ])
);

addTable(
  'P1 - Coût du combustible par lgt type / tertiaire',
  ['Installation', 'Coût combustible abonnement (P1 abo) €TTC/an', 'Coût combustible consommation (P1 conso) €TTC/an', "Coût électricité auxiliaire (P1') €TTC/an", 'Coût combustible ballon ECS à accumulation (P1 ECS) €TTC/an', 'Coût combustible ballon ECS solaire (P1 ECS) €TTC/an'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Calcul Eco . ${m.coutKey} . Coût du combustible abonnement`),
    evaluate(`Calcul Eco . ${m.coutKey} . Coût du combustible consommation`),
    evaluate(`Calcul Eco . ${m.coutKey} . Coût électricité auxiliaire`),
    evaluate(`Calcul Eco . ${m.coutKey} . Coût combustible pour ballon ECS à accumulation`),
    evaluate(`Calcul Eco . ${m.coutKey} . Coût combustible pour ballon ECS solaire`),
  ])
);

addTable(
  "P2, P3 - Coût de l'entretien",
  ['Installation', 'Petit entretien (P2) €TTC/an', 'Gros entretien (P3) €TTC/an', 'Par logement/tertiaire - Petit entretien (P2) €TTC/an', 'Par logement/tertiaire - Gros entretien (P3) €TTC/an'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutKey} . petit entretien P2`),
    evaluate(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutKey} . gros entretien P3`),
    evaluate(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutKey} . petit entretien P2 par logement tertiaire`),
    evaluate(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutKey} . gros entretien P3 par logement tertiaire`),
  ])
);

addTable(
  'Montant des aides par logement/tertiaire',
  ['Installation', "Ma prime renov' (€)", 'Coup de pouce (€)', 'CEE (€)', 'Coût total des aides (€)'],
  [
    ...modesDeChauffage.map((m) => [
      m.label,
      evaluate(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutKey} . Ma prime renov'`),
      evaluate(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutKey} . Coup de pouce`),
      evaluate(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutKey} . CEE`),
      evaluate(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutKey} . Total`),
    ] as (string | number)[]),
    [
      'Panneau solaire thermique pour production ECS',
      evaluate("Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Ma prime renov'"),
      evaluate('Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Coup de pouce'),
      evaluate('Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . CEE'),
      evaluate('Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Total'),
    ],
  ]
);

addSection('CALCULS TECHNIQUES');

const puissanceHeaders = ['Installation', 'Production eau chaude sanitaire ?', 'Puissance nécessaire chauffage (kW)', 'Puissance nécessaire ECS (kW)', 'Puissance nécessaire refroidissement (kW)', 'Puissance équipement (kW)', 'Gamme de puissance existante (kW)'];

addTable(
  'Puissance totale des installations',
  puissanceHeaders,
  installationsPuissance.map((inst) => {
    // fields order: [chauffage, ecs, refroidissement, puissance, gamme, productionEcs]
    const [chauffage, ecs, refroidissement, puissance, gamme, productionEcs] = inst.fields;
    return [
      inst.label,
      productionEcs ? evaluate(`Installation x ${inst.key} . ${productionEcs}`) : '',
      chauffage ? evaluate(`Installation x ${inst.key} . ${chauffage}`) : '',
      ecs ? evaluate(`Installation x ${inst.key} . ${ecs}`) : '',
      refroidissement ? evaluate(`Installation x ${inst.key} . ${refroidissement}`) : '',
      puissance ? evaluate(`Installation x ${inst.key} . ${puissance}`) : '',
      gamme ? evaluate(`Installation x ${inst.key} . ${gamme}`) : '',
    ];
  })
);

addTable(
  'Si besoins équipements ECS différenciés',
  ['Installation', "Besoin d'installation supplémentaire pour ECS ?", 'Volume du ballon ECS (L)', "Consommation d'électricité (kWh/an)", "Appoint d'électricité (kWh/an)"],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Installation x ${m.envKey} . besoin d'installation supplémentaire pour produire l'ECS`),
    evaluate(`Installation x ${m.envKey} . volume du ballon ECS`),
    evaluate(`Installation x ${m.envKey} . consommation d'électricité chauffe-eau électrique`),
    evaluate(`Installation x ${m.envKey} . appoint d'électricité chauffe-eau solaire`),
  ])
);

addTable(
  'Bilan par lgt / tertiaire',
  ['Installation', 'Consommation combustible chaleur', 'Consommation combustible froid', 'Consommation auxiliaire (kWh elec/an)'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Installation x ${m.envKey} . consommation combustible chaleur`),
    evaluate(`Installation x ${m.envKey} . consommation combustible froid`),
    evaluate(`Installation x ${m.envKey} . consommation auxiliaire`),
  ])
);

addTable(
  'Bilan des consommations par lgt / tertiaire',
  ['Installation', 'Consommation combustible hors électricité', "Consommation d'électricité chauffage/refroidissement et ECS (kWh/an)"],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Installation x ${m.envKey} . consommation combustible hors électricité`),
    evaluate(`Installation x ${m.envKey} . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS`),
  ])
);

addSection('CALCULS ENVIRONNEMENTAUX');

addTable(
  'Emissions de CO2',
  ['Installation', "Besoin installation supplémentaire ECS ?", 'Scope 1 - Besoins chauffage et ECS si même équipement (kgCO2 équ.)', 'Scope 2 - Auxiliaires et combustible électrique (kgCO2 équ.)', 'Scope 2 - ECS solaire thermique', 'Scope 2 - ECS avec ballon électrique', 'Scope 2 - Total', 'Scope 3', 'Total des émissions'],
  modesDeChauffage.map((m) => [
    m.label,
    evaluate(`Installation x ${m.envKey} . besoin d'installation supplémentaire pour produire l'ECS`),
    evaluate(`env . Installation x ${m.envKey} . besoins de chauffage et ECS si même équipement`),
    evaluate(`env . Installation x ${m.envKey} . auxiliaires et combustible électrique`),
    evaluate(`env . Installation x ${m.envKey} . ECS solaire thermique`),
    evaluate(`env . Installation x ${m.envKey} . ECS avec ballon électrique`),
    evaluate(`env . Installation x ${m.envKey} . Scope 2`),
    evaluate(`env . Installation x ${m.envKey} . Scope 3`),
    evaluate(`env . Installation x ${m.envKey} . Total`),
  ])
);

out.end(() => {
  console.log(`CSV généré : ${outputPath}`);
});
