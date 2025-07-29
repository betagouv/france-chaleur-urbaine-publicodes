# france-chaleur-urbaine-publicodes



## Installation

```sh
pnpm install france-chaleur-urbaine-publicodes publicodes
```

## Usage

```typescript
import { Engine } from 'publicodes'
import rules from 'france-chaleur-urbaine-publicodes'

const engine = new Engine(rules)

console.log(engine.evaluate('salaire net').nodeValue)
// 1957.5

engine.setSituation({ 'salaire brut': 4000 })
console.log(engine.evaluate('salaire net').nodeValue)
// 3120
```

## Development

```sh
// Install the dependencies
pnpm install

// Compile the Publicodes rules
pnpm run compile

// Run the tests
pnpm run test

// Run the documentation server
pnpm run doc
```
