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
	"réseau de chaleur . caractéristiques . contenu CO2": 0.157,
	"réseau de chaleur . caractéristiques . contenu CO2 ACV": 0.182,
	"réseau de chaleur . caractéristiques . livraisons totales": 3739841,
	"réseau de chaleur . caractéristiques . part fixe": 23.6851545755077,
	"réseau de chaleur . caractéristiques . part variable": 76.3148454244923,
	"réseau de chaleur . caractéristiques . prix moyen": 109.502957238406,
	"réseau de chaleur . caractéristiques . production totale": 5907294.94,
	"réseau de chaleur . caractéristiques . taux EnRR": 48.8,
	"réseau de froid . caractéristiques . contenu CO2": 0.008,
	"réseau de froid . caractéristiques . contenu CO2 ACV": 0.016,
	"réseau de froid . caractéristiques . livraisons totales": 425178,
	"réseau de froid . caractéristiques . production totale": 515292,
	"climat . code département": "'75'",
	"climat . température de référence chaud commune": -5,
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
				"climat . code département": "'75'",
				"ménage . revenu": 35000,
				"bâtiment . habitants par logement": 2,
			});

			expect(engine.evaluate("ménage . revenu . classe").nodeValue).toBe(
				"Très modeste",
			);
			expect(
				engine.evaluate("aides . éligibilité . ressources du ménage").nodeValue,
			).toBe("Très modeste");
		});

		it("expose les plafonds Île-de-France via des règles Publicodes", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"climat . code département": "'75'",
				"bâtiment . habitants par logement": 2,
			});

			expect(
				engine.evaluate("ménage . revenu . plafond très modeste").nodeValue,
			).toBe(35270);
			expect(
				engine.evaluate("ménage . revenu . plafond modeste").nodeValue,
			).toBe(42933);
			expect(
				engine.evaluate("ménage . revenu . plafond intermédiaire").nodeValue,
			).toBe(60051);
		});

		it("calcule la classe depuis le barème hors Île-de-France via le code département", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"climat . code département": "'59'",
				"ménage . revenu": 35000,
				"bâtiment . habitants par logement": 2,
			});

			expect(engine.evaluate("ménage . revenu . classe").nodeValue).toBe(
				"Intermédiaire",
			);
			expect(
				engine.evaluate("aides . éligibilité . ressources du ménage").nodeValue,
			).toBe("Intermédiaire");
		});

		it("expose les plafonds hors Île-de-France via des règles Publicodes", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"climat . code département": "'59'",
				"bâtiment . habitants par logement": 2,
			});

			expect(
				engine.evaluate("ménage . revenu . plafond très modeste").nodeValue,
			).toBe(25393);
			expect(
				engine.evaluate("ménage . revenu . plafond modeste").nodeValue,
			).toBe(32553);
			expect(
				engine.evaluate("ménage . revenu . plafond intermédiaire").nodeValue,
			).toBe(45842);
		});

		it("laisse la saisie explicite des ressources du ménage primer sur le barème", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"climat . code département": "'75'",
				"ménage . revenu": 35000,
				"bâtiment . habitants par logement": 2,
				"aides . éligibilité . ressources du ménage": "'Supérieur'",
			});

			expect(
				engine.evaluate("aides . éligibilité . ressources du ménage").nodeValue,
			).toBe("Supérieur");
		});
	});

	describe("paramétrage des modes (sections ratios)", () => {
		// Les valeurs de référence vivent dans `<mode> . ratios . <nom>` : seule
		// forme depuis la suppression de compat.publicodes.
		it("une écriture de ratio de mode se propage aux calculs", () => {
			const base = new Engine(rules, options);
			base.setSituation(commonSituation);
			const p4 = base.evaluate("gaz indiv avec cond . bilan . P4").nodeValue;

			const modifie = new Engine(rules, options);
			modifie.setSituation({
				...commonSituation,
				"gaz indiv avec cond . ratios . durée de vie": 10,
				"gaz indiv avec cond . ratios . investissement équipement": 9999,
			});
			expect(
				modifie.evaluate("gaz indiv avec cond . bilan . P4").nodeValue,
			).not.toBe(p4);
		});

		it("une écriture de ratio est relue telle quelle", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				...commonSituation,
				"gaz indiv avec cond . ratios . durée de vie": 10,
			});
			expect(
				engine.evaluate("gaz indiv avec cond . ratios . durée de vie")
					.nodeValue,
			).toBe(10);
		});
	});

	describe("entrées utilisateur (namespaces canoniques)", () => {
		// Les entrées du simulateur sont désormais définies et écrites
		// directement sous bâtiment/climat/besoins/ecs/climatisation et
		// réseau … . caractéristiques : plus aucun alias historique à la racine.
		it("les écritures sur les namespaces d'entrée se propagent", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				...commonSituation,
				"bâtiment . DPE": "'F'",
				"bâtiment . type": "'tertiaire'",
				"bâtiment . appartement ou maison": "'Maison'",
				"bâtiment . nombre de logements": 42,
				"besoins . chauffage par logement": 7320,
				"ecs . type de production": "'Chauffe-eau électrique'",
				"climatisation . incluse": "oui",
				"réseau de chaleur . caractéristiques . prix moyen": 99.5,
			});
			expect(engine.evaluate("bâtiment . DPE").nodeValue).toBe("F");
			expect(engine.evaluate("bâtiment . type").nodeValue).toBe("tertiaire");
			expect(
				engine.evaluate("bâtiment . appartement ou maison").nodeValue,
			).toBe("Maison");
			expect(engine.evaluate("bâtiment . nombre de logements").nodeValue).toBe(
				42,
			);
			expect(
				engine.evaluate("besoins . chauffage par logement").nodeValue,
			).toBe(7320);
			expect(engine.evaluate("ecs . type de production").nodeValue).toBe(
				"Chauffe-eau électrique",
			);
			expect(engine.evaluate("climatisation . incluse").nodeValue).toBe(true);
			expect(
				engine.evaluate("réseau de chaleur . caractéristiques . prix moyen")
					.nodeValue,
			).toBe(99.5);
		});
	});

	describe("CEE BAR-TH-171 PAC air-eau individuelle", () => {
		it("calcule le montant CEE pour une maison individuelle H1 avec Etas entre 111% et 140%", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"aides . CEE . BAR-TH-171 PAC air-eau . efficacité énergétique saisonnière":
					"120%",
				"aides . éligibilité . éligible CEE": "oui",
				"aides . valeur CEE": 0.00804,
				"bâtiment . appartement ou maison": "'Maison'",
				"bâtiment . surface tertiaire": 95,
				"climat . zone": "'H1'",
			});

			expect(
				engine.evaluate("aides . CEE . BAR-TH-171 PAC air-eau").nodeValue,
			).toBe(109080);
			expect(
				engine.evaluate("PAC air-eau indiv . aides . CEE").nodeValue,
			).toBeCloseTo(877.0032);
			expect(
				engine.evaluate("PAC air-eau indiv . aides . coup de pouce").nodeValue,
			).toBeCloseTo(4385.016);
		});

		it("n'accorde pas de kWh cumac sous 111% d'Etas", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"aides . CEE . BAR-TH-171 PAC air-eau . efficacité énergétique saisonnière":
					"110%",
				"bâtiment . appartement ou maison": "'Appartement'",
				"bâtiment . surface tertiaire": 70,
				"climat . zone": "'H2'",
			});

			expect(
				engine.evaluate("aides . CEE . BAR-TH-171 PAC air-eau").nodeValue,
			).toBe(0);
		});

		it("n'accorde pas le Coup de pouce sans remplacement de chaudière", () => {
			const engine = new Engine(rules, options);
			engine.setSituation({
				"aides . CEE . BAR-TH-171 PAC air-eau . efficacité énergétique saisonnière":
					"120%",
				"aides . éligibilité . chaudière gaz ou fioul actuelle": "non",
				"aides . valeur CEE": 0.00804,
				"bâtiment . appartement ou maison": "'Maison'",
				"bâtiment . surface tertiaire": 95,
				"bâtiment . type": "'résidentiel'",
				"climat . zone": "'H1'",
			});

			expect(
				engine.evaluate("PAC air-eau indiv . aides . coup de pouce").nodeValue,
			).toBe(0);
		});
	});

	const testCases = [
		{
			description: "gaz coll avec cond : ECS par l'équipement de chauffage",
			situation: {
				"climatisation . incluse": "non",
				"ecs . production": "oui",
				"ecs . type de production": "'Avec équipement chauffage'",
			},
			expected: {
				"gaz coll avec cond . bilan . P1abo": 73,
				"gaz coll avec cond . bilan . P1conso": 1056,
				"gaz coll avec cond . bilan . P1prime": 7,
				"gaz coll avec cond . bilan . P1ECS": 0,
				"gaz coll avec cond . bilan . P1Consofroid": 0,
				"gaz coll avec cond . bilan . P2": 70,
				"gaz coll avec cond . bilan . P3": 27,
				"gaz coll avec cond . bilan . P4": 71,
				"gaz coll avec cond . bilan . P4 moins aides": 71,
				"gaz coll avec cond . bilan . aides": 0,
				"gaz coll avec cond . bilan . total sans aides": 1304,
				"gaz coll avec cond . bilan . total avec aides": 1304,
				"gaz coll avec cond . environnement . besoins de chauffage et ECS si même équipement": 2495,
				"gaz coll avec cond . environnement . auxiliaires et combustible électrique": 2,
				"gaz coll avec cond . environnement . ECS solaire thermique": 0,
				"gaz coll avec cond . environnement . ECS avec ballon électrique": 0,
				"gaz coll avec cond . environnement . scope 2": 2,
				"gaz coll avec cond . environnement . scope 3": 9,
				"gaz coll avec cond . environnement . total": 2506,
			},
		},
		{
			description: "gaz coll avec cond : avec climatisation",
			situation: {
				"climatisation . incluse": "oui",
				"ecs . production": "oui",
				"ecs . type de production": "'Avec équipement chauffage'",
			},
			expected: {
				"gaz coll avec cond . bilan . P1abo": 73,
				"gaz coll avec cond . bilan . P1conso": 1056,
				"gaz coll avec cond . bilan . P1prime": 7,
				"gaz coll avec cond . bilan . P1ECS": 0,
				"gaz coll avec cond . bilan . P1Consofroid": 14,
				"gaz coll avec cond . bilan . P2": 78,
				"gaz coll avec cond . bilan . P3": 30,
				"gaz coll avec cond . bilan . P4": 239,
				"gaz coll avec cond . bilan . P4 moins aides": 239,
				"gaz coll avec cond . bilan . aides": 0,
				"gaz coll avec cond . bilan . total sans aides": 1497,
				"gaz coll avec cond . bilan . total avec aides": 1497,
				"gaz coll avec cond . environnement . besoins de chauffage et ECS si même équipement": 2495,
				"gaz coll avec cond . environnement . auxiliaires et combustible électrique": 2,
				"gaz coll avec cond . environnement . ECS solaire thermique": 0,
				"gaz coll avec cond . environnement . ECS avec ballon électrique": 0,
				"gaz coll avec cond . environnement . scope 2": 2,
				"gaz coll avec cond . environnement . scope 3": 9,
				"gaz coll avec cond . environnement . total": 2506,
			},
		},
		{
			description: "gaz coll avec cond : ECS par chauffe-eau électrique",
			situation: {
				"climatisation . incluse": "non",
				"ecs . production": "oui",
				"ecs . type de production": "'Chauffe-eau électrique'",
			},
			expected: {
				"gaz coll avec cond . bilan . P1abo": 55,
				"gaz coll avec cond . bilan . P1conso": 808,
				"gaz coll avec cond . bilan . P1prime": 3,
				"gaz coll avec cond . bilan . P1ECS": 491,
				"gaz coll avec cond . bilan . P1Consofroid": 0,
				"gaz coll avec cond . bilan . P2": 70,
				"gaz coll avec cond . bilan . P3": 16,
				"gaz coll avec cond . bilan . P4": 105,
				"gaz coll avec cond . bilan . P4 moins aides": 105,
				"gaz coll avec cond . bilan . aides": 0,
				"gaz coll avec cond . bilan . total sans aides": 1548,
				"gaz coll avec cond . bilan . total avec aides": 1548,
				"gaz coll avec cond . environnement . besoins de chauffage et ECS si même équipement": 1909,
				"gaz coll avec cond . environnement . auxiliaires et combustible électrique": 1,
				"gaz coll avec cond . environnement . ECS solaire thermique": 0,
				"gaz coll avec cond . environnement . ECS avec ballon électrique": 165,
				"gaz coll avec cond . environnement . scope 2": 166,
				"gaz coll avec cond . environnement . scope 3": 5,
				"gaz coll avec cond . environnement . total": 2081,
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
		| "gaz coll avec cond . bilan . P1abo"
		| "gaz coll avec cond . bilan . P1conso"
		| "gaz coll avec cond . bilan . P1prime"
		| "gaz coll avec cond . bilan . P1ECS"
		| "gaz coll avec cond . bilan . P1Consofroid"
		| "gaz coll avec cond . bilan . P2"
		| "gaz coll avec cond . bilan . P3"
		| "gaz coll avec cond . bilan . P4"
		| "gaz coll avec cond . bilan . P4 moins aides"
		| "gaz coll avec cond . bilan . aides"
		| "gaz coll avec cond . bilan . total sans aides"
		| "gaz coll avec cond . bilan . total avec aides"
		// émissions de CO2
		| "gaz coll avec cond . environnement . besoins de chauffage et ECS si même équipement"
		| "gaz coll avec cond . environnement . auxiliaires et combustible électrique"
		| "gaz coll avec cond . environnement . ECS solaire thermique"
		| "gaz coll avec cond . environnement . ECS avec ballon électrique"
		| "gaz coll avec cond . environnement . scope 2"
		| "gaz coll avec cond . environnement . scope 3"
		| "gaz coll avec cond . environnement . total"
	>;
};
