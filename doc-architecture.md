# Architecture du modèle publicodes

> Ce document décrit l'organisation des règles après la refonte de juillet 2026
> (branche `refacto_regles_v2`). Historique et justifications détaillées :
> [doc-refacto-modes.md](doc-refacto-modes.md) (analyse initiale) et
> [doc-refacto-recap.md](doc-refacto-recap.md) (récap avant/après).

## Arborescence

```
src/
├── modes/                  # 1 fichier par énergie, 1 namespace par mode de chauffage
│   ├── gaz.publicodes            (4 variantes : indiv/coll × avec/sans condensation)
│   ├── fioul.publicodes          (indiv, coll)
│   ├── granules.publicodes       (poêle à granulés, chaudière à granulés)
│   ├── pac-air-air.publicodes    (indiv, coll)
│   ├── pac-air-eau.publicodes    (indiv, coll)
│   ├── pac-eau-eau.publicodes    (indiv, coll — géothermie)
│   ├── radiateur-electrique.publicodes
│   ├── reseau-de-chaleur.publicodes
│   ├── reseau-de-froid.publicodes
│   └── add-ons-solaire.publicodes    # pseudo-modes partiels (solaire, hybride…)
├── commun/                 # calculs et valeurs transverses
│   ├── besoins.publicodes                # besoins du bâtiment + dimensionnement
│   ├── combustibles.publicodes           # prix/paramètres/taxes par énergie
│   ├── tarif-gaz-tertiaire.publicodes    # estimation de l'abonnement gaz tertiaire
│   ├── ecs.publicodes                    # « ecs additionnelle » (ballon, chauffe-eau)
│   ├── froid.publicodes                  # groupe froid + surcoûts réseau de froid
│   ├── pac.publicodes                    # socle PAC (SCOP mini, conso auxiliaires…)
│   ├── aides.publicodes                  # barèmes CEE + éligibilité + valeur CEE
│   ├── investissement.publicodes         # TVA, pose ; taux d'actualisation
│   ├── facteurs-emission.publicodes      # facteurs CO2 par combustible
│   ├── consommations-specifiques-chauffage.publicodes      # table CHAF
│   ├── consommations-specifiques-climatisation.publicodes  # table RAF
│   └── coefficients-intermittence.publicodes               # table CI
├── parametres-techniques.publicodes   # entrées utilisateur (bâtiment, méthode, DPE…)
├── parametres-economiques.publicodes  # reliquat : TVA d'entretien (clés historiques)
├── bareme-revenu-mpr.publicodes       # ménage . revenu (plafonds MaPrimeRénov')
├── departements.publicodes            # données par département (généré, remplace)
├── liste-rfu-rcu.publicodes           # caractéristiques réseau de chaleur/froid
├── namespaces.publicodes              # racines vides des namespaces historiques
└── compat.publicodes                  # couche de compatibilité (voir plus bas)
```

## Structure d'un mode de chauffage

Chaque mode est un namespace unique avec des sections fixes :

```yaml
gaz coll avec cond:
  description: Chaudière gaz collective à condensation
  avec:
    ratios:            # paramétrage du mode : LES VALEURS DE RÉFÉRENCE
      avec:            #   rendements, conso, durée de vie, coûts d'équipement,
        …              #   entretien P2/P3, CO2 installation…
    annuité:           # annuité PMT pour 1 € investi sur ratios . durée de vie
    installation:      # dimensionnement (puissances) et consommations
    coûts:             # postes de coût : investissements, P1, P2, P3
    aides:             # ma prime rénov, coup de pouce, CEE, total
    environnement:     # émissions scope 1/2/3
    bilan:             # sorties annuelles par logement : P1abo, P1conso,
                       #   P1prime, P1ECS, P1Consofroid, P2, P3, P4,
                       #   P4 moins aides, aides, totaux
```

Le **bilan** est la couche de sortie lue par le front (suffixes historiques
P1abo, P1conso…) : P1/P2/P3 y sont des agrégations de `coûts` (+ surcoûts
froid), P4 = investissements × annuité.

## Conventions

### Références relatives

Dans un mode, les références montent les namespaces : `coûts . P1 abonnement`
écrit dans `bilan` résout vers `<mode> . coûts . P1 abonnement` ;
`ratios . durée de vie` vers les ratios du mode. C'est ce qui permet de
partager des corps de règles entre variantes.

### Anchors YAML : `&nom` / `*nom`

Corps identiques entre variantes d'un même fichier : la **première variante
définit** (`P1ECS: &bilan-p1ecs …`), les suivantes **réutilisent**
(`P1ECS: *bilan-p1ecs`). Tout ce qui est écrit en clair dans une variante est
donc **spécifique** ; tout ce qui est `*alias` est garanti identique.
Les anchors ne traversent pas les fichiers (d'où un jeu d'anchors par fichier,
suffixé par l'énergie) et doivent être définis avant usage (d'où l'ordre
variante par variante). Le corps partagé se re-résout par variante grâce aux
références relatives : un seul texte de formule, des valeurs par variante.

### Valeurs partagées

Une caractéristique d'équipement vit dans le mode qui possède l'équipement ;
les consommateurs transverses la référencent (ex. `froid` référence
`PAC air-eau coll . ratios . puissance unitaire réversible`). Ce qui n'est la
caractéristique d'aucun mode vit dans `commun/`.

### Tables de correspondance

Les matrices (consommations spécifiques par DPE/normes/type tertiaire,
coefficients d'intermittence, barèmes d'aides par tranche de revenu) sont des
`variations:` **dans la règle cible**, avec les unités portées par branche.
Le mécanisme `remplace` n'est plus utilisé que par `departements.publicodes`
(données générées).

## Couche de compatibilité (`compat.publicodes`)

Le front lit encore les clés historiques (`Bilan x Gaz coll avec cond . P4`,
`ratios . GAZ IND COND Rendement chaudière chauffage`…). `compat.publicodes`
les expose comme références vers les nouvelles clés, une entrée par ligne :
`ancienne clé: nouvelle clé`. **C'est aussi la table de migration de l'UI** :
chaque entrée dit quoi renommer côté front.

Régime des clés que le front **écrit** (deux cas, à connaître absolument) :

1. **Ratios de la page paramètres** (rendements, SCOP, durées, P2/P3…) : la
   valeur de référence vit dans le mode ; écrire l'ancienne clé est **inerte**
   (choix assumé, testé dans index.spec.ts). La page paramètres devra écrire
   les nouvelles clés lors de l'intégration.
2. **Clés de l'UX principale** (éligibilité aides
   `Paramètres économiques . Aides . …`, efficacité BAR-TH-171, TVA
   d'entretien) : la clé **historique reste canonique** (writable), les
   nouveaux noms la référencent. À inverser seulement à la migration du front.

À la migration du front (version majeure) : basculer les écritures, supprimer
compat.publicodes, les racines de `namespaces.publicodes` et les tests
external-keys correspondants.

## Tests et garanties

- **`test/golden.spec.ts`** — golden master : valeurs finales **et unités**
  des 16 modes + add-ons sur 11 situations couvrant les embranchements
  majeurs (DPE/âge, IdF/hors IdF, maison/appartement, HP-HC, réseau de
  froid/groupe froid, tertiaire par secteur et norme, aides par tranche).
  Toute modification doit le laisser strictement inchangé ; ne mettre à jour
  les snapshots (`vitest run -u`) que pour un changement métier volontaire,
  documenté dans le commit.
- **`test/external-keys.spec.ts`** — existence de toutes les clés utilisées
  par le front (liste maintenue à la main, à compléter quand le front
  consomme de nouvelles clés).
- **`test/index.spec.ts`** — sémantique d'écriture des ratios (nouvelles clés
  propagées, anciennes lisibles, anciennes écritures inertes) + barèmes.
- Déplacements/réorganisations purs : vérifiables par **hash canonique du
  modèle compilé** (JSON à clés triées) — un déplacement de règle entre
  fichiers ou une imbrication ne doit rien changer.

## Modifier le modèle : recettes

- **Changer une valeur de ratio** : dans la section `ratios` du mode concerné
  (garder unité + `note:` de source). Golden à mettre à jour si la valeur est
  couverte (changement volontaire → documenter).
- **Ajouter une variante d'énergie** : dupliquer une variante du fichier,
  remplacer les corps partagés par des `*alias`, écrire en clair uniquement
  les différences, ajouter une situation golden si elle emprunte de nouveaux
  embranchements.
- **Renommer une règle lue par le front** : renommer partout + ajouter
  l'entrée `ancienne: valeur: nouvelle` dans compat ; external-keys doit
  rester vert sans modification.
- **Bugs connus figés** : liste en §1.6 de doc-refacto-modes.md (ex.
  `gaz coll sans cond` référence `gaz coll avec cond . annuité`,
  commenté dans le code). Les corriger = PR dédiée avec mise à jour golden
  expliquée.
