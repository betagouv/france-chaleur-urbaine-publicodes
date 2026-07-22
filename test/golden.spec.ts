import Engine, { type Situation } from "publicodes";
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
 * NOTE : les bugs connus listés dans doc-refacto-modes.md (§1.6) sont
 * volontairement figés ici tels quels — ils seront corrigés après la
 * réorganisation, avec mise à jour explicite des snapshots.
 */

const options = {
	logger: { warn: () => {}, error: () => {}, log: () => {} },
};

// 20 Avenue de Ségur 75007 Paris (mêmes données que index.spec.ts)
const commonSituation = {
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
} satisfies Situation<RuleName>;

const situations: Record<string, Situation<RuleName>> = {
	"résidentiel - ECS avec équipement chauffage - sans clim": {
		...commonSituation,
		"Inclure la climatisation": "non",
		"Production eau chaude sanitaire": "oui",
		"type de production ECS": "'Avec équipement chauffage'",
	},
	"résidentiel - ECS avec équipement chauffage - avec clim": {
		...commonSituation,
		"Inclure la climatisation": "oui",
		"Production eau chaude sanitaire": "oui",
		"type de production ECS": "'Avec équipement chauffage'",
	},
	"résidentiel - chauffe-eau électrique": {
		...commonSituation,
		"Inclure la climatisation": "non",
		"Production eau chaude sanitaire": "oui",
		"type de production ECS": "'Chauffe-eau électrique'",
	},
	"résidentiel - ECS solaire thermique": {
		...commonSituation,
		"Inclure la climatisation": "non",
		"Production eau chaude sanitaire": "oui",
		"type de production ECS": "'Solaire thermique'",
	},
	"résidentiel - avec aides très modeste": {
		...commonSituation,
		"Inclure la climatisation": "non",
		"Production eau chaude sanitaire": "oui",
		"type de production ECS": "'Avec équipement chauffage'",
		"Paramètres économiques . Aides . Éligibilité x Prise en compte des aides":
			"oui",
		"Paramètres économiques . Aides . Éligibilité x Je suis un particulier":
			"oui",
		"Paramètres économiques . Aides . Éligibilité x Ressources du ménage":
			"'Très modeste'",
		"Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul":
			"oui",
	},
	"tertiaire - ECS avec équipement chauffage - avec clim": {
		...commonSituation,
		"type de bâtiment": "'tertiaire'",
		"Inclure la climatisation": "oui",
		"Production eau chaude sanitaire": "oui",
		"type de production ECS": "'Avec équipement chauffage'",
	},
};

// [nom Bilan / Calcul Eco, nom env . Installation x …]
const modes = [
	["Réseaux de chaleur", "Réseaux de chaleur x Collectif"],
	["Chaudière à granulés coll", "Chaudière à granulés coll x Collectif"],
	["Gaz coll avec cond", "Gaz coll avec cond x Collectif"],
	["Gaz coll sans cond", "Gaz coll sans cond x Collectif"],
	["Fioul coll", "Fioul coll x Collectif"],
	["PAC air-air coll", "PAC air-air x Collectif"],
	["PAC air-eau coll", "PAC air-eau x Collectif"],
	["PAC eau-eau coll", "PAC eau-eau x Collectif"],
	["Poêle à granulés indiv", "Poêle à granulés indiv x Individuel"],
	["Gaz indiv avec cond", "Gaz indiv avec cond x Individuel"],
	["Gaz indiv sans cond", "Gaz indiv sans cond x Individuel"],
	["Fioul indiv", "Fioul indiv x Individuel"],
	["PAC air-air indiv", "PAC air-air x Individuel"],
	["PAC air-eau indiv", "PAC air-eau x Individuel"],
	["PAC eau-eau indiv", "PAC eau-eau x Individuel"],
	["Radiateur électrique", "Radiateur électrique x Individuel"],
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

const envSuffixes = ["Scope 2", "Scope 3", "Total"] as const;

// Pseudo-modes partiels lus par le module chaleur-renouvelable du front
const addOnKeys = [
	"Bilan x PAC air-eau coll hybride . total sans aides",
	"Bilan x PAC air-eau coll hybride . total sans installation",
	"Bilan x Solaire thermique . total sans installation",
	"Bilan x PAC capteurs solaires atmosphériques . total sans installation",
	"Bilan x PAC air-eau collective ECS . total sans installation",
	"Bilan x Chauffe-eau thermodynamique . total sans installation",
	"Bilan x Système solaire combiné . total sans installation",
] satisfies RuleName[];

// Arrondi à 2 décimales pour neutraliser le bruit flottant sans masquer les écarts réels
const round = (value: unknown) =>
	typeof value === "number" ? Math.round(value * 100) / 100 : value;

const evaluateKeys = (engine: Engine, keys: string[]) =>
	Object.fromEntries(
		keys
			.filter((key) => key in rules)
			.map((key) => [key, round(engine.evaluate(key as RuleName).nodeValue)]),
	);

describe("Golden master — valeurs finales par mode de chauffage", () => {
	Object.entries(situations).forEach(([situationName, situation]) => {
		describe(situationName, () => {
			const engine = new Engine(rules, options);
			engine.setSituation(situation);

			modes.forEach(([bilanMode, envMode]) => {
				it(bilanMode, () => {
					const keys = [
						...bilanSuffixes.map((s) => `Bilan x ${bilanMode} . ${s}`),
						...envSuffixes.map((s) => `env . Installation x ${envMode} . ${s}`),
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
