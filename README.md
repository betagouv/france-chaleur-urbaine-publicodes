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

Modèle [Publicodes](https://publi.codes/) du comparateur réalisé en partenariat avec l'association [AMORCE](https://amorce.asso.fr/) dans le cadre de l'[action C3 du programme européen Heat & Cool](https://www.cerema.fr/fr/actualites/quels-leviers-collectivites-locales-developper-reseaux)

</div>


### Usage

```sh
# installe les dépendances
yarn install

# compile le modèle publicodes en un fichier JSON et lance la documentation (mode watch)
yarn dev
```


### Publier une nouvelle version

Afin de publier une nouvelle version il suffit d'exécuter la commande `npm version`, pour créer un commit avec la nouvelle version dans le package.json et faire un tag git.
```sh
# prochaine version v0.X.0
npm version minor
```

Il ne reste alors plus qu'à pousser le commit et le tag pour créer une release sur le [registre NPM](https://www.npmjs.com/package/@betagouv/france-chaleur-urbaine-publicodes).
```sh
git push && git push --tags
```


### Détail des commandes

#### Compiler le modèle

> Les règles publicodes du modèle sont disponible dans le workspace
> [`rules/`](https://github.com/betagouv/france-chaleur-urbaine-publicodes/tree/main/rules).

Pour installer les dépendances et compiler tous les fichiers `.publicodes` en
un seul fichier JSON, il suffit d'exécuter la commande suivante :

```sh
yarn

yarn build
```

#### Lancer la documentation

> Le code de la documentation est disponible dans le workspace
> [`doc/`](https://github.com/betagouv/france-chaleur-urbaine-publicodes/tree/main/doc).

Pour lancer l'app React en local permettant de parcourir la documentation du
modèle, il suffit d'exécuter la commande suivante :

```sh
yarn install --cwd doc

yarn doc
```

#### Lancer l'API (non utilisé)

> Le code de l'API est disponible dans le workspace
> [`api/`](https://github.com/betagouv/france-chaleur-urbaine-publicodes/tree/main/api).

Pour lancer le serveur Node permettant d'utiliser l'API REST, il faut utiliser les commandes
suivantes :

```sh
yarn install --cwd api

yarn api
```
