import { describe, it, expect } from 'vitest';
import Engine, { Situation } from 'publicodes';
import rules from '../publicodes-build/france-chaleur-urbaine-publicodes.model.json' with { type: 'json' };

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
        'Gaz coll avec cond . Bilan . P1abo': 73,
        'Gaz coll avec cond . Bilan . P1conso': 1056,
        'Gaz coll avec cond . Bilan . P1prime': 7,
        'Gaz coll avec cond . Bilan . P1ECS': 0,
        'Gaz coll avec cond . Bilan . P1Consofroid': 0,
        'Gaz coll avec cond . Bilan . P2': 70,
        'Gaz coll avec cond . Bilan . P3': 27,
        'Gaz coll avec cond . Bilan . P4': 71,
        'Gaz coll avec cond . Bilan . P4 moins aides': 71,
        'Gaz coll avec cond . Bilan . aides': 0,
        'Gaz coll avec cond . Bilan . total sans aides': 1304,
        'Gaz coll avec cond . Bilan . total avec aides': 1304,
        'Gaz coll avec cond . Environnement . besoins de chauffage et ECS si même équipement': 2495,
        'Gaz coll avec cond . Environnement . auxiliaires et combustible électrique': 2,
        'Gaz coll avec cond . Environnement . ECS solaire thermique': 0,
        'Gaz coll avec cond . Environnement . ECS avec ballon électrique': 0,
        'Gaz coll avec cond . Environnement . Scope 2': 2,
        'Gaz coll avec cond . Environnement . Scope 3': 9,
        'Gaz coll avec cond . Environnement . Total': 2506,
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
        'Gaz coll avec cond . Bilan . P1abo': 73,
        'Gaz coll avec cond . Bilan . P1conso': 1056,
        'Gaz coll avec cond . Bilan . P1prime': 7,
        'Gaz coll avec cond . Bilan . P1ECS': 0,
        'Gaz coll avec cond . Bilan . P1Consofroid': 14,
        'Gaz coll avec cond . Bilan . P2': 78,
        'Gaz coll avec cond . Bilan . P3': 30,
        'Gaz coll avec cond . Bilan . P4': 239,
        'Gaz coll avec cond . Bilan . P4 moins aides': 239,
        'Gaz coll avec cond . Bilan . aides': 0,
        'Gaz coll avec cond . Bilan . total sans aides': 1497,
        'Gaz coll avec cond . Bilan . total avec aides': 1497,
        'Gaz coll avec cond . Environnement . besoins de chauffage et ECS si même équipement': 2495,
        'Gaz coll avec cond . Environnement . auxiliaires et combustible électrique': 2,
        'Gaz coll avec cond . Environnement . ECS solaire thermique': 0,
        'Gaz coll avec cond . Environnement . ECS avec ballon électrique': 0,
        'Gaz coll avec cond . Environnement . Scope 2': 2,
        'Gaz coll avec cond . Environnement . Scope 3': 9,
        'Gaz coll avec cond . Environnement . Total': 2506,
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
        'Gaz coll avec cond . Bilan . P1abo': 55,
        'Gaz coll avec cond . Bilan . P1conso': 808,
        'Gaz coll avec cond . Bilan . P1prime': 3,
        'Gaz coll avec cond . Bilan . P1ECS': 491,
        'Gaz coll avec cond . Bilan . P1Consofroid': 0,
        'Gaz coll avec cond . Bilan . P2': 70,
        'Gaz coll avec cond . Bilan . P3': 16,
        'Gaz coll avec cond . Bilan . P4': 105,
        'Gaz coll avec cond . Bilan . P4 moins aides': 105,
        'Gaz coll avec cond . Bilan . aides': 0,
        'Gaz coll avec cond . Bilan . total sans aides': 1548,
        'Gaz coll avec cond . Bilan . total avec aides': 1548,
        'Gaz coll avec cond . Environnement . besoins de chauffage et ECS si même équipement': 1909,
        'Gaz coll avec cond . Environnement . auxiliaires et combustible électrique': 1,
        'Gaz coll avec cond . Environnement . ECS solaire thermique': 0,
        'Gaz coll avec cond . Environnement . ECS avec ballon électrique': 165,
        'Gaz coll avec cond . Environnement . Scope 2': 166,
        'Gaz coll avec cond . Environnement . Scope 3': 5,
        'Gaz coll avec cond . Environnement . Total': 2081,
      },
    },
  ] satisfies TestCases[];

  testCases.forEach((testCase) => {
    describe.skip(testCase.description, () => {
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
  expected:Partial<Situation<keyof typeof rules>>;
};
