<div align="center">
  <h3 align="center">
	<big>Publicodes x France Chaleur Urbaine</big>
  </h3>
  <p align="center">
   <a href="https://github.com/betagouv/france-chaleur-urbaine-publicodes/issues">Report Bug</a>
   •
   <a href="https://betagouv.github.io/france-chaleur-urbaine-publicodes/">API docs</a>
   •
   <a href="https://github.com/betagouv/france-chaleur-urbaine-publicodes/blob/master/CONTRIBUTING.md">Contribute</a>
   •
   <a href="https://publi.codes">Publicodes</a>
  </p>

Modèle [Publicodes](https://publi.codes/) du comparateur réalisé en partenariat avec l'association [AMORCE](https://amorce.asso.fr/) dans le cadre de l'[action C3 programme européen Heat & Cool](https://www.cerema.fr/fr/actualites/quels-leviers-collectivites-locales-developper-reseaux)

</div>

## Usage

Ajouter le paquet à vos dépendances :

```
yarn add @totak/france-chaleur-urbaine-publicodes
```

Instancier un nouveau moteur Publicode :

```typescript
import Engine from "publicodes"
import rules from "@totak/france-chaleur-urbaine-publicodes"

const engine = new Engine(rules)

engine.evaluate("dépenses primeur")
```

Utiliser certaines règles dans un autre modèle publicodes :

```yaml
importer!:
  depuis:
    nom: @totak/france-chaleur-urbaine-publicodes
    url: https://github.com/betagouv/france-chaleur-urbaine-publicodes
  les règles:
    - prix . carottes
    - prix . carottes
    - prix . avocats
```

### En local

#### Compiler le modèle

> Les règles publicodes du modèle sont disponible dans le workspace
> [`rules/`](https://github.com/betagouv/france-chaleur-urbaine-publicodes/tree/main/rules).

Pour installer les dépendances et compiler tous les fichiers `.publicodes` en
un seul fichier JSON, il suffit d'exécuter la commande suivante :

```
yarn

yarn build
```

#### Lancer la documentation

> Le code de la documentation est disponible dans le workspace
> [`doc/`](https://github.com/betagouv/france-chaleur-urbaine-publicodes/tree/main/doc).

Pour lancer l'app React en local permettant de parcourir la documentation du
modèle, il suffit d'exécuter la commande suivante :

```
yarn install --cwd doc

yarn doc
```

#### Lancer l'API

> Le code de l'API est disponible dans le workspace
> [`api/`](https://github.com/betagouv/france-chaleur-urbaine-publicodes/tree/main/api).

Pour lancer le serveur Node permettant d'utiliser l'API REST, il faut utiliser les commandes
suivantes :

```
yarn install --cwd api

yarn api
```

## Publier une nouvelle version

Afin de publier une nouvelle version il suffit d'exécuter la commande `npm
version`.
