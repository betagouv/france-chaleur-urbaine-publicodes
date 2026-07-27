import { describe, it, expect } from 'vitest';
import rules from '../publicodes-build/france-chaleur-urbaine-publicodes.model.json' with { type: 'json' };
import type { RuleName } from '../publicodes-build';

/**
 * Clés utilisées en externe par le comparateur france-chaleur-urbaine notamment.
 * Ce test garantit que ces clés ne sont pas supprimées ou renommées
 * par erreur, ce qui casserait la compatibilité.
 *
 * TypeScript valide les clés à la compilation via `satisfies RuleName[]`.
 * Le test runtime vérifie leur présence dans le modèle compilé.
 */

// --- Constantes partagées ---

// Une racine unique par mode : les anciens namespaces (Bilan x / Calcul Eco / env . Installation x)
// ont fusionné, il n'y a plus de liste distincte pour les clés environnementales.
const installations = [
  'réseau de chaleur',
  'chaudière à granulés',
  'gaz coll avec cond',
  'gaz coll sans cond',
  'fioul coll',
  'PAC air-air coll',
  'PAC air-eau coll',
  'PAC eau-eau coll',
  'poêle à granulés',
  'gaz indiv avec cond',
  'gaz indiv sans cond',
  'fioul indiv',
  'PAC air-air indiv',
  'PAC air-eau indiv',
  'PAC eau-eau indiv',
  'radiateur électrique',
] as const;

// --- Clés statiques (ComparateurPublicodes.tsx) ---

const clesStatiques = [
  'climatisation . incluse',
  'ecs . production',
  'ecs . type de production',
  'climat . code département',
] satisfies RuleName[];

// --- Clés adresse (mappings.ts → addresseToPublicodesRules) ---

const clesAdresse = [
  'réseau de chaleur . caractéristiques . contenu CO2',
  'réseau de chaleur . caractéristiques . contenu CO2 ACV',
  'réseau de chaleur . caractéristiques . livraisons totales',
  'réseau de chaleur . caractéristiques . part fixe',
  'réseau de chaleur . caractéristiques . part variable',
  'réseau de chaleur . caractéristiques . prix moyen',
  'réseau de chaleur . caractéristiques . production totale',
  'réseau de chaleur . caractéristiques . taux EnRR',
  'réseau de froid . caractéristiques . contenu CO2',
  'réseau de froid . caractéristiques . contenu CO2 ACV',
  'réseau de froid . caractéristiques . livraisons totales',
  'réseau de froid . caractéristiques . production totale',
  'climat . code département',
  'climat . température de référence chaud commune',
] satisfies RuleName[];

// --- Bilan (par mode de chauffage × coutPublicodeKey) ---

const bilanSuffixes = [
  'P1abo',
  'P1conso',
  'P1prime',
  'P1ECS',
  'P1Consofroid',
  'P2',
  'P3',
  'P4',
  'P4 moins aides',
  'aides',
  'total sans aides',
  'total avec aides',
] as const;

const clesBilan = installations.flatMap((inst) =>
  bilanSuffixes.map((suffix) => `${inst} . bilan . ${suffix}` as const)
) satisfies RuleName[];

// --- Calcul Eco - Coût d'achat du combustible (statiques, DebugDrawer.tsx) ---

const clesCoutCombustible = [
  "combustibles . réseau de chaleur . abonnement",
  "combustibles . réseau de chaleur . consommation",
  "combustibles . réseau de froid . abonnement",
  "combustibles . réseau de froid . consommation",
  "combustibles . électricité . abonnement individuel",
  "combustibles . électricité . consommation individuel HP",
  "combustibles . électricité . consommation individuel HC",
  "combustibles . électricité . abonnement collectif",
  "combustibles . électricité . consommation collectif",
  "combustibles . gaz . abonnement individuel",
  "combustibles . gaz . consommation individuel",
  "combustibles . gaz . abonnement collectif",
  "combustibles . gaz . consommation collectif",
  "combustibles . granulés . consommation",
  "combustibles . fioul . consommation",
] satisfies RuleName[];

// --- Calcul Eco - Investissement (par coutPublicodeKey, DebugDrawer.tsx) ---

const investissementSuffixes = [
  'investissement équipement',
  'investissement par logement',
  'investissement ballon ECS',
  'investissement chauffe-eau solaire',
  'investissement total avec ballon ECS',
  'investissement total avec chauffe-eau solaire',
] as const;

const clesInvestissement = installations.flatMap((inst) =>
  investissementSuffixes.map(
    (suffix) => `${inst} . coûts . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Calcul Eco - P1 Coût du combustible (par coutPublicodeKey, DebugDrawer.tsx) ---

const p1CombustibleSuffixes = [
  'P1 abonnement',
  'P1 consommation',
  'P1 auxiliaires',
  'P1 ballon ECS',
  'P1 chauffe-eau solaire',
] as const;

const clesP1Combustible = installations.flatMap((inst) =>
  p1CombustibleSuffixes.map(
    (suffix) => `${inst} . coûts . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Calcul Eco - P2 P3 Coût de l'entretien (par coutPublicodeKey, DebugDrawer.tsx) ---

const p2p3Suffixes = [
  'petit entretien P2',
  'gros entretien P3',
  'petit entretien P2 par logement tertiaire',
  'gros entretien P3 par logement tertiaire',
] as const;

const clesP2P3 = installations.flatMap((inst) =>
  p2p3Suffixes.map(
    (suffix) =>
      `${inst} . coûts . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Calcul Eco - Montant des aides (par coutPublicodeKey + statique, DebugDrawer.tsx) ---

const aidesSuffixes = [
  'CEE',
  'coup de pouce',
  'ma prime rénov',
  'total',
] as const;

const clesAides = [
  ...installations.flatMap((inst) =>
    aidesSuffixes.map((suffix) => `${inst} . aides . ${suffix}` as const)
  ),
  // Le panneau solaire thermique pour ECS est un add-on, pas un mode : ses aides vivent sous ecs additionnelle.
  ...aidesSuffixes.map(
    (suffix) => `ecs additionnelle . aides panneau solaire . ${suffix}` as const
  ),
] satisfies RuleName[];

// --- Installation - Puissance totale (statiques, DebugDrawer.tsx) ---
// Les suffixes varient selon le type d'installation.

const puissanceAvecECS = [
  'réseau de chaleur',
  'chaudière à granulés',
  'gaz indiv avec cond',
  'gaz indiv sans cond',
  'gaz coll avec cond',
  'gaz coll sans cond',
  'fioul indiv',
  'fioul coll',
  'PAC eau-eau indiv',
  'PAC eau-eau coll',
] as const;

const puissanceSuffixesAvecECS = [
  'puissance retenue',
  'production eau chaude sanitaire',
  'puissance chauffage',
  'puissance ECS',
  'puissance équipement',
] as const;

const puissanceSansECSSansFroid = ['poêle à granulés', 'radiateur électrique'] as const;

const puissanceSuffixesSansECS = [
  'puissance retenue',
  'production eau chaude sanitaire',
  'puissance chauffage',
  'puissance équipement',
] as const;

const puissanceAvecFroidSansECS = ['PAC air-air indiv', 'PAC air-air coll'] as const;

const puissanceSuffixesAvecFroid = [
  'puissance retenue',
  'production eau chaude sanitaire',
  'puissance chauffage',
  'puissance équipement',
  'puissance refroidissement',
] as const;

const puissanceAvecECSEtFroid = ['PAC air-eau indiv', 'PAC air-eau coll'] as const;

const puissanceSuffixesAvecECSEtFroid = [
  'puissance retenue',
  'production eau chaude sanitaire',
  'puissance chauffage',
  'puissance ECS',
  'puissance équipement',
  'puissance refroidissement',
] as const;

const puissanceSuffixesReseauxFroid = [
  'puissance retenue',
  'production eau chaude sanitaire',
  'puissance équipement',
  'puissance refroidissement',
] as const;

const clesPuissance = [
  ...puissanceAvecECS.flatMap((inst) =>
    puissanceSuffixesAvecECS.map(
      (s) => `${inst} . installation . ${s}` as const
    )
  ),
  ...puissanceSansECSSansFroid.flatMap((inst) =>
    puissanceSuffixesSansECS.map(
      (s) => `${inst} . installation . ${s}` as const
    )
  ),
  ...puissanceAvecFroidSansECS.flatMap((inst) =>
    puissanceSuffixesAvecFroid.map(
      (s) => `${inst} . installation . ${s}` as const
    )
  ),
  ...puissanceAvecECSEtFroid.flatMap((inst) =>
    puissanceSuffixesAvecECSEtFroid.map(
      (s) => `${inst} . installation . ${s}` as const
    )
  ),
  ...puissanceSuffixesReseauxFroid.map(
    (s) => `réseau de froid . installation . ${s}` as const
  ),
] satisfies RuleName[];

// --- Installation - ECS différenciés (par emissionsCO2PublicodesKey, DebugDrawer.tsx) ---

const ecsSuffixes = [
  'ECS additionnelle nécessaire',
  'volume du ballon ECS',
  'consommation chauffe-eau électrique',
  'appoint chauffe-eau solaire',
] as const;

const clesECS = installations.flatMap((inst) =>
  ecsSuffixes.map((s) => `${inst} . installation . ${s}` as const)
) satisfies RuleName[];

// --- Installation - Bilan consommations (par emissionsCO2PublicodesKey, DebugDrawer.tsx) ---

const consommationSuffixes = [
  'consommation auxiliaire',
  'consommation combustible chaleur',
  'consommation combustible froid',
  'consommation hors électricité',
  'consommation électricité',
] as const;

const clesConsommation = installations.flatMap((inst) =>
  consommationSuffixes.map((s) => `${inst} . installation . ${s}` as const)
) satisfies RuleName[];

// --- Env - Émissions CO2 (par emissionsCO2PublicodesKey) ---

const envSuffixes = [
  'besoins de chauffage et ECS si même équipement',
  'auxiliaires et combustible électrique',
  'ECS solaire thermique',
  'ECS avec ballon électrique',
  'scope 1',
  'scope 2',
  'scope 3',
  'total',
] as const;

const clesEnv = installations.flatMap((inst) =>
  envSuffixes.map((s) => `${inst} . environnement . ${s}` as const)
) satisfies RuleName[];

// --- ParametresDesModesDeChauffage.tsx ---

const clesParamsStatiques = [
  'climatisation . type de production',
] satisfies RuleName[];

const clesRatiosEcoInvestissement = [
  "investissement . pose et mise en place",
  'investissement . TVA',
  "ecs additionnelle . coût du chauffe-eau électrique",
  'ecs additionnelle . coût du chauffe-eau solaire',
  "ecs additionnelle . coût des panneaux solaires",
  'amortissement . taux actualisation',
] satisfies RuleName[];

const clesParamsCombustibles = [
  'combustibles . réseau de chaleur . coût',
  'combustibles . réseau de chaleur . part fixe',
  'combustibles . réseau de chaleur . part variable',
  'combustibles . gaz . puissance souscrite collectif ou tertiaire',
  'combustibles . gaz . abonnement part fixe collectif ou tertiaire',
  'combustibles . gaz . abonnement part fixe individuel',
  'combustibles . gaz . abonnement part fixe individuel . coût distribution HT',
  'combustibles . gaz . abonnement part fixe individuel . coûts commerciaux hors CEE HT',
  'combustibles . gaz . consommation part variable TTC',
  'combustibles . gaz . coût de la molécule HT',
  'combustibles . gaz . coût de transport HT',
  'combustibles . gaz . coût distribution HT',
  'combustibles . gaz . coût des CEE HT',
  "combustibles . gaz . taxes . CTA",
  'combustibles . gaz . taxes . TVA part fixe',
  'combustibles . gaz . taxes . TICGN',
  'combustibles . gaz . taxes . TVA part variable',
  'combustibles . électricité . option tarifaire',
  'combustibles . électricité . puissance souscrite individuel',
  'combustibles . électricité . puissance souscrite collectif',
  'combustibles . électricité . abonnement part fixe individuel',
  'combustibles . électricité . abonnement part fixe collectif',
  'combustibles . électricité . part variable heure pleine',
  'combustibles . électricité . part variable heure creuse',
  "combustibles . électricité . tarifs . option heures creuses . part de la consommation en HP",
  "combustibles . électricité . tarifs . option heures creuses . part de la consommation en HC",
  'combustibles . électricité . taxes . Part Fixe x TVA',
  "combustibles . électricité . taxes . Part Variable x Accise sur l'électricité ex TIPCSE CSPE",
  'combustibles . électricité . taxes . Part Variable x TVA',
  'combustibles . granulés . type de conditionnement',
  'combustibles . granulés . prix pour les granulés',
  'combustibles . granulés . TVA',
  'combustibles . fioul . prix livraison incluse',
  'combustibles . fioul . TVA',
  'combustibles . fioul . TICPE',
  'combustibles . réseau de froid . coût',
  'combustibles . réseau de froid . part fixe',
  'combustibles . réseau de froid . part variable',
] satisfies RuleName[];

const clesParamsEntretienP2 = [
  'investissement . TVA petit entretien P2',
  'réseau de chaleur . ratios . petit entretien P2',
  'réseau de froid . ratios . petit entretien P2',
  'poêle à granulés . ratios . petit entretien P2',
  'chaudière à granulés . ratios . petit entretien P2',
  'gaz indiv avec cond . ratios . petit entretien P2',
  'gaz indiv sans cond . ratios . petit entretien P2',
  'gaz coll avec cond . ratios . petit entretien P2',
  'gaz coll sans cond . ratios . petit entretien P2',
  'fioul indiv . ratios . petit entretien P2',
  'fioul coll . ratios . petit entretien P2',
  'PAC air-air indiv . ratios . petit entretien P2',
  'PAC air-air coll . ratios . petit entretien P2',
  'PAC eau-eau indiv . ratios . petit entretien P2',
  'PAC eau-eau coll . ratios . petit entretien P2',
  'PAC air-eau indiv . ratios . petit entretien P2',
  'PAC air-eau coll . ratios . petit entretien P2',
  'radiateur électrique . ratios . petit entretien P2',
  'ecs additionnelle . petit entretien P2 chauffe-eau électrique',
  'ecs additionnelle . petit entretien P2 chauffe-eau solaire',
] satisfies RuleName[];

const clesParamsEntretienP3 = [
  'investissement . TVA gros entretien P3',
  'réseau de chaleur . ratios . gros entretien P3',
  'réseau de froid . ratios . gros entretien P3',
  'poêle à granulés . ratios . gros entretien P3',
  'chaudière à granulés . ratios . gros entretien P3',
  'gaz indiv avec cond . ratios . gros entretien P3',
  'gaz indiv sans cond . ratios . gros entretien P3',
  'gaz coll avec cond . ratios . gros entretien P3',
  'gaz coll sans cond . ratios . gros entretien P3',
  'fioul indiv . ratios . gros entretien P3',
  'fioul coll . ratios . gros entretien P3',
  'PAC air-air indiv . ratios . gros entretien P3',
  'PAC air-air coll . ratios . gros entretien P3',
  'PAC eau-eau indiv . ratios . gros entretien P3',
  'PAC eau-eau coll . ratios . gros entretien P3',
  'PAC air-eau indiv . ratios . gros entretien P3',
  'PAC air-eau coll . ratios . gros entretien P3',
  'radiateur électrique . ratios . gros entretien P3',
  'ecs additionnelle . gros entretien P3 chauffe-eau électrique',
  'ecs additionnelle . gros entretien P3 chauffe-eau solaire',
] satisfies RuleName[];

const clesParamsAides = [
  'aides . éligibilité . prise en compte des aides',
  'aides . éligibilité . particulier',
  'aides . éligibilité . ressources du ménage',
  "aides . éligibilité . chaudière gaz ou fioul actuelle",
  "aides . éligibilité . éligible ma prime rénov",
  'aides . éligibilité . éligible coup de pouce',
  'aides . éligibilité . éligible CEE',
  'aides . valeur CEE',
] satisfies RuleName[];

const clesRatiosTechniques = [
  // clés écrites par la page paramètres (Configuration.tsx)
  'ecs additionnelle . durée de vie chauffe-eau électrique',
  'ecs additionnelle . rendement stockage ballon électrique',
  'ecs additionnelle . durée de vie chauffe-eau solaire',
  'ecs additionnelle . rendement stockage ballon solaire',
  "ecs additionnelle . part du solaire dans la production",
  'PAC eau-eau coll . ratios . durée de vie puits géothermiques',
  'ecs additionnelle . surface de panneaux',
  'ecs additionnelle . capacité du ballon électrique',
  'ecs additionnelle . capacité du ballon électrique',
  'réseau de chaleur . ratios . rendement sous station chauffage',
  'réseau de chaleur . ratios . rendement sous station ECS',
  'réseau de chaleur . ratios . conso auxiliaire chauffage',
  'réseau de chaleur . ratios . conso auxiliaire ECS',
  'réseau de chaleur . ratios . durée avant renouvellement',
  'réseau de froid . ratios . rendement sous station',
  'réseau de froid . ratios . conso auxiliaire',
  'réseau de froid . ratios . durée de vie',
  'poêle à granulés . ratios . rendement poêle chauffage',
  'poêle à granulés . ratios . conso combustible',
  'poêle à granulés . ratios . durée de vie',
  'chaudière à granulés . ratios . rendement chaudière chauffage',
  'chaudière à granulés . ratios . conso combustible',
  'chaudière à granulés . ratios . conso auxiliaire',
  'chaudière à granulés . ratios . durée de vie',
  'gaz indiv avec cond . ratios . rendement chaudière chauffage',
  'gaz indiv avec cond . ratios . rendement chaudière ECS',
  'gaz indiv avec cond . ratios . conso combustible',
  'gaz indiv avec cond . ratios . conso auxiliaire chauffage',
  'gaz indiv avec cond . ratios . conso auxiliaire ECS',
  'gaz indiv avec cond . ratios . durée de vie',
  'gaz indiv sans cond . ratios . rendement chaudière',
  'gaz indiv sans cond . ratios . conso combustible',
  'gaz indiv sans cond . ratios . conso auxiliaire chauffage',
  'gaz indiv sans cond . ratios . conso auxiliaire ECS',
  'gaz indiv sans cond . ratios . durée de vie',
  'gaz coll avec cond . ratios . rendement chaudière chauffage',
  'gaz coll avec cond . ratios . rendement chaudière ECS',
  'gaz coll avec cond . ratios . conso combustible',
  'gaz coll avec cond . ratios . conso auxiliaire chauffage',
  'gaz coll avec cond . ratios . conso auxiliaire ECS',
  'gaz coll avec cond . ratios . durée de vie',
  'gaz coll sans cond . ratios . rendement chaudière',
  'gaz coll sans cond . ratios . conso combustible',
  'gaz coll sans cond . ratios . conso auxiliaire chauffage',
  'gaz coll sans cond . ratios . conso auxiliaire ECS',
  'gaz coll sans cond . ratios . durée de vie',
  'fioul indiv . ratios . rendement chaudière',
  'fioul indiv . ratios . conso combustible',
  'fioul indiv . ratios . conso auxiliaire chauffage',
  'fioul indiv . ratios . conso auxiliaire ECS',
  'fioul indiv . ratios . durée de vie',
  'fioul coll . ratios . rendement chaudière chauffage',
  'fioul coll . ratios . rendement chaudière ECS',
  'fioul coll . ratios . conso combustible',
  'fioul coll . ratios . conso auxiliaire chauffage',
  'fioul coll . ratios . conso auxiliaire ECS',
  'fioul coll . ratios . durée de vie',
  'PAC air-air indiv . ratios . SCOP',
  'PAC air-air indiv . ratios . SEER',
  'PAC air-air indiv . ratios . durée de vie',
  'PAC air-air coll . ratios . SCOP',
  'PAC air-air coll . ratios . SEER',
  'PAC air-air coll . ratios . durée de vie',
  'PAC eau-eau indiv . ratios . SCOP capteurs horizontaux',
  'PAC eau-eau indiv . ratios . durée de vie',
  'PAC eau-eau coll . ratios . SCOP champ de sondes',
  'PAC air-eau indiv . ratios . SCOP',
  'PAC air-eau indiv . ratios . SEER',
  'PAC air-eau indiv . ratios . durée de vie',
  'PAC air-eau coll . ratios . SCOP',
  'PAC air-eau coll . ratios . SEER',
  'PAC air-eau coll . ratios . durée de vie',
  'radiateur électrique . ratios . rendement',
  'radiateur électrique . ratios . conso combustible',
  'radiateur électrique . ratios . durée de vie',
] satisfies RuleName[];

const clesInvestissementInstallation = [
  'réseau de chaleur . ratios . frais de raccordement',
  'réseau de froid . ratios . frais de raccordement',
  'poêle à granulés . ratios . investissement équipement',
  'chaudière à granulés . ratios . investissement équipement',
] satisfies RuleName[];

const clesRatiosEcoInstallation = [
  'gaz indiv avec cond . ratios . investissement équipement',
  'gaz indiv sans cond . ratios . investissement équipement',
  'gaz coll avec cond . ratios . investissement équipement',
  'gaz coll sans cond . ratios . investissement équipement',
  'fioul indiv . ratios . investissement équipement',
  'fioul coll . ratios . investissement équipement',
  'PAC air-air indiv . ratios . investissement équipement',
  'PAC air-air coll . ratios . investissement équipement',
  'PAC eau-eau indiv . ratios . investissement équipement',
  'PAC eau-eau coll . ratios . investissement équipement',
  'PAC eau-eau coll . ratios . investissement hors captage',
  'PAC eau-eau coll . ratios . investissement captage champ de sondes',
  'PAC air-eau indiv . ratios . investissement équipement',
  'PAC air-eau coll . ratios . investissement équipement',
  'radiateur électrique . ratios . investissement équipement',
] satisfies RuleName[];

// --- Module chaleur-renouvelable (heating-modes/catalog.tsx → coutParAnPublicodeKey) ---

const coutParAnModes = [
  'réseau de chaleur',
  'chaudière à granulés',
  'PAC air-eau coll',
  'PAC eau-eau coll',
  'poêle à granulés',
  'PAC air-air indiv',
  'PAC air-eau indiv',
  'PAC eau-eau indiv',
  'PAC air-eau coll hybride',
  'solaire thermique',
  'PAC capteurs solaires atmosphériques',
  'PAC air-eau collective ECS',
  'chauffe-eau thermodynamique',
  'système solaire combiné',
] as const;

const clesChaleurRenouvelable = coutParAnModes.map(
  (mode) => `${mode} . bilan . total sans installation` as const
) satisfies RuleName[];

// --- Modules simulator / pac (SimulatorFormFields.tsx, constants.ts, simulation-service.ts) ---

const clesSimulateurs = [
  'bâtiment . type',
  'bâtiment . méthode résidentiel',
  'bâtiment . méthode tertiaire 2026',
  'bâtiment . surface tertiaire',
  "bâtiment . nombre de logements",
  'ménage . revenu . plafond très modeste',
  'ménage . revenu . plafond modeste',
  'ménage . revenu . plafond intermédiaire',
  'bâtiment . appartement ou maison',
  'aides . CEE . BAR-TH-171 PAC air-eau . efficacité énergétique saisonnière',
  'aides . coup de pouce PAC air-eau',
  'réseau de chaleur . aides cumac . BAR-TH-137',
  'réseau de chaleur . aides cumac . BAT-TH-127',
  'réseau de chaleur . aides cumac . coup de pouce',
  'réseau de chaleur . aides cumac . total',
  'réseau de chaleur . aides cumac . total montant',
] satisfies RuleName[];

// --- Tests ---

const assertKeysExist = (keys: RuleName[]) => {
  it.each(keys)('%s', (key) => {
    expect(rules).toHaveProperty(key);
  });
};

describe('Clés externes', () => {
  describe('Clés statiques', () => {
    assertKeysExist(clesStatiques);
  });
  describe('Clés adresse', () => {
    assertKeysExist(clesAdresse);
  });
  describe('Bilan', () => {
    assertKeysExist(clesBilan);
  });
  describe("Calcul Eco - Coût d'achat du combustible", () => {
    assertKeysExist(clesCoutCombustible);
  });
  describe('Calcul Eco - Investissement', () => {
    assertKeysExist(clesInvestissement);
  });
  describe('Calcul Eco - P1 Coût du combustible', () => {
    assertKeysExist(clesP1Combustible);
  });
  describe("Calcul Eco - P2 P3 Coût de l'entretien", () => {
    assertKeysExist(clesP2P3);
  });
  describe('Calcul Eco - Montant des aides', () => {
    assertKeysExist(clesAides);
  });
  describe('Installation - Puissance totale', () => {
    assertKeysExist(clesPuissance);
  });
  describe('Installation - ECS différenciés', () => {
    assertKeysExist(clesECS);
  });
  describe('Installation - Bilan consommations', () => {
    assertKeysExist(clesConsommation);
  });
  describe('Env - Émissions CO2', () => {
    assertKeysExist(clesEnv);
  });
  describe('Module chaleur-renouvelable', () => {
    assertKeysExist(clesChaleurRenouvelable);
  });
  describe('Modules simulator / pac', () => {
    assertKeysExist(clesSimulateurs);
  });

  describe('Params - Clés statiques', () => {
    assertKeysExist(clesParamsStatiques);
  });
  describe('Params - Ratios économiques investissement', () => {
    assertKeysExist(clesRatiosEcoInvestissement);
  });
  describe('Params - Combustibles', () => {
    assertKeysExist(clesParamsCombustibles);
  });
  describe('Params - Petit entretien P2', () => {
    assertKeysExist(clesParamsEntretienP2);
  });
  describe('Params - Gros entretien P3', () => {
    assertKeysExist(clesParamsEntretienP3);
  });
  describe('Params - Aides', () => {
    assertKeysExist(clesParamsAides);
  });
  describe('Params - Ratios techniques', () => {
    assertKeysExist(clesRatiosTechniques);
  });
  describe('Params - Investissement par installation', () => {
    assertKeysExist(clesInvestissementInstallation);
  });
  describe('Params - Ratios économiques par installation', () => {
    assertKeysExist(clesRatiosEcoInstallation);
  });
});
