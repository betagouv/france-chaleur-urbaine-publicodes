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

const installations = [
  'Réseaux de chaleur',
  'Chaudière à granulés coll',
  'Gaz coll avec cond',
  'Gaz coll sans cond',
  'Fioul coll',
  'PAC air-air coll',
  'PAC air-eau coll',
  'PAC eau-eau coll',
  'Poêle à granulés indiv',
  'Gaz indiv avec cond',
  'Gaz indiv sans cond',
  'Fioul indiv',
  'PAC air-air indiv',
  'PAC air-eau indiv',
  'PAC eau-eau indiv',
  'Radiateur électrique',
] as const;

const envInstallations = [
  'Réseaux de chaleur x Collectif',
  'Chaudière à granulés coll x Collectif',
  'Gaz coll avec cond x Collectif',
  'Gaz coll sans cond x Collectif',
  'Fioul coll x Collectif',
  'PAC air-air x Collectif',
  'PAC air-eau x Collectif',
  'PAC eau-eau x Collectif',
  'Poêle à granulés indiv x Individuel',
  'Gaz indiv avec cond x Individuel',
  'Gaz indiv sans cond x Individuel',
  'Fioul indiv x Individuel',
  'PAC air-air x Individuel',
  'PAC air-eau x Individuel',
  'PAC eau-eau x Individuel',
  'Radiateur électrique x Individuel',
] as const;

// --- Clés statiques (ComparateurPublicodes.tsx) ---

const clesStatiques = [
  'Inclure la climatisation',
  'Production eau chaude sanitaire',
  'type de production ECS',
  'code département',
] satisfies RuleName[];

// --- Clés adresse (mappings.ts → addresseToPublicodesRules) ---

const clesAdresse = [
  'caractéristique réseau de chaleur . contenu CO2',
  'caractéristique réseau de chaleur . contenu CO2 ACV',
  'caractéristique réseau de chaleur . livraisons totales',
  'caractéristique réseau de chaleur . part fixe',
  'caractéristique réseau de chaleur . part variable',
  'caractéristique réseau de chaleur . prix moyen',
  'caractéristique réseau de chaleur . production totale',
  'caractéristique réseau de chaleur . taux EnRR',
  'caractéristique réseau de froid . contenu CO2',
  'caractéristique réseau de froid . contenu CO2 ACV',
  'caractéristique réseau de froid . livraisons totales',
  'caractéristique réseau de froid . production totale',
  'code département',
  'température de référence chaud commune',
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
  bilanSuffixes.map((suffix) => `Bilan x ${inst} . ${suffix}` as const)
) satisfies RuleName[];

// --- Calcul Eco - Coût d'achat du combustible (statiques, DebugDrawer.tsx) ---

const clesCoutCombustible = [
  "Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement",
  "Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation",
  "Calcul Eco . Coût d'achat du combustible . Froid RFU x Part abonnement",
  "Calcul Eco . Coût d'achat du combustible . Froid RFU x Part consommation",
  "Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part abonnement",
  "Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HP",
  "Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HC",
  "Calcul Eco . Coût d'achat du combustible . Electricité coll x Part abonnement",
  "Calcul Eco . Coût d'achat du combustible . Electricité coll x Part consommation",
  "Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part abonnement",
  "Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part consommation",
  "Calcul Eco . Coût d'achat du combustible . Gaz coll x Part abonnement",
  "Calcul Eco . Coût d'achat du combustible . Gaz coll x Part consommation",
  "Calcul Eco . Coût d'achat du combustible . Granulés x Part consommation",
  "Calcul Eco . Coût d'achat du combustible . Fioul x Part consommation",
] satisfies RuleName[];

// --- Calcul Eco - Investissement (par coutPublicodeKey, DebugDrawer.tsx) ---

const investissementSuffixes = [
  'Investissement équipement Total',
  'Investissement équipement par logement type tertiaire',
  'Investissement ballon ECS à accumulation',
  'Investissement ballon ECS solaire panneau inclus',
  'Total investissement avec ballon ECS à accumulation',
  'Total investissement ballon ECS solaire panneaux',
] as const;

const clesInvestissement = installations.flatMap((inst) =>
  investissementSuffixes.map(
    (suffix) => `Calcul Eco . ${inst} . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Calcul Eco - P1 Coût du combustible (par coutPublicodeKey, DebugDrawer.tsx) ---

const p1CombustibleSuffixes = [
  'Coût du combustible abonnement',
  'Coût du combustible consommation',
  'Coût électricité auxiliaire',
  'Coût combustible pour ballon ECS à accumulation',
  'Coût combustible pour ballon ECS solaire',
] as const;

const clesP1Combustible = installations.flatMap((inst) =>
  p1CombustibleSuffixes.map(
    (suffix) => `Calcul Eco . ${inst} . ${suffix}` as const
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
      `Calcul Eco . P2 P3 Coût de l'entretien . ${inst} . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Calcul Eco - Montant des aides (par coutPublicodeKey + statique, DebugDrawer.tsx) ---

const aidesInstallations = [
  ...installations,
  'Panneau solaire thermique pour production ECS',
] as const;

const aidesSuffixes = [
  'CEE',
  'Coup de pouce',
  "Ma prime renov'",
  'Total',
] as const;

const clesAides = aidesInstallations.flatMap((inst) =>
  aidesSuffixes.map(
    (suffix) =>
      `Calcul Eco . Montant des aides par logement tertiaire . ${inst} . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Installation - Puissance totale (statiques, DebugDrawer.tsx) ---
// Les suffixes varient selon le type d'installation.

const puissanceAvecECS = [
  'Réseaux de chaleur x Collectif',
  'Chaudière à granulés coll x Collectif',
  'Gaz indiv avec cond x Individuel',
  'Gaz indiv sans cond x Individuel',
  'Gaz coll avec cond x Collectif',
  'Gaz coll sans cond x Collectif',
  'Fioul indiv x Individuel',
  'Fioul coll x Collectif',
  'PAC eau-eau x Individuel',
  'PAC eau-eau x Collectif',
] as const;

const puissanceSuffixesAvecECS = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance nécessaire pour ECS avec équipement',
  'puissance équipement',
] as const;

const puissanceSansECSSansFroid = [
  'Poêle à granulés indiv x Individuel',
  'Radiateur électrique x Individuel',
] as const;

const puissanceSuffixesSansECS = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance équipement',
] as const;

const puissanceAvecFroidSansECS = [
  'PAC air-air x Individuel',
  'PAC air-air x Collectif',
] as const;

const puissanceSuffixesAvecFroid = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance équipement',
  'puissance nécessaire pour refroidissement équipement',
] as const;

const puissanceAvecECSEtFroid = [
  'PAC air-eau x Individuel',
  'PAC air-eau x Collectif',
] as const;

const puissanceSuffixesAvecECSEtFroid = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance nécessaire pour ECS avec équipement',
  'puissance équipement',
  'puissance nécessaire pour refroidissement équipement',
] as const;

const puissanceSuffixesReseauxFroid = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance équipement',
  'puissance nécessaire pour refroidissement équipement',
] as const;

const clesPuissance = [
  ...puissanceAvecECS.flatMap((inst) =>
    puissanceSuffixesAvecECS.map(
      (s) => `Installation x ${inst} . ${s}` as const
    )
  ),
  ...puissanceSansECSSansFroid.flatMap((inst) =>
    puissanceSuffixesSansECS.map(
      (s) => `Installation x ${inst} . ${s}` as const
    )
  ),
  ...puissanceAvecFroidSansECS.flatMap((inst) =>
    puissanceSuffixesAvecFroid.map(
      (s) => `Installation x ${inst} . ${s}` as const
    )
  ),
  ...puissanceAvecECSEtFroid.flatMap((inst) =>
    puissanceSuffixesAvecECSEtFroid.map(
      (s) => `Installation x ${inst} . ${s}` as const
    )
  ),
  ...puissanceSuffixesReseauxFroid.map(
    (s) => `Installation x Réseaux de froid x Collectif . ${s}` as const
  ),
] satisfies RuleName[];

// --- Installation - ECS différenciés (par emissionsCO2PublicodesKey, DebugDrawer.tsx) ---

const ecsSuffixes = [
  "besoin d'installation supplémentaire pour produire l'ECS",
  'volume du ballon ECS',
  "consommation d'électricité chauffe-eau électrique",
  "appoint d'électricité chauffe-eau solaire",
] as const;

const clesECS = envInstallations.flatMap((inst) =>
  ecsSuffixes.map((s) => `Installation x ${inst} . ${s}` as const)
) satisfies RuleName[];

// --- Installation - Bilan consommations (par emissionsCO2PublicodesKey, DebugDrawer.tsx) ---

const consommationSuffixes = [
  'consommation auxiliaire',
  'consommation combustible chaleur',
  'consommation combustible froid',
  'consommation combustible hors électricité',
  "consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS",
] as const;

const clesConsommation = envInstallations.flatMap((inst) =>
  consommationSuffixes.map((s) => `Installation x ${inst} . ${s}` as const)
) satisfies RuleName[];

// --- Env - Émissions CO2 (par emissionsCO2PublicodesKey) ---

const envSuffixes = [
  'besoins de chauffage et ECS si même équipement',
  'auxiliaires et combustible électrique',
  'ECS solaire thermique',
  'ECS avec ballon électrique',
  'Scope 2',
  'Scope 3',
  'Total',
] as const;

const clesEnv = envInstallations.flatMap((inst) =>
  envSuffixes.map((s) => `env . Installation x ${inst} . ${s}` as const)
) satisfies RuleName[];

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
});
