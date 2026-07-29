import { bench, group, run } from "mitata";
import Engine from "publicodes";
import rules from "../publicodes-build/france-chaleur-urbaine-publicodes.model.json" with {
	type: "json",
};

const options = {
	logger: { warn: () => {}, error: () => {}, log: () => {} },
};
const engine = new Engine(rules, options);

group("Parsing initial des règles", () => {
	bench("all rules", () => {
		new Engine(rules, options);
	});
});

group("Evaluation", () => {
	bench("Bilan total avec aides", () => {
		engine.setSituation({
			// 20 Avenue de Ségur 75007 Paris
			"climatisation . incluse": "non",
			"ecs . production": "oui",
			"ecs . type de production": "'Avec équipement chauffage'",
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
		});
		engine.evaluate("gaz coll avec cond . bilan . total avec aides");
	});
});

await run();
