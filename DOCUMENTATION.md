# Documentation du modèle publicodes

> Documentation interne du modèle. Elle décrit l'organisation actuelle des
> règles (issue de la refonte par modes de chauffage de juillet 2026, branche
> `refacto_regles_v2`, 43 commits à partir de `dev` v1.10.0), retrace ce qui a
> été fait et pourquoi, et liste les chantiers restants.

Sommaire :

1. [Architecture du modèle](#1-architecture-du-modèle) — arborescence,
   structure d'un mode, conventions, tests, recettes.
2. [La refonte par modes de chauffage](#2-la-refonte-par-modes-de-chauffage) —
   état des lieux initial, choix de découpage, avant/après, mécanismes.
3. [Bugs connus figés](#3-bugs-connus-figés) — à corriger dans une PR dédiée.
4. [Analyse critique et chantiers futurs](#4-analyse-critique-et-chantiers-futurs).

---

## 1. Architecture du modèle

### Arborescence

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
│   ├── besoins.publicodes                       # dimensionnement : puissances appelées
│   ├── combustibles.publicodes                  # prix/paramètres/taxes par énergie
│   ├── tarif-gaz-tertiaire.publicodes           # estimation de l'abonnement gaz tertiaire
│   ├── ecs-additionnelle.publicodes             # ballon électrique / chauffe-eau solaire
│   ├── climatisation-additionnelle.publicodes   # groupe froid + surcoûts réseau de froid
│   ├── pac.publicodes                           # socle PAC (SCOP mini, conso auxiliaires…)
│   ├── aides.publicodes                         # barèmes CEE + éligibilité + valeur CEE
│   ├── investissement.publicodes                # TVA, pose ; taux actualisation
│   ├── facteurs-emission.publicodes             # facteurs CO2 par combustible
│   ├── consommations-specifiques-chauffage.publicodes      # table CHAF
│   ├── consommations-specifiques-ecs.publicodes            # table ECS
│   ├── consommations-specifiques-climatisation.publicodes  # table RAF
│   └── coefficients-intermittence.publicodes               # table CI
├── parametres-techniques.publicodes   # entrées utilisateur : bâtiment, climat, besoins, ecs, climatisation
├── bareme-revenu-mpr.publicodes       # ménage . revenu (plafonds MaPrimeRénov')
├── departements.publicodes            # données par département (généré, remplace)
└── liste-rfu-rcu.publicodes           # réseau de chaleur/froid . caractéristiques
```

### Racines du modèle

40 racines pour ~2 200 règles, et **aucune règle feuille à la racine** hormis
une sentinelle technique (`non défini` — qui sert au
front à lire les valeurs par défaut). Quatre familles :

| Famille | Racines |
|---|---|
| Entrées utilisateur (écrites par le front) | `bâtiment`, `climat`, `besoins`, `ecs`, `climatisation` |
| Modes de chauffage et pseudo-modes | `gaz coll avec cond`, `réseau de chaleur`, … (22) |
| Socle transverse | `combustibles`, `aides`, `investissement`, `amortissement`, `pac`, `dimensionnement`, `ecs additionnelle`, `climatisation additionnelle`, `facteurs CO2` |
| Données | `départements`, `ménage` |

Chaque racine porte donc un sous-arbre cohérent. Les valeurs de référence
transverses vivent sous `<domaine> . ratios . <nom>` (`bâtiment . ratios .
surface de référence appartement`, `dimensionnement . ratios . facteur de
surpuissance`, `pac . ratios . SCOP mini`…), en miroir du `<mode> . ratios`
de chaque mode.

### Structure d'un mode de chauffage

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

### Conventions

#### Nommage des clés

Les nouvelles clés sont en **lowercase, sans apostrophe** — les acronymes
gardent leur casse (CEE, SCOP, TVA, PAC, P1…P4, CO2, DPE…) : `annuité`,
`facteurs CO2`, `ma prime rénov`, `coup de pouce`, `total`, `scope 1/2/3`,
`option heures creuses`, `prix du kWh`… Exceptions assumées : les clés que le
front **écrit** (parametres-techniques, clés ` x ` canoniques) et les suffixes
historiques du bilan (P1abo…).

#### Entrées utilisateur : namespaces canoniques

Les clés que le front **écrit** (entrées du simulateur) sont définies — et
écrites — directement sous leur namespace : `bâtiment .` (type, DPE, méthode,
normes, logements…), `climat .` (département, zone, DJU…), `besoins .` (par
logement, consommations spécifiques), `ecs .` / `climatisation .` (choix de
production), `réseau de chaleur/froid . caractéristiques .` (données du
réseau injectées via l'adresse). Il n'y a **plus d'alias historique à la
racine** : une seule forme par entrée, dans les deux sens (lecture et
écriture). Sémantique testée dans index.spec.ts.

Les valeurs par défaut de ces entrées viennent de `<domaine> . ratios . …`
(surfaces de référence, occupation, DJU de référence, foisonnements…), et les
données départementales sont injectées par `remplace` sur
`climat . nom département`, `climat . zone`, `climat . sous zone` et
`climat . département . degré jours chaud/froid` — cette dernière servant de
défaut à `climat . degré jours chaud/froid`, que le front peut surcharger.

#### Références relatives

Dans un mode, les références montent les namespaces : `coûts . P1 abonnement`
écrit dans `bilan` résout vers `<mode> . coûts . P1 abonnement` ;
`ratios . durée de vie` vers les ratios du mode. C'est ce qui permet de
partager des corps de règles entre variantes.

#### Anchors YAML : `&nom` / `*nom`

Corps identiques entre variantes d'un même fichier : la **première variante
définit** (`P1ECS: &bilan-p1ecs …`), les suivantes **réutilisent**
(`P1ECS: *bilan-p1ecs`). Tout ce qui est écrit en clair dans une variante est
donc **spécifique** ; tout ce qui est `*alias` est garanti identique.
Les anchors ne traversent pas les fichiers (d'où un jeu d'anchors par fichier,
suffixé par l'énergie) et doivent être définis avant usage (d'où l'ordre
variante par variante). Le corps partagé se re-résout par variante grâce aux
références relatives : un seul texte de formule, des valeurs par variante.

#### Valeurs partagées

Une caractéristique d'équipement vit dans le mode qui possède l'équipement ;
les consommateurs transverses la référencent (ex. `climatisation
additionnelle` référence
`PAC air-eau coll . ratios . puissance unitaire réversible`). Ce qui n'est la
caractéristique d'aucun mode vit dans `commun/`.

#### Tables de correspondance

Les matrices (consommations spécifiques par DPE/normes/type tertiaire,
coefficients d'intermittence, barèmes d'aides par tranche de revenu) sont des
`variations:` **dans la règle cible**, avec les unités portées par branche.
Le mécanisme `remplace` n'est plus utilisé que par `departements.publicodes`
(données générées).

#### Imbrication plutôt que clés pointées

Une règle se définit **imbriquée sous son parent** (`avec:`), jamais sous sa
forme aplatie `parent . enfant:`. Une définition contenant un ` . ` est un
signal d'alerte : elle recrée à plat une hiérarchie que le fichier pourrait
exprimer, et le niveau intermédiaire finit par se perdre.

Seule exception, structurelle : **publicodes ne permet pas d'imbriquer sous un
parent défini dans un autre fichier**. Un gros bloc autonome logé dans son
propre fichier doit donc s'y déclarer sous forme pointée. C'est le cas des 7
définitions pointées restantes, toutes racines de leur fichier :
`besoins . consommation spécifique chauffage/ECS/climatisation` (les 3 tables),
`dimensionnement . coefficient intermittence` (table CI),
`combustibles . gaz . estimation abonnement tertiaire`, et
`réseau de chaleur/froid . caractéristiques` (données injectées par le front).
Toute autre clé pointée est à imbriquer.

#### Mise en forme

En-têtes de section en commentaire `# --- Titre ---` ; pas de ligne vide entre
un `avec:` et son premier enfant ; une seule ligne vide entre règles.

### Couche de compatibilité (supprimée)

`compat.publicodes` exposait les clés historiques (`Bilan x Gaz coll avec cond . P4`, `ratios . GAZ IND COND Rendement chaudière chauffage`…) comme références vers les nouvelles, une entrée par ligne. **Le fichier a été supprimé** une fois le front migré : `<mode> . <section> . <champ>` est désormais la seule forme, et la disparition de compat est ce qui prouve qu'aucune référence historique ne subsiste (le typage `RuleName` casse la compilation du front sinon).

Les dernières racines historiques ont suivi : `namespaces.publicodes` et
`parametres-economiques.publicodes` ont été supprimés, et leurs règles
relogées — `ratios . GNRL …` → `bâtiment . ratios . …` / `climat . ratios . …`,
`ratios . PUIS …` → `dimensionnement . ratios . …`, `ratios . PAC GNRL …` →
`pac . ratios . …`, `Calcul Eco . P2 P3 Coût de l'entretien . Groupe …` →
`climatisation additionnelle . entretien groupe …`, `Paramètres économiques . Aides . …` →
`aides . éligibilité . …` / `aides . valeur CEE`, les deux TVA d'entretien →
`investissement . TVA petit entretien P2` / `… gros entretien P3`. Plus aucune
clé de l'ancienne nomenclature ne subsiste dans le modèle.

### Tests et garanties

- **`test/golden.spec.ts`** — golden master : valeurs finales **et unités**
  des 16 modes + add-ons sur 11 situations couvrant les embranchements
  majeurs (DPE/âge, IdF/hors IdF, maison/appartement, HP-HC, réseau de
  froid/groupe froid, tertiaire par secteur et norme, aides par tranche) —
  187 snapshots. Toute modification doit le laisser strictement inchangé ; ne
  mettre à jour les snapshots (`vitest run -u`) que pour un changement métier
  volontaire, documenté dans le commit.
- **`test/external-keys.spec.ts`** — existence de toutes les clés utilisées
  par le front (liste maintenue à la main, à compléter quand le front
  consomme de nouvelles clés).
- **`test/index.spec.ts`** — sémantique d'écriture des ratios (nouvelles clés
  propagées, anciennes lisibles, anciennes écritures inertes) + barèmes.
- Déplacements/réorganisations purs : vérifiables par **hash canonique du
  modèle compilé** (JSON à clés triées) — un déplacement de règle entre
  fichiers ou une imbrication ne doit rien changer.

### Modifier le modèle : recettes

- **Changer une valeur de ratio** : dans la section `ratios` du mode concerné
  (garder unité + `note:` de source). Golden à mettre à jour si la valeur est
  couverte (changement volontaire → documenter).
- **Ajouter une variante d'énergie** : dupliquer une variante du fichier,
  remplacer les corps partagés par des `*alias`, écrire en clair uniquement
  les différences, ajouter une situation golden si elle emprunte de nouveaux
  embranchements.
- **Renommer une règle lue par le front** : renommer partout + mettre à jour
  `external-keys.spec.ts` (il devient rouge, c'est le but) puis le front dans
  la même PR — il n'y a plus de couche d'alias pour amortir le changement.
- **Bugs connus figés** : liste en [§3](#3-bugs-connus-figés). Les corriger
  = PR dédiée avec mise à jour golden expliquée (sauf s'ils sont sans
  incidence numérique : golden inchangé = preuve, cf. les deux déjà
  corrigés).

---

## 2. La refonte par modes de chauffage

### État des lieux initial (`dev`, v1.10.0)

~13 000 lignes de publicodes organisées par *type de calcul* : chaque mode
était éclaté sur 5 fichiers (`calculs-techniques`, `calculs-economiques`,
`calculs-environnementaux`, `bilan-1an`, `ratios-*`) sous **4 conventions de
nommage** différentes (`Installation x PAC air-air x Individuel` /
`Calcul Eco . PAC air-air indiv` / `Bilan x PAC air-air indiv` /
`env . Installation x PAC air-air x Individuel`).

La duplication était massive et mécanique : ~80 % du volume des blocs
économiques était un socle de 12 sous-règles identiques recopié dans 15 modes
sur 17 ; 5 sous-règles techniques (tout le paquet ECS) copiées au caractère
près 16 fois ; le patron environnement copié 17 fois ; l'amortissement PMT
instancié ~70 fois par anchor YAML. L'analyse a montré que les **3 axes de
variation sont orthogonaux** — énergie (ratios + formule combustible),
avec/sans condensation (1 vs 2 rendements), indiv/coll (× nb logements +
échelle de puissance) — ce qui rendait un regroupement par énergie réaliste.

Autres constats fondateurs : aucun filet de sécurité numérique (les tests de
valeurs étaient en `describe.skip`), un test d'existence de clés incomplet
(complété depuis : modules chaleur-renouvelable, simulator et pac du front),
133 règles mortes, ~200 intermédiaires triviaux, et 5 bugs de copier-coller
(cf. [§3](#3-bugs-connus-figés)).

### Choix de découpage

Trois options comparées :

- **A — 1 fichier par mode×variante** (le POC `refacto_regles`) : localité
  parfaite mais la duplication reste entière — c'est précisément elle qui
  avait produit les bugs.
- **B — 1 fichier par énergie** : les axes les plus dupliqués (cond/sans
  cond, indiv/coll) deviennent factorisables *à l'intérieur* d'un fichier
  (anchors + références relatives).
- **C — base commune + `contexte:`** : zéro duplication mais verbeux, opaque
  au débogage, et **3,7× plus lent à l'évaluation** (testé, écarté).

Retenu : **B + extraction des communs** — les blocs les plus dupliqués (ECS
additionnelle, climatisation additionnelle, amortissement, combustibles) sont
en réalité
indépendants du mode et calculés une seule fois dans `commun/`.

### Ce qui a été fait

1. **Filet de sécurité d'abord** : golden master (valeurs + unités,
   aujourd'hui 187 snapshots sur 11 situations), complétion d'external-keys,
   hash canonique du modèle compilé pour prouver les déplacements purs.
2. **PMT → annuités** : la fonction Excel PMT dupliquée ~70 fois est devenue
   un enfant `annuité` par mode (annuité pour 1 € investi sur
   `ratios . durée de vie`, résolue en relatif). Un amortissement =
   `capital × annuité`. Légèrement plus rapide que `dev`.
3. **Extraction des communs** dans `src/commun/` (déplacements purs vérifiés
   au hash), puis **migration énergie par énergie** vers `src/modes/` avec la
   structure standard et des alias générés dans `compat.publicodes`.
4. **Élagage** : 99 règles mortes supprimées, vérifiées par analyse de
   reachabilité depuis l'ensemble des clés réellement consommées (front
   inclus) : classe énergétique PAC abandonnée, bloc PAC absorption, bloc
   Groupe froid tronqué, barèmes CEE jamais branchés, typo `Quanté d'ECS`…
5. **`remplace` → `variations`** : les ~205 règles à mécanisme `remplace`
   (matrices CHAF/RAF/CI/ECS, dérogation PAC, barèmes d'aides) sont des
   tables `variations:` directement dans leur règle cible.
6. **Sections `ratios` = valeurs de référence** : le paramétrage de chaque
   mode porte directement les valeurs (avec unité et source) ; les clés
   plates historiques ne sont plus que des références de lecture dans compat
   (le mécanisme `remplace`, qui aurait maintenu les écritures historiques, a
   été envisagé puis écarté).
7. **Factorisation intra-fichier** par anchors défini-à-la-première-occurrence
   (~178 anchors, ~1 400 lignes en moins, modèle compilé identique) et
   renommage des enfants de sections (1 252 occurrences, `entretien` fusionné
   dans `coûts`).
8. **Convention de nommage** (sans apostrophe, lowercase hors acronymes),
   nettoyage des séparateurs ` x `, des en-têtes et de la mise en forme,
   aplatissement de compat en une ligne par alias.
9. **Vue organisée des entrées utilisateur** : les ~45 clés écrites par le
   simulateur principal gardent leur nom historique canonique mais sont
   exposées sous `bâtiment`/`climat`/`besoins`/`ecs`/`climatisation` et
   `réseau de chaleur/froid . caractéristiques` ; ~1 040 références internes
   migrées sur ces nouveaux noms. L'audit des écritures réelles du front
   (233 clés) a aussi permis de rebrancher 9 clés cassées par l'élagage.

Volume : ~11 000 lignes de règles (hors départements) sur `dev` →
**~9 650 lignes** (hors départements et compat), sans changer un seul
résultat de calcul.

### Avant / après : le P4 de « gaz indiv avec cond »

**Avant** (`dev`) : le calcul traversait 4 fichiers, et dépendait d'un anchor
`&pmt` défini en tête de `bilan-1an.publicodes` — donc indéplaçable :

```yaml
# bilan-1an.publicodes (en tête de fichier)
x-pmt: &pmt
  - si: ratios économiques . Amortissement x Taux actualisation != 0
    alors: ratios économiques . Amortissement x Taux actualisation * capital * ((1 + ratios économiques . Amortissement x Taux actualisation) ** durée) / ((1 + ratios économiques . Amortissement x Taux actualisation) ** durée - 1)
  - sinon: capital / durée

# … 500 lignes plus loin, répété ~70 fois avec d'autres durées/capitaux :
Bilan x Gaz coll avec cond:
  avec:
    P4spec:
      variations: *pmt
      avec:
        durée: ratios . GAZ COLL COND Durée de vie
        capital: Calcul Eco . Gaz coll avec cond . Investissement équipement par logement type tertiaire
    aides spécifiques:
      variations: *pmt
      avec:
        durée: ratios . GAZ COLL COND Durée de vie
        capital: Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . Total
```

**Après** : tout le mode vit dans `modes/gaz.publicodes`. Les ratios portent
les valeurs, l'annuité est définie une fois par fichier (anchor), le bilan
n'est plus que des agrégations en références relatives :

```yaml
# modes/gaz.publicodes
gaz indiv avec cond:
  description: Chaudière gaz individuelle à condensation
  avec:
    ratios:
      description: Paramétrage du mode — valeurs de référence, écrites par la page paramètres du front
      avec:
        durée de vie:
          valeur: 17
          unité: an
        rendement chaudière chauffage:
          valeur: 85%
          unité: '%'
        petit entretien P2:
          par défaut: 143
          unité: €HT/an
        investissement équipement:
          produit:
            - variations:
                - si: gaz indiv avec cond . installation . puissance retenue <= 12
                  alors: 2660
                # …
            - 1 + investissement . TVA
          unité: €TTC
          note: 'Source: Atlantic 2023'
        # …
    annuité: &annuite-gaz
      description: Annuité pour 1 € investi sur la durée de vie de l'équipement (fonction Excel PMT)
      variations:
        - si: amortissement . taux actualisation != 0
          alors: amortissement . taux actualisation * ((1 + amortissement . taux actualisation) ** ratios . durée de vie) / ((1 + amortissement . taux actualisation) ** ratios . durée de vie - 1)
        - sinon: 1 / ratios . durée de vie
    # installation: … / coûts: … / aides: … / environnement: …
    bilan:
      avec:
        P1abo: coûts . P1 abonnement
        P1conso: coûts . P1 consommation
        P2: coûts . petit entretien P2 par logement tertiaire + climatisation additionnelle . surcoût P2
        P4 équipement:
          formule: coûts . investissement par logement * annuité
        P4: &bilan-p4
          somme:
            - P4 équipement
            - P4 ballon ECS
            - P4 chauffe-eau solaire
            - froid . P4 groupe froid
            - froid . P4 réseau de froid
        aides spécifiques:
          formule: aides . total * annuité
        # …
```

Et une variante ne montre plus que ses **vraies** différences — tout le reste
est un `*alias` vers le corps défini sur la première variante :

```yaml
gaz indiv sans cond:
  description: Chaudière gaz individuelle sans condensation
  avec:
    ratios:
      avec:
        rendement chaudière:      # sans cond : un seul rendement
          valeur: 75%
          unité: '%'
        # …
    annuité: *annuite-gaz
    installation:
      avec:
        puissance chauffage:
          formule: (dimensionnement . puissance chauffage appelée / ratios . rendement chaudière)
          unité: kW
        puissance équipement: *inst-puissance-equipement
        puissance retenue: *inst-puissance-retenue
        ECS additionnelle nécessaire: *inst-ecs-additionnelle-necessaire
        volume du ballon ECS: *inst-volume-du-ballon-ecs
        # …
```

Avant, ce même contenu occupait ~85 lignes intégralement recopiées — c'est ce
copier-coller qui avait produit les bugs du type « gaz coll sans cond amorti
sur la durée de vie de *avec cond* » (resté longtemps invisible car noyé ;
rendu visible en une ligne par la refonte, puis corrigé — cf.
[§3](#3-bugs-connus-figés)).

### Garanties de non-régression

- Golden master inchangé du premier au dernier commit (les 102 snapshots
  d'origine n'ont pas dérivé d'un centime lors de l'ajout des unités et des
  situations).
- `external-keys.spec.ts` (~1 170 clés) passe à l'identique via les alias.
- Chaque déplacement pur vérifié par hash SHA-256 du modèle compilé.
- `pnpm export-csv` régénère un CSV strictement identique à celui de `dev`.
- Performances : parsing ~+20 % le temps de la compat (alias), évaluation au
  niveau de `dev` (les annuités par mode sont mises en cache par situation).

---

## 3. Bugs connus figés

**Décision (22/07/2026)** : ces bugs sont notés mais laissés de côté — le
golden master fige le comportement actuel tel quel ; les corriger = une PR
dédiée avec mise à jour explicite des snapshots et revue métier. Références
de lignes : fichiers de `dev`.

### Corrigés sur la branche (sans incidence numérique — golden inchangé)

- ~~`gaz coll sans cond` : P4 et aides utilisaient la durée de vie de la
  variante **avec** condensation~~ (bilan-1an.publicodes:587-591, 623).
  Corrigé : le bilan référence l'`annuité` de la variante elle-même. Sans
  incidence : les deux variantes gaz coll ont la même durée de vie (22 an).
- ~~Le gros entretien P3 de **PAC air-eau coll** référençait le paramètre de
  **PAC air-air coll**~~ (calculs-economiques.publicodes:1716). Corrigé :
  `PAC air-eau coll . ratios . gros entretien P3` porte sa propre valeur ;
  `froid` (groupe froid/eau glacée) la référence, et l'ex-orphelin
  `Paramètres économiques . Gros entretien P3 . PAC air-eau coll` est un
  alias de compat. Sans incidence : même valeur et même unité (1.72/100
  €HT/€ d'investissement) des deux côtés.

### Restants

1. PAC air-eau/eau-eau **indiv** : besoins ECS ajoutés inconditionnellement
   dans `consommation combustible chaleur`, alors que les variantes coll (et
   tous les autres modes) conditionnent à
   `type de production ECS = 'Avec équipement chauffage'` —
   calculs-techniques.publicodes:1224, 1316 vs 1480, 1580.
2. `gamme de puissance existante` de gaz coll avec cond mélange `<=` et `<`
   là où sans cond et fioul coll utilisent uniformément `<=` —
   calculs-techniques.publicodes:649-678.
3. `chauffe-eau thermodynamique` et `PAC air-eau collective ECS` divisent
   tous deux par le SCOP collectif (douteux pour le thermodynamique) —
   bilan-1an.publicodes:1295, 1302.

---

## 4. Analyse critique et chantiers futurs

> Statuts : 🔜 décidé, à faire · 💤 volontairement laissé de côté (décision
> explicite) · ❓ à arbitrer. Les points déjà traités pendant le chantier
> (golden avec unités et situations représentatives, scories de nommage,
> en-têtes, convention de nommage, compat aplati…) ne sont plus listés.

### Robustesse du filet de sécurité

- 💤 **`external-keys.spec.ts` est maintenu à la main** (déjà pris en défaut
  **trois** fois pendant le chantier, dont une régression réelle : `Scope 1`,
  absent de la liste `envSuffixes`, donc absent de compat, alors que
  `Graph.tsx` le lit — 16 clés cassées, corrigé). Un script de
  synchronisation avec le repo front reste souhaitable à terme ; décision :
  on laisse en l'état, le rôle du test est de garantir l'existence des clés
  utilisées par le front.
- 🔜 **Le vrai filet exhaustif est le `tsc` du front**, pas une liste : le
  front consomme ce paquet via un tarball local
  (`file:../france-chaleur-urbaine-publicodes/betagouv-…-1.10.0.tgz`), tous
  ses accès passent par `getField/getFieldAsNumber/getUnit/setField(key:
  RuleName)`, et `mappings.ts` est `as const`. Les clés construites
  dynamiquement sont donc **vérifiées par types littéraux de gabarit** :
  `` getFieldAsNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 1`) ``
  produit une union de 16 littéraux confrontée à `RuleName`. Vérifié : avec
  le `RuleName` d'avant correctif, `tsc` sort
  `TS2345 … '"env . Installation x PAC air-eau x Individuel . Scope 1"' is
  not assignable to parameter of type 'RuleName'. Did you mean '… Scope 2'?`.
  **Boucle à faire tourner avant toute publication** : `pnpm pack:local` ici →
  `pnpm publicodes:local` dans le front → `tsc --noEmit`. Elle a servi à
  valider la réorganisation des racines (84 → 41) : `tsc` a listé les ~90
  sites à migrer, un par un, jusqu'à zéro erreur.
  Angles morts réels, à traiter côté front avant de s'y fier : les **casts
  `as RuleName`** qui désactivent le contrôle — `Configuration.tsx`
  (6, clés issues de la situation sauvegardée), `heatingModeCosts.ts` (2,
  dont un littéral fixe qui n'a aucune raison d'être casté),
  `simulation-service.ts` (4, dont `` `${prefix} . ${billPart}` `` qui se
  typerait tout seul sans le cast), `usePublicodesEngine.tsx:109`,
  `mappings.ts:195`. Supprimer ces casts (ou les remplacer par des
  `satisfies`) rend la couverture totale et **rend external-keys.spec.ts
  redondant pour les clés lues**.
- **Vérification déjà effectuée sur la branche** (méthode de secours, utile
  tant que les casts subsistent) : extraction de tous les littéraux du repo
  front, développement des gabarits avec les valeurs de `mappings.ts`, puis
  comparaison d'appartenance au modèle compilé **v1.10.0 vs branche** —
  1 136 clés candidates, 1 119 valides en v1.10.0, une seule famille
  manquante (`Scope 1`, corrigée) et 9 clés déjà mortes avant le chantier
  (labels obsolètes de `form/publicodes/labels.ts`). Deux gabarits seulement
  résistent à l'extraction (`coutParAnPublicodeKey` du catalogue chaleur
  renouvelable, `` `${prefix} . ${billPart}` `` du module PAC) : tous deux
  vérifiés à la main, couverts. Le diff brut des noms de règles (711
  disparus) ne suffit pas : il mélange règles mortes supprimées et
  renommages internes volontaires.
- ❓ **57 tests `describe.skip` dans index.spec.ts** : poids mort remplacé
  par le golden, à supprimer à l'occasion.

### Unités (décision : ne pas y toucher pour l'instant)

- 💤 Constats consignés pour plus tard :
  - typo `€HT/€d'investissment` (18 occurrences) ;
  - `kWh elec` avec le commentaire « corrigé pour faire fonctionner la
    division » — conversion douteuse à élucider ;
  - `€/an` vs `€TTC/an`, `kWhef` vs `kWh`, `kWh/m2/an` vs `kWhef/m2.an` ;
  - incohérence **rendue visible par le golden** : `environnement . scope 2`
    en `kgCO2e` vs `scope 3` en `kgCO2e/an` (sommés ensemble dans total).

  Prérequis de la normalisation : le golden-avec-unités (fait) ; chaque
  changement d'unité doit être justifié car il peut changer une conversion.

### Questions de fond (à arbitrer)

- 💤 **Couche bilan vs coûts** : P1abo/P1conso/P1Consofroid sont des alias
  purs de coûts (et P1prime/P2/P3 aussi dans les modes réversibles) ; les
  surcoûts froid sont greffés au niveau bilan. Fusionner impliquerait de
  revoir où s'ajoutent ECS/froid dans les sorties attendues — reporté
  (décision explicite).
- ❓ **`departements.publicodes`** : 1 923 lignes générées, dernier usage de
  `remplace`, pas de générateur committé. Options : variations générées,
  ou injection des données par le front (comme les caractéristiques réseau).
  Dans tous les cas : committer le générateur + la source.
- ❓ **Pseudo-modes solaires/hybride** : modèle grossier à faire valider
  (hybride = PAC air-eau coll × 120 %, couverture solaire 50 % en dur).
  À minima extraire ces constantes en ratios nommés et sourcés.
- ❓ **Section `environnement`** : patron verbeux hérité (`besoins de
  chauffage et ECS si même équipement` = 0 dans 9 modes, `scope 1` alias
  pur) — bloqué par le contrat DebugDrawer, comme bilan/coûts.
- ❓ **Intermédiaires triviaux encore contractuels** (alias « par logement
  tertiaire », `CEE: 0`, `scope 1`…) : à inliner une fois le DebugDrawer
  nettoyé côté front.
- 🔜 **Les 3 bugs figés restants** ([§3](#3-bugs-connus-figés)) : PR dédiée
  avec mise à jour golden documentée et revue métier (les 2 bugs sans
  incidence numérique ont déjà été corrigés sur la branche).

### Documentation

- ❓ **Documentation publiée** (site publi.codes, partenariat AMORCE) :
  ~51 `description:` pour ~2 400 règles. Gros levier : descriptions sur les
  règles de tête (racines de modes, sections, sorties bilan) et champ
  structuré `références:` pour les sources (ADEME, INIES, Base Empreinte…)
  au lieu de `note:` libres (292).

### Outillage

- ❓ Committer dans `scripts/` les outils forgés pendant le chantier :
  reachabilité des règles mortes, hash canonique du modèle compilé
  (aujourd'hui dans un scratchpad éphémère).
- ❗ **Le point d'entrée `publicodes-build/index.js` n'est pas chargeable par Node.** `publicodes compile` y écrit `assert { type: 'json' }`, syntaxe retirée de Node 22+ (le projet est en Node 24). Les bundlers l'acceptent encore — le comparateur, côté client, importe donc la racine du paquet sans problème — mais tout code chargé nativement en ESM (scripts, tests unitaires en environnement node) doit **importer le JSON en profondeur** : `@betagouv/france-chaleur-urbaine-publicodes/publicodes-build/france-chaleur-urbaine-publicodes.model.json`. C'est ce que fait `simulation-service.ts` côté front.
- ❗ `@publicodes/tools` est bloqué en **1.7.2** : toutes les versions publiées au-dessus (1.8.0 → 1.10.2) embarquent `"publicodes": "workspace:^"` et `"@publicodes/react-ui": "workspace:^"` dans leurs `dependencies` — le protocole `workspace:` a fuité à la publication, l'installation échoue hors de leur monorepo. Elles émettent par ailleurs toujours `assert { type: 'json' }`. Revérifier à la prochaine publication : si les deux points sont corrigés, la montée supprime aussi le besoin d'import profond.
- ❓ Vérifier que la CI exécute compile + tests sur les PR (le workflow
  visible ne couvre que la publication npm).
- ❓ Surveiller la v2 de publicodes (la migration éventuelle s'appuiera sur le
  golden, qui est resté strictement inchangé lors du passage 1.9.0 → 1.10.1).

### Côté front (hors de ce repo)

1. ✅ Migration vers les nouvelles clés et suppression de compat, avec
   renommage des situations enregistrées en base (migration Kysely).
2. ❓ Ménage du DebugDrawer (ne garder que les valeurs utiles).
