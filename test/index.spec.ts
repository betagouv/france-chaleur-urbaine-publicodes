import { describe, it, expect } from 'vitest';
import Engine, { Situation } from 'publicodes';
import rules from '../publicodes-build/france-chaleur-urbaine-publicodes.model.json' with { type: 'json' };
import { a } from 'vitest/dist/chunks/suite.B2jumIFP.js';

const options = {
  logger: { warn: () => {}, error: () => {}, log: () => {} },
};

const commonSituation = {
  // 20 Avenue de Ségur 75007 Paris
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
} satisfies Situation<keyof typeof rules>;

describe('Moteur Publicodes France Chaleur Urbaine', () => {
  it('devrait pouvoir créer le moteur sans erreur', () => {
    expect(() => {
      new Engine(rules, options);
    }).not.toThrow();
  });

  it('devrait avoir des règles définies', () => {
    expect(rules).toBeDefined();
    expect(typeof rules).toBe('object');
    expect(Object.keys(rules).length).toBeGreaterThan(0);
  });

  const testCases = [
    {
      description: 'Bilan x Gaz coll avec cond',
      situation: {
        'Inclure la climatisation': 'non',
        'Production eau chaude sanitaire': 'oui',
        'type de production ECS': "'Avec équipement chauffage'",
      },
      expected: {
        'Bilan x Gaz coll avec cond . P1abo': 73,
        'Bilan x Gaz coll avec cond . P1conso': 1056,
        'Bilan x Gaz coll avec cond . P1prime': 7,
        'Bilan x Gaz coll avec cond . P1ECS': 0,
        'Bilan x Gaz coll avec cond . P1Consofroid': 0,
        'Bilan x Gaz coll avec cond . P2': 70,
        'Bilan x Gaz coll avec cond . P3': 27,
        'Bilan x Gaz coll avec cond . P4': 71,
        'Bilan x Gaz coll avec cond . P4 moins aides': 71,
        'Bilan x Gaz coll avec cond . aides': 0,
        'Bilan x Gaz coll avec cond . total sans aides': 1304,
        'Bilan x Gaz coll avec cond . total avec aides': 1304,
        'env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement': 2495,
        'env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique': 2,
        'env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique': 0,
        'env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique': 0,
        'env . Installation x Gaz coll avec cond x Collectif . Scope 2': 2,
        'env . Installation x Gaz coll avec cond x Collectif . Scope 3': 9,
        'env . Installation x Gaz coll avec cond x Collectif . Total': 2506,
      },
    },
    {
      description: 'Bilan x Gaz coll avec cond avec climatisation',
      situation: {
        'Inclure la climatisation': 'oui',
        'Production eau chaude sanitaire': 'oui',
        'type de production ECS': "'Avec équipement chauffage'",
      },
      expected: {
        'Bilan x Gaz coll avec cond . P1abo': 73,
        'Bilan x Gaz coll avec cond . P1conso': 1056,
        'Bilan x Gaz coll avec cond . P1prime': 7,
        'Bilan x Gaz coll avec cond . P1ECS': 0,
        'Bilan x Gaz coll avec cond . P1Consofroid': 14,
        'Bilan x Gaz coll avec cond . P2': 78,
        'Bilan x Gaz coll avec cond . P3': 30,
        'Bilan x Gaz coll avec cond . P4': 239,
        'Bilan x Gaz coll avec cond . P4 moins aides': 239,
        'Bilan x Gaz coll avec cond . aides': 0,
        'Bilan x Gaz coll avec cond . total sans aides': 1497,
        'Bilan x Gaz coll avec cond . total avec aides': 1497,
        'env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement': 2495,
        'env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique': 2,
        'env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique': 0,
        'env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique': 0,
        'env . Installation x Gaz coll avec cond x Collectif . Scope 2': 2,
        'env . Installation x Gaz coll avec cond x Collectif . Scope 3': 9,
        'env . Installation x Gaz coll avec cond x Collectif . Total': 2506,
      },
    },
    {
      description: 'Bilan x Gaz coll avec cond avec ECS',
      situation: {
        'Inclure la climatisation': 'non',
        'Production eau chaude sanitaire': 'oui',
        'type de production ECS': "'Chauffe-eau électrique'",
      },
      expected: {
        'Bilan x Gaz coll avec cond . P1abo': 55,
        'Bilan x Gaz coll avec cond . P1conso': 808,
        'Bilan x Gaz coll avec cond . P1prime': 3,
        'Bilan x Gaz coll avec cond . P1ECS': 491,
        'Bilan x Gaz coll avec cond . P1Consofroid': 0,
        'Bilan x Gaz coll avec cond . P2': 70,
        'Bilan x Gaz coll avec cond . P3': 16,
        'Bilan x Gaz coll avec cond . P4': 105,
        'Bilan x Gaz coll avec cond . P4 moins aides': 105,
        'Bilan x Gaz coll avec cond . aides': 0,
        'Bilan x Gaz coll avec cond . total sans aides': 1548,
        'Bilan x Gaz coll avec cond . total avec aides': 1548,
        'env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement': 1909,
        'env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique': 1,
        'env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique': 0,
        'env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique': 165,
        'env . Installation x Gaz coll avec cond x Collectif . Scope 2': 166,
        'env . Installation x Gaz coll avec cond x Collectif . Scope 3': 5,
        'env . Installation x Gaz coll avec cond x Collectif . Total': 2081,
      },
    },
  ] satisfies TestCases[];

  testCases.forEach((testCase) => {
    describe(testCase.description, () => {
      const engine = new Engine(rules, options);
      engine.setSituation({ ...commonSituation, ...testCase.situation });

      Object.entries(testCase.expected).forEach(([ruleName, value]) => {
        it(ruleName, () => {
          const result = engine.evaluate(ruleName);
          expect(result).toBeDefined();
          expect(result?.nodeValue).toBeCloseTo(value, 0);
        });
      });
    });
  });
});

type TestCases = {
  description: string;
  situation: Situation<keyof typeof rules>;
  expected: Pick<
    Situation<keyof typeof rules>,
    // coûts
    | 'Bilan x Gaz coll avec cond . P1abo'
    | 'Bilan x Gaz coll avec cond . P1conso'
    | 'Bilan x Gaz coll avec cond . P1prime'
    | 'Bilan x Gaz coll avec cond . P1ECS'
    | 'Bilan x Gaz coll avec cond . P1Consofroid'
    | 'Bilan x Gaz coll avec cond . P2'
    | 'Bilan x Gaz coll avec cond . P3'
    | 'Bilan x Gaz coll avec cond . P4'
    | 'Bilan x Gaz coll avec cond . P4 moins aides'
    | 'Bilan x Gaz coll avec cond . aides'
    | 'Bilan x Gaz coll avec cond . total sans aides'
    | 'Bilan x Gaz coll avec cond . total avec aides'
    // émissions de CO2
    | 'env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement'
    | 'env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique'
    | 'env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique'
    | 'env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique'
    | 'env . Installation x Gaz coll avec cond x Collectif . Scope 2'
    | 'env . Installation x Gaz coll avec cond x Collectif . Scope 3'
    | 'env . Installation x Gaz coll avec cond x Collectif . Total'
  >;
};
