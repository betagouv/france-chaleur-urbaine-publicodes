import Engine, { type Situation } from "publicodes";
import { describe, expect, it } from "vitest";
import rules from "../publicodes-build/france-chaleur-urbaine-publicodes.model.json" with {
	type: "json",
};

const options = {
	logger: { warn: () => {}, error: () => {}, log: () => {} },
};

const commonSituation = {
	// 20 Avenue de Ségur 75007 Paris
	"caractéristique réseau de chaleur . contenu CO2": 0.157,
	"caractéristique réseau de chaleur . contenu CO2 ACV": 0.182,
	"caractéristique réseau de chaleur . livraisons totales": 3739841,
	"caractéristique réseau de chaleur . part fixe": 23.6851545755077,
	"caractéristique réseau de chaleur . part variable": 76.3148454244923,
	"caractéristique réseau de chaleur . prix moyen": 109.502957238406,
	"caractéristique réseau de chaleur . production totale": 5907294.94,
	"caractéristique réseau de chaleur . taux EnRR": 48.8,
	"caractéristique réseau de froid . contenu CO2": 0.008,
	"caractéristique réseau de froid . contenu CO2 ACV": 0.016,
	"caractéristique réseau de froid . livraisons totales": 425178,
	"caractéristique réseau de froid . production totale": 515292,
	"code département": "'75'",
	"température de référence chaud commune": -5,
} satisfies Situation<keyof typeof rules>;

describe("Moteur Publicodes France Chaleur Urbaine", () => {
	it("devrait pouvoir créer le moteur sans erreur", () => {
		expect(() => {
			new Engine(rules, options);
		}).not.toThrow();
	});

	it("devrait avoir des règles définies", () => {
		expect(rules).toBeDefined();
		expect(typeof rules).toBe("object");
		expect(Object.keys(rules).length).toBeGreaterThan(0);
	});

	describe("barème de revenus MaPrimeRénov", () => {
		it("calcule la classe depuis le barème Île-de-France via le code département", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"code département": "'75'",
				"ménage . revenu": 35000,
				"Nombre d'habitants moyen par appartement": 2,
			});

			expect(engine.evaluate("ménage . revenu . classe").nodeValue).toBe(
				"Très modeste",
			);
			expect(
				engine.evaluate(
					"Paramètres économiques . Aides . Éligibilité x Ressources du ménage",
				).nodeValue,
			).toBe("Très modeste");
		});

		it("expose les plafonds Île-de-France via des règles Publicodes", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"code département": "'75'",
				"Nombre d'habitants moyen par appartement": 2,
			});

			expect(
				engine.evaluate("ménage . revenu . plafond très modeste").nodeValue,
			).toBe(35270);
			expect(engine.evaluate("ménage . revenu . plafond modeste").nodeValue).toBe(
				42933,
			);
			expect(
				engine.evaluate("ménage . revenu . plafond intermédiaire").nodeValue,
			).toBe(60051);
		});

		it("calcule la classe depuis le barème hors Île-de-France via le code département", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"code département": "'59'",
				"ménage . revenu": 35000,
				"Nombre d'habitants moyen par appartement": 2,
			});

			expect(engine.evaluate("ménage . revenu . classe").nodeValue).toBe(
				"Intermédiaire",
			);
			expect(
				engine.evaluate(
					"Paramètres économiques . Aides . Éligibilité x Ressources du ménage",
				).nodeValue,
			).toBe("Intermédiaire");
		});

		it("expose les plafonds hors Île-de-France via des règles Publicodes", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"code département": "'59'",
				"Nombre d'habitants moyen par appartement": 2,
			});

			expect(
				engine.evaluate("ménage . revenu . plafond très modeste").nodeValue,
			).toBe(25393);
			expect(engine.evaluate("ménage . revenu . plafond modeste").nodeValue).toBe(
				32553,
			);
			expect(
				engine.evaluate("ménage . revenu . plafond intermédiaire").nodeValue,
			).toBe(45842);
		});

		it("conserve la saisie explicite historique des ressources du ménage", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"code département": "'75'",
				"ménage . revenu": 35000,
				"Nombre d'habitants moyen par appartement": 2,
				"Paramètres économiques . Aides . Éligibilité x Ressources du ménage":
					"'Supérieur'",
			});

			expect(
				engine.evaluate(
					"Paramètres économiques . Aides . Éligibilité x Ressources du ménage",
				).nodeValue,
			).toBe("Supérieur");
		});
	});

	describe("écritures front sur les clés historiques de ratios", () => {
		// Les sections `<mode> . ratios` sont des alias vers les clés plates
		// historiques que le front écrit (page paramètres). Ce test garantit
		// qu'une écriture sur la clé historique se propage bien aux calculs.
		it("se propagent aux calculs via les alias locaux des modes", () => {
			const base = new Engine(rules, options);
			base.setSituation(commonSituation);
			const p4 = base.evaluate("gaz indiv avec cond . bilan . P4").nodeValue;

			const modifie = new Engine(rules, options);
			modifie.setSituation({
				...commonSituation,
				"ratios . GAZ IND COND Durée de vie": 10,
				"ratios économiques . Gaz x indiv avec cond": 9999,
			});
			expect(
				modifie.evaluate("gaz indiv avec cond . bilan . P4").nodeValue,
			).not.toBe(p4);
		});
	});

	describe("CEE BAR-TH-171 PAC air-eau individuelle", () => {
		it("calcule le montant CEE pour une maison individuelle H1 avec Etas entre 111% et 140%", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"ratios économiques x aides . CEE x PAC air-eau indiv x BAR-TH-171 . efficacité énergétique saisonnière":
					"120%",
				"Paramètres économiques . Aides . Aides x Éligible CEE": "oui",
				"Paramètres économiques . Aides . Valeur CEE": 0.00804,
				"ratios . GNRL Appartement ou maison": "'Maison'",
				"surface logement type tertiaire": 95,
				"zone climatique": "'H1'",
			});

			expect(
				engine.evaluate(
					"ratios économiques x aides . CEE x PAC air-eau indiv x BAR-TH-171",
				).nodeValue,
			).toBe(109080);
			expect(
				engine.evaluate(
					"Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . CEE",
				).nodeValue,
			).toBeCloseTo(877.0032);
			expect(
				engine.evaluate(
					"Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Coup de pouce",
				).nodeValue,
			).toBeCloseTo(4385.016);
		});

		it("n'accorde pas de kWh cumac sous 111% d'Etas", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"ratios économiques x aides . CEE x PAC air-eau indiv x BAR-TH-171 . efficacité énergétique saisonnière":
					"110%",
				"ratios . GNRL Appartement ou maison": "'Appartement'",
				"surface logement type tertiaire": 70,
				"zone climatique": "'H2'",
			});

			expect(
				engine.evaluate(
					"ratios économiques x aides . CEE x PAC air-eau indiv x BAR-TH-171",
				).nodeValue,
			).toBe(0);
		});

		it("n'accorde pas le Coup de pouce sans remplacement de chaudière", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"ratios économiques x aides . CEE x PAC air-eau indiv x BAR-TH-171 . efficacité énergétique saisonnière":
					"120%",
				"Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul":
					"non",
				"Paramètres économiques . Aides . Valeur CEE": 0.00804,
				"ratios . GNRL Appartement ou maison": "'Maison'",
				"surface logement type tertiaire": 95,
				"type de bâtiment": "'résidentiel'",
				"zone climatique": "'H1'",
			});

			expect(
				engine.evaluate(
					"Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Coup de pouce",
				).nodeValue,
			).toBe(0);
		});
	});

	const testCases = [
		{
			description: "Bilan x Gaz coll avec cond",
			situation: {
				"Inclure la climatisation": "non",
				"Production eau chaude sanitaire": "oui",
				"type de production ECS": "'Avec équipement chauffage'",
			},
			expected: {
				"Bilan x Gaz coll avec cond . P1abo": 73,
				"Bilan x Gaz coll avec cond . P1conso": 1056,
				"Bilan x Gaz coll avec cond . P1prime": 7,
				"Bilan x Gaz coll avec cond . P1ECS": 0,
				"Bilan x Gaz coll avec cond . P1Consofroid": 0,
				"Bilan x Gaz coll avec cond . P2": 70,
				"Bilan x Gaz coll avec cond . P3": 27,
				"Bilan x Gaz coll avec cond . P4": 71,
				"Bilan x Gaz coll avec cond . P4 moins aides": 71,
				"Bilan x Gaz coll avec cond . aides": 0,
				"Bilan x Gaz coll avec cond . total sans aides": 1304,
				"Bilan x Gaz coll avec cond . total avec aides": 1304,
				"env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement": 2495,
				"env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique": 2,
				"env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique": 0,
				"env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique": 0,
				"env . Installation x Gaz coll avec cond x Collectif . Scope 2": 2,
				"env . Installation x Gaz coll avec cond x Collectif . Scope 3": 9,
				"env . Installation x Gaz coll avec cond x Collectif . Total": 2506,
			},
		},
		{
			description: "Bilan x Gaz coll avec cond avec climatisation",
			situation: {
				"Inclure la climatisation": "oui",
				"Production eau chaude sanitaire": "oui",
				"type de production ECS": "'Avec équipement chauffage'",
			},
			expected: {
				"Bilan x Gaz coll avec cond . P1abo": 73,
				"Bilan x Gaz coll avec cond . P1conso": 1056,
				"Bilan x Gaz coll avec cond . P1prime": 7,
				"Bilan x Gaz coll avec cond . P1ECS": 0,
				"Bilan x Gaz coll avec cond . P1Consofroid": 14,
				"Bilan x Gaz coll avec cond . P2": 78,
				"Bilan x Gaz coll avec cond . P3": 30,
				"Bilan x Gaz coll avec cond . P4": 239,
				"Bilan x Gaz coll avec cond . P4 moins aides": 239,
				"Bilan x Gaz coll avec cond . aides": 0,
				"Bilan x Gaz coll avec cond . total sans aides": 1497,
				"Bilan x Gaz coll avec cond . total avec aides": 1497,
				"env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement": 2495,
				"env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique": 2,
				"env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique": 0,
				"env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique": 0,
				"env . Installation x Gaz coll avec cond x Collectif . Scope 2": 2,
				"env . Installation x Gaz coll avec cond x Collectif . Scope 3": 9,
				"env . Installation x Gaz coll avec cond x Collectif . Total": 2506,
			},
		},
		{
			description: "Bilan x Gaz coll avec cond avec ECS",
			situation: {
				"Inclure la climatisation": "non",
				"Production eau chaude sanitaire": "oui",
				"type de production ECS": "'Chauffe-eau électrique'",
			},
			expected: {
				"Bilan x Gaz coll avec cond . P1abo": 55,
				"Bilan x Gaz coll avec cond . P1conso": 808,
				"Bilan x Gaz coll avec cond . P1prime": 3,
				"Bilan x Gaz coll avec cond . P1ECS": 491,
				"Bilan x Gaz coll avec cond . P1Consofroid": 0,
				"Bilan x Gaz coll avec cond . P2": 70,
				"Bilan x Gaz coll avec cond . P3": 16,
				"Bilan x Gaz coll avec cond . P4": 105,
				"Bilan x Gaz coll avec cond . P4 moins aides": 105,
				"Bilan x Gaz coll avec cond . aides": 0,
				"Bilan x Gaz coll avec cond . total sans aides": 1548,
				"Bilan x Gaz coll avec cond . total avec aides": 1548,
				"env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement": 1909,
				"env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique": 1,
				"env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique": 0,
				"env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique": 165,
				"env . Installation x Gaz coll avec cond x Collectif . Scope 2": 166,
				"env . Installation x Gaz coll avec cond x Collectif . Scope 3": 5,
				"env . Installation x Gaz coll avec cond x Collectif . Total": 2081,
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
	expected: Pick<
		Situation<keyof typeof rules>,
		// coûts
		| "Bilan x Gaz coll avec cond . P1abo"
		| "Bilan x Gaz coll avec cond . P1conso"
		| "Bilan x Gaz coll avec cond . P1prime"
		| "Bilan x Gaz coll avec cond . P1ECS"
		| "Bilan x Gaz coll avec cond . P1Consofroid"
		| "Bilan x Gaz coll avec cond . P2"
		| "Bilan x Gaz coll avec cond . P3"
		| "Bilan x Gaz coll avec cond . P4"
		| "Bilan x Gaz coll avec cond . P4 moins aides"
		| "Bilan x Gaz coll avec cond . aides"
		| "Bilan x Gaz coll avec cond . total sans aides"
		| "Bilan x Gaz coll avec cond . total avec aides"
		// émissions de CO2
		| "env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement"
		| "env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique"
		| "env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique"
		| "env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique"
		| "env . Installation x Gaz coll avec cond x Collectif . Scope 2"
		| "env . Installation x Gaz coll avec cond x Collectif . Scope 3"
		| "env . Installation x Gaz coll avec cond x Collectif . Total"
	>;
};
