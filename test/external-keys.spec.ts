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
  bilanSuffixes.map((suffix) => `${inst} . Bilan . ${suffix}` as const)
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
    (suffix) => `${inst} . Calcul Eco . ${suffix}` as const
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
    (suffix) => `${inst} . Calcul Eco . ${suffix}` as const
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
      `${inst} . P2 P3 Coût de l'entretien . ${suffix}` as const
  )
) satisfies RuleName[];

// --- Calcul Eco - Montant des aides (par coutPublicodeKey + statique, DebugDrawer.tsx) ---

const aidesSuffixes = [
  'CEE',
  'Coup de pouce',
  "Ma prime renov'",
  'Total',
] as const;

const clesAides = [
  ...installations.flatMap((inst) =>
    aidesSuffixes.map(
      (suffix) =>
        `${inst} . Montant des aides par logement tertiaire . ${suffix}` as const
    )
  ),
  // Panneau solaire thermique reste sous Calcul Eco (règle partagée)
  ...aidesSuffixes.map(
    (suffix) =>
      `Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . ${suffix}` as const
  ),
] satisfies RuleName[];

// --- Installation - Puissance totale (statiques, DebugDrawer.tsx) ---
// Les suffixes varient selon le type d'installation.

const puissanceAvecECS = [
  'Réseaux de chaleur',
  'Chaudière à granulés coll',
  'Gaz indiv avec cond',
  'Gaz indiv sans cond',
  'Gaz coll avec cond',
  'Gaz coll sans cond',
  'Fioul indiv',
  'Fioul coll',
  'PAC eau-eau indiv',
  'PAC eau-eau coll',
] as const;

const puissanceSuffixesAvecECS = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance nécessaire pour ECS avec équipement',
  'puissance équipement',
] as const;

const puissanceSansECSSansFroid = [
  'Poêle à granulés indiv',
  'Radiateur électrique',
] as const;

const puissanceSuffixesSansECS = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance équipement',
] as const;

const puissanceAvecFroidSansECS = [
  'PAC air-air indiv',
  'PAC air-air coll',
] as const;

const puissanceSuffixesAvecFroid = [
  'gamme de puissance existante',
  'production eau chaude sanitaire',
  'puissance nécessaire équipement chauffage',
  'puissance équipement',
  'puissance nécessaire pour refroidissement équipement',
] as const;

const puissanceAvecECSEtFroid = [
  'PAC air-eau indiv',
  'PAC air-eau coll',
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
      (s) => `${inst} . Installation . ${s}` as const
    )
  ),
  ...puissanceSansECSSansFroid.flatMap((inst) =>
    puissanceSuffixesSansECS.map(
      (s) => `${inst} . Installation . ${s}` as const
    )
  ),
  ...puissanceAvecFroidSansECS.flatMap((inst) =>
    puissanceSuffixesAvecFroid.map(
      (s) => `${inst} . Installation . ${s}` as const
    )
  ),
  ...puissanceAvecECSEtFroid.flatMap((inst) =>
    puissanceSuffixesAvecECSEtFroid.map(
      (s) => `${inst} . Installation . ${s}` as const
    )
  ),
  ...puissanceSuffixesReseauxFroid.map(
    (s) => `Réseaux de froid . Installation . ${s}` as const
  ),
] satisfies RuleName[];

// --- Installation - ECS différenciés (par emissionsCO2PublicodesKey, DebugDrawer.tsx) ---

const ecsSuffixes = [
  "besoin d'installation supplémentaire pour produire l'ECS",
  'volume du ballon ECS',
  "consommation d'électricité chauffe-eau électrique",
  "appoint d'électricité chauffe-eau solaire",
] as const;

const clesECS = installations.flatMap((inst) =>
  ecsSuffixes.map((s) => `${inst} . Installation . ${s}` as const)
) satisfies RuleName[];

// --- Installation - Bilan consommations (par emissionsCO2PublicodesKey, DebugDrawer.tsx) ---

const consommationSuffixes = [
  'consommation auxiliaire',
  'consommation combustible chaleur',
  'consommation combustible froid',
  'consommation combustible hors électricité',
  "consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS",
] as const;

const clesConsommation = installations.flatMap((inst) =>
  consommationSuffixes.map((s) => `${inst} . Installation . ${s}` as const)
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

const clesEnv = installations.flatMap((inst) =>
  envSuffixes.map((s) => `${inst} . Environnement . ${s}` as const)
) satisfies RuleName[];

// --- ParametresDesModesDeChauffage.tsx ---

const clesParamsStatiques = [
  'type de production de froid',
] satisfies RuleName[];

const clesRatiosEcoInvestissement = [
  "ratios économiques . Investissement x Pose et mise en place de l'installation",
  'ratios économiques . Investissement x TVA',
  "ratios économiques . Chauffe-eau x électrique à accumulation x coût investissement",
  'ratios économiques . Chauffe-eau x solaire x coût investissement',
  "ratios économiques . Chauffe-eau x panneaux solaire thermique x coût investissement",
  'ratios économiques . Amortissement x Taux actualisation',
] satisfies RuleName[];

const clesParamsCombustibles = [
  'Paramètres économiques . Réseaux chaleur . Coût',
  'Paramètres économiques . Réseaux chaleur . Part fixe',
  'Paramètres économiques . Réseaux chaleur . Part variable',
  'Paramètres économiques . Gaz x Puissance souscrite pour calcul installation collective ou tertiaire',
  'Paramètres économiques . Gaz x Abonnement x Part Fixe TTC collectif ou tertiaire',
  'Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel',
  'Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel x Coût distribution HT',
  'Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel x Coût commerciaux hors CEE HT',
  'Paramètres économiques . Gaz x Consommation x Part Variable TTC',
  'Paramètres économiques . Gaz x Coût de la molécule HT',
  'Paramètres économiques . Gaz x Coût de transport HT',
  'Paramètres économiques . Gaz x Coût distribution HT',
  'Paramètres économiques . Gaz x Coût des CEE HT',
  "Paramètres économiques . Gaz x Taxe x Part fixe x Contribution tarifaire d'acheminement CTA",
  'Paramètres économiques . Gaz x Taxe x Part fixe x TVA',
  'Paramètres économiques . Gaz x Taxe x Part variable x Taxe intérieure de consommation sur le gaz naturel TICGN',
  'Paramètres économiques . Gaz x Taxe x Part variable x TVA',
  'Paramètres économiques . Electricité x Option tarifaire',
  'Paramètres économiques . Electricité x Puissance souscrite indiv',
  'Paramètres économiques . Electricité x Puissance souscrite coll',
  'Paramètres économiques . Electricité x Abonnement Part Fixe indiv',
  'Paramètres économiques . Electricité x Abonnement Part Fixe coll',
  'Paramètres économiques . Electricité x Consommation Part variable en heure pleine',
  'Paramètres économiques . Electricité x Consommation Part variable en heure creuse',
  "ratios économiques . Coût des combustibles x Electricité . Heure pleine x Heure creuse . Part de la consommation en HP",
  "ratios économiques . Coût des combustibles x Electricité . Heure pleine x Heure creuse . Part de la consommation en HC",
  'Paramètres économiques . Electricité x Taxe . Part Fixe x TVA',
  "Paramètres économiques . Electricité x Taxe . Part Variable x Accise sur l'électricité ex TIPCSE CSPE",
  'Paramètres économiques . Electricité x Taxe . Part Variable x TVA',
  'Paramètres économiques . Granulés . Type de conditionnement',
  'Paramètres économiques . Granulés . Prix pour les granulés',
  'Paramètres économiques . Granulés . TVA',
  'Paramètres économiques . Fioul . Prix livraison incluse',
  'Paramètres économiques . Fioul . TVA',
  'Paramètres économiques . Fioul . TICPE',
  'Paramètres économiques . Réseaux froid . Coût',
  'Paramètres économiques . Réseaux froid . Part fixe',
  'Paramètres économiques . Réseaux froid . Part variable',
] satisfies RuleName[];

const clesParamsEntretienP2 = [
  'Paramètres économiques . Petit entretien P2 . TVA',
  'Paramètres économiques . Petit entretien P2 . RCU',
  'Paramètres économiques . Petit entretien P2 . RFU',
  'Paramètres économiques . Petit entretien P2 . Poêle à granulés indiv',
  'Paramètres économiques . Petit entretien P2 . Chaudière à granulés coll',
  'Paramètres économiques . Petit entretien P2 . Gaz indiv avec cond',
  'Paramètres économiques . Petit entretien P2 . Gaz indiv sans cond',
  'Paramètres économiques . Petit entretien P2 . Gaz coll avec cond',
  'Paramètres économiques . Petit entretien P2 . Gaz coll sans cond',
  'Paramètres économiques . Petit entretien P2 . Fioul indiv',
  'Paramètres économiques . Petit entretien P2 . Fioul coll',
  'Paramètres économiques . Petit entretien P2 . PAC air-air indiv',
  'Paramètres économiques . Petit entretien P2 . PAC air-air coll',
  'Paramètres économiques . Petit entretien P2 . PAC eau-eau indiv',
  'Paramètres économiques . Petit entretien P2 . PAC eau-eau coll',
  'Paramètres économiques . Petit entretien P2 . PAC air-eau indiv',
  'Paramètres économiques . Petit entretien P2 . PAC air-eau coll',
  'Paramètres économiques . Petit entretien P2 . Radiateur électrique',
  'Paramètres économiques . Petit entretien P2 . Chauffe-eau électrique à accumulation',
  'Paramètres économiques . Petit entretien P2 . Chauffe-eau solaire',
] satisfies RuleName[];

const clesParamsEntretienP3 = [
  'Paramètres économiques . Gros entretien P3 . TVA',
  'Paramètres économiques . Gros entretien P3 . RCU',
  'Paramètres économiques . Gros entretien P3 . RFU',
  'Paramètres économiques . Gros entretien P3 . Poêle à granulés indiv',
  'Paramètres économiques . Gros entretien P3 . Chaudière à granulés coll',
  'Paramètres économiques . Gros entretien P3 . Gaz indiv avec cond',
  'Paramètres économiques . Gros entretien P3 . Gaz indiv sans cond',
  'Paramètres économiques . Gros entretien P3 . Gaz coll avec cond',
  'Paramètres économiques . Gros entretien P3 . Gaz coll sans cond',
  'Paramètres économiques . Gros entretien P3 . Fioul indiv',
  'Paramètres économiques . Gros entretien P3 . Fioul coll',
  'Paramètres économiques . Gros entretien P3 . PAC air-air indiv',
  'Paramètres économiques . Gros entretien P3 . PAC air-air coll',
  'Paramètres économiques . Gros entretien P3 . PAC eau-eau indiv',
  'Paramètres économiques . Gros entretien P3 . PAC eau-eau coll',
  'Paramètres économiques . Gros entretien P3 . PAC air-eau indiv',
  'Paramètres économiques . Gros entretien P3 . PAC air-eau coll',
  'Paramètres économiques . Gros entretien P3 . Radiateur électrique',
  'Paramètres économiques . Gros entretien P3 . Chauffe-eau électrique à accumulation',
  'Paramètres économiques . Gros entretien P3 . Chauffe-eau solaire',
] satisfies RuleName[];

const clesParamsAides = [
  'Paramètres économiques . Aides . Éligibilité x Prise en compte des aides',
  'Paramètres économiques . Aides . Éligibilité x Je suis un particulier',
  'Paramètres économiques . Aides . Éligibilité x Ressources du ménage',
  "Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul",
  "Paramètres économiques . Aides . Aides x Éligible Ma prime renov'",
  'Paramètres économiques . Aides . Aides x Éligible Coup de pouce chauffage',
  'Paramètres économiques . Aides . Aides x Éligible CEE',
  'Paramètres économiques . Aides . Valeur CEE',
] satisfies RuleName[];

const clesRatiosTechniques = [
  'ratios . RCU Rendement sous station chauffage',
  'ratios . RCU Rendement sous station ECS',
  'ratios . RCU Conso auxiliaire chauffage',
  'ratios . RCU Conso auxiliaire ECS',
  'ratios . RCU Durée avant renouvellement',
  'ratios . RFU Rendement sous station',
  'ratios . RFU Conso auxiliaire',
  'ratios . RFU Durée de vie',
  'ratios . GRA POELE Rendement poêle chauffage',
  'ratios . GRA POELE Conso combustible',
  'ratios . GRA POELE Durée de vie',
  'ratios . GRA CHAUD Rendement chaudière chauffage',
  'ratios . GRA CHAUD Conso combustible',
  'ratios . GRA CHAUD Conso auxiliaire',
  'ratios . GRA CHAUD Durée de vie',
  'ratios . GAZ IND COND Rendement chaudière chauffage',
  'ratios . GAZ IND COND Rendement chaudière ECS',
  'ratios . GAZ IND COND Conso combustible',
  'ratios . GAZ IND COND Conso auxiliaire chauffage',
  'ratios . GAZ IND COND Conso auxiliaire ECS',
  'ratios . GAZ IND COND Durée de vie',
  'ratios . GAZ IND SCOND Rendement chaudière',
  'ratios . GAZ IND SCOND Conso combustible',
  'ratios . GAZ IND SCOND Conso auxiliaire chauffage',
  'ratios . GAZ IND SCOND Conso auxiliaire ECS',
  'ratios . GAZ IND SCOND Durée de vie',
  'ratios . GAZ COLL COND Rendement chaudière chauffage',
  'ratios . GAZ COLL COND Rendement chaudière ECS',
  'ratios . GAZ COLL COND Conso combustible',
  'ratios . GAZ COLL COND Conso auxiliaire chauffage',
  'ratios . GAZ COLL COND Conso auxiliaire ECS',
  'ratios . GAZ COLL COND Durée de vie',
  'ratios . GAZ COLL SCOND Rendement chaudière',
  'ratios . GAZ COLL SCOND Conso combustible',
  'ratios . GAZ COLL SCOND Conso auxiliaire chauffage',
  'ratios . GAZ COLL SCOND Conso auxiliaire ECS',
  'ratios . GAZ COLL SCOND Durée de vie',
  'ratios . FIOUL IND Rendement chaudière',
  'ratios . FIOUL IND Conso combustible',
  'ratios . FIOUL IND Conso auxiliaire chauffage',
  'ratios . FIOUL IND Conso auxiliaire ECS',
  'ratios . FIOUL IND Durée de vie',
  'ratios . FIOUL COLL Rendement chaudière chauffage',
  'ratios . FIOUL COLL Rendement chaudière ECS',
  'ratios . FIOUL COLL Conso combustible',
  'ratios . FIOUL COLL Conso auxiliaire chauffage',
  'ratios . FIOUL COLL Conso auxiliaire ECS',
  'ratios . FIOUL COLL Durée de vie',
  'ratios . PAC AIR AIR SCOP indiv',
  'ratios . PAC AIR AIR SEER indiv',
  'ratios . PAC AIR AIR Durée de vie indiv',
  'ratios . PAC AIR AIR SCOP coll',
  'ratios . PAC AIR AIR SEER coll',
  'ratios . PAC AIR AIR Durée de vie coll',
  'ratios . PAC EAU EAU SCOP indiv capteurs horizontaux',
  'ratios . PAC EAU EAU Durée de vie',
  'ratios . PAC EAU EAU SCOP coll champ de sondes',
  'ratios . PAC AIR EAU SCOP indiv',
  'ratios . PAC AIR EAU SEER indiv',
  'ratios . PAC AIR EAU Durée de vie indiv',
  'ratios . PAC AIR EAU SCOP coll',
  'ratios . PAC AIR EAU SEER coll',
  'ratios . PAC AIR EAU Durée de vie coll',
  'ratios . RAD ELEC INDIV Rendement',
  'ratios . RAD ELEC INDIV Conso combustible',
  'ratios . RAD ELEC INDIV Durée de vie',
] satisfies RuleName[];

const clesInvestissementInstallation = [
  'Investissement x frais de raccordement au réseaux x RCU',
  'Investissement x frais de raccordement au réseaux x RFU',
  'Investissement x Poêle à granulés indiv',
  'Investissement x Chaudière à granulés coll',
] satisfies RuleName[];

const clesRatiosEcoInstallation = [
  'ratios économiques . Gaz x indiv avec cond',
  'ratios économiques . Gaz x indiv sans cond',
  'ratios économiques . Gaz x coll avec cond',
  'ratios économiques . Gaz x coll sans cond',
  'ratios économiques . Fioul x indiv',
  'ratios économiques . Fioul x collectif',
  'ratios économiques . PAC x air-air réversible x Individuel',
  'ratios économiques . PAC x air-air réversible x Collectif',
  'ratios économiques . PAC x eau-eau non réversible x Individuel',
  'ratios économiques . PAC x eau-eau non réversible x Collectif',
  'ratios économiques . PAC x eau-eau non réversible . Coûts hors captage sous-sol',
  'ratios économiques . PAC x eau-eau non réversible . Coûts captage sous-sol champs sur sonde',
  'ratios économiques . PAC x air-eau réversible x Individuel',
  'ratios économiques . PAC x air-eau réversible x Collectif',
  'ratios économiques . Radiateur électrique x Individuel x investissement total',
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
