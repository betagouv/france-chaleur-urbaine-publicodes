import Engine, { serializeUnit, type Situation } from "publicodes";
import { describe, expect, it } from "vitest";
import rules from "../publicodes-build/france-chaleur-urbaine-publicodes.model.json" with {
	type: "json",
};
import type { RuleName } from "../publicodes-build";

/**
 * Golden master de la refactorisation des modes de chauffage.
 *
 * Fige, pour chaque mode de chauffage et plusieurs situations représentatives,
 * les valeurs FINALES consommées par le front :
 * - Bilan économique : P1abo, P1conso, P1prime, P1ECS, P1Consofroid, P2, P3,
 *   P4, P4 moins aides, aides, total sans aides, total avec aides
 *   (+ total sans installation quand il existe) ;
 * - Bilan environnemental : Scope 2, Scope 3, Total (kgCO2e/an).
 *
 * Toute étape du refactor doit laisser ces snapshots STRICTEMENT inchangés
 * (`pnpm test`). Ne mettre à jour les snapshots (`vitest run -u`) que pour un
 * changement de comportement volontaire et documenté.
 *
 * NOTE : les bugs connus listés dans DOCUMENTATION.md (« Bugs connus figés ») sont
 * volontairement figés ici tels quels — ils seront corrigés après la
 * réorganisation, avec mise à jour explicite des snapshots.
 */

const options = {
	logger: { warn: () => {}, error: () => {}, log: () => {} },
};

// 20 Avenue de Ségur 75007 Paris (mêmes données que index.spec.ts)
const commonSituation = {
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
} satisfies Situation<RuleName>;

const situations: Record<string, Situation<RuleName>> = {
	"résidentiel - ECS avec équipement chauffage - sans clim": {
		...commonSituation,
		"climatisation . incluse": "non",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
	},
	"résidentiel - ECS avec équipement chauffage - avec clim": {
		...commonSituation,
		"climatisation . incluse": "oui",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
	},
	"résidentiel - chauffe-eau électrique": {
		...commonSituation,
		"climatisation . incluse": "non",
		"ecs . production": "oui",
		"ecs . type de production": "'Chauffe-eau électrique'",
	},
	"résidentiel - ECS solaire thermique": {
		...commonSituation,
		"climatisation . incluse": "non",
		"ecs . production": "oui",
		"ecs . type de production": "'Solaire thermique'",
	},
	"résidentiel - avec aides très modeste": {
		...commonSituation,
		"climatisation . incluse": "non",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
		"aides . éligibilité . prise en compte des aides":
			"oui",
		"aides . éligibilité . particulier":
			"oui",
		"aides . éligibilité . ressources du ménage":
			"'Très modeste'",
		"aides . éligibilité . chaudière gaz ou fioul actuelle":
			"oui",
	},
	"tertiaire - ECS avec équipement chauffage - avec clim": {
		...commonSituation,
		"bâtiment . type": "'tertiaire'",
		"climatisation . incluse": "oui",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
	},
	// --- situations représentatives des embranchements majeurs ---
	"maison DPE F hors IdF - HP/HC - avec aides modeste": {
		...commonSituation,
		"climat . code département": "'69'",
		"bâtiment . appartement ou maison": "'Maison'",
		"bâtiment . DPE": "'F'",
		"combustibles . électricité . option tarifaire": "'Heure pleine/Heure creuse'",
		"bâtiment . surface tertiaire": 80,
		"climatisation . incluse": "non",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
		"aides . éligibilité . prise en compte des aides":
			"oui",
		"aides . éligibilité . particulier":
			"oui",
		"aides . éligibilité . ressources du ménage":
			"'Modeste'",
		"aides . éligibilité . chaudière gaz ou fioul actuelle":
			"oui",
	},
	"immeuble avant 1974 - Marseille - 60 logements - réseau de froid": {
		...commonSituation,
		"climat . code département": "'13'",
		"bâtiment . méthode résidentiel": "'Normes thermiques et âge du bâtiment'",
		"bâtiment . normes thermiques et âge": "'avant 1974'",
		"bâtiment . nombre de logements": 60,
		"climatisation . incluse": "oui",
		"climatisation . type de production": "'Réseau de froid'",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
	},
	"petit collectif RE2020 - sans ECS ni clim": {
		...commonSituation,
		"bâtiment . méthode résidentiel": "'Normes thermiques et âge du bâtiment'",
		"bâtiment . normes thermiques et âge": "'RE2020 - Après 2020'",
		"bâtiment . nombre de logements": 10,
		"climatisation . incluse": "non",
		"ecs . production": "non",
	},
	"tertiaire commerces RT2012 - 2000 m2 - groupe froid": {
		...commonSituation,
		"bâtiment . type": "'tertiaire'",
		"bâtiment . méthode tertiaire": "'Commerces'",
		"bâtiment . normes thermiques tertiaire": "'RT2012'",
		"bâtiment . ratios . surface de référence tertiaire": 2000,
		"climatisation . incluse": "oui",
		"climatisation . type de production": "'Groupe froid'",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
	},
	"parc social moyen - besoins de chauffage imposés": {
		...commonSituation,
		"besoins . chauffage par logement": 7320,
		"climatisation . incluse": "non",
		"ecs . production": "oui",
		"ecs . type de production": "'Avec équipement chauffage'",
	},
};

const modes = [
	"réseau de chaleur",
	"chaudière à granulés",
	"gaz coll avec cond",
	"gaz coll sans cond",
	"fioul coll",
	"PAC air-air coll",
	"PAC air-eau coll",
	"PAC eau-eau coll",
	"poêle à granulés",
	"gaz indiv avec cond",
	"gaz indiv sans cond",
	"fioul indiv",
	"PAC air-air indiv",
	"PAC air-eau indiv",
	"PAC eau-eau indiv",
	"radiateur électrique",
] as const;

const bilanSuffixes = [
	"P1abo",
	"P1conso",
	"P1prime",
	"P1ECS",
	"P1Consofroid",
	"P2",
	"P3",
	"P4",
	"P4 moins aides",
	"aides",
	"total sans aides",
	"total avec aides",
	// absent de certains modes : ignoré silencieusement quand la règle n'existe pas
	"total sans installation",
] as const;

const envSuffixes = ["scope 2", "scope 3", "total"] as const;

// Pseudo-modes partiels lus par le module chaleur-renouvelable du front
const addOnKeys = [
	"PAC air-eau coll hybride . bilan . total sans aides",
	"PAC air-eau coll hybride . bilan . total sans installation",
	"solaire thermique . bilan . total sans installation",
	"PAC capteurs solaires atmosphériques . bilan . total sans installation",
	"PAC air-eau collective ECS . bilan . total sans installation",
	"chauffe-eau thermodynamique . bilan . total sans installation",
	"système solaire combiné . bilan . total sans installation",
] satisfies RuleName[];

// Arrondi à 2 décimales pour neutraliser le bruit flottant sans masquer les écarts réels.
// L'unité est snapshotée avec la valeur : un changement d'unité est une régression
// au même titre qu'un changement de valeur.
const format = (node: { nodeValue: unknown; unit?: Parameters<typeof serializeUnit>[0] }) => {
	const value =
		typeof node.nodeValue === "number"
			? Math.round(node.nodeValue * 100) / 100
			: node.nodeValue;
	const unit = node.unit ? serializeUnit(node.unit) : undefined;
	return unit ? `${value} ${unit}` : value;
};

const evaluateKeys = (engine: Engine, keys: string[]) =>
	Object.fromEntries(
		keys
			.filter((key) => key in rules)
			.map((key) => [key, format(engine.evaluate(key as RuleName))]),
	);

describe("Golden master — valeurs finales par mode de chauffage", () => {
	Object.entries(situations).forEach(([situationName, situation]) => {
		describe(situationName, () => {
			const engine = new Engine(rules, options);
			engine.setSituation(situation);

			modes.forEach((mode) => {
				it(mode, () => {
					const keys = [
						...bilanSuffixes.map((suffix) => `${mode} . bilan . ${suffix}`),
						...envSuffixes.map((suffix) => `${mode} . environnement . ${suffix}`),
					];
					expect(evaluateKeys(engine, keys)).toMatchSnapshot();
				});
			});

			it("add-ons (solaire, hybride, thermodynamique)", () => {
				expect(evaluateKeys(engine, addOnKeys)).toMatchSnapshot();
			});
		});
	});
});
