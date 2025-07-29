
import { bench, group, run } from 'mitata'
import Engine from "publicodes";
import rules from '../publicodes-build/test-publicodes-init.model.json' with { type: 'json' }

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
	bench('salaire net', () => {
		engine.setSituation({
			'salaire brut': 3000,
		})
		engine.evaluate('salaire net')
	})
})

group('setSituation', () => {
	bench('situation', () => {
		engine.setSituation({
			'salaire brut': '2600 €/mois',
    		'cotisations salariales . taux': '25%'
		})
	})
})

await run()
