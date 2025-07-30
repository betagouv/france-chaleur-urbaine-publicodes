
import { bench, group, run } from 'mitata'
import Engine from "publicodes";
import rules from '../publicodes-build/france-chaleur-urbaine-publicodes.model.json' with { type: 'json' }

const options = {
	logger: { warn: () => {}, error: () => {}, log: () => {} },
}
const engine = new Engine(rules, options)

group('Parsing initial des règles', () => {
	bench('all rules', () => {
		new Engine(rules, options)
	})
})

group('Evaluation', () => {
	bench('Bilan total avec aides', () => {
		engine.setSituation({
			// 20 Avenue de Ségur 75007 Paris
			"Inclure la climatisation": "'non'",
			"Production eau chaude sanitaire": "'oui'",
			"type de production ECS": "'Avec équipement chauffage'",
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
			"température de référence chaud commune": -5
		})
		engine.evaluate('Bilan x Gaz coll avec cond . total avec aides')
	})
})

await run()
