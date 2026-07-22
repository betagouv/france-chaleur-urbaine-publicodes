# Analyse — refactorisation des règles par mode de chauffage

> Analyse réalisée le 22/07/2026 sur `dev` (v1.10.0), en vue de simplifier et réorganiser
> les règles par mode de chauffage. Décisions de cadrage : on repart de `dev` (le POC
> `refacto_regles` sert de référence de structure), les anciennes clés sont conservées
> comme **alias de compatibilité** le temps de migrer le front, et les intermédiaires
> inutiles sont élagués.

## 1. État des lieux

~13 000 lignes de publicodes organisées par *type de calcul*, chaque fichier dupliquant
en interne les ~17 modes :

| Fichier | Lignes | Contenu |
|---|---|---|
| `calculs-techniques.publicodes` | 1 802 | 18 blocs `Installation x <Mode> x <Indiv\|Coll>` + socle `Calcul .` + helpers ECS/froid |
| `calculs-economiques.publicodes` | 2 465 | 17 blocs `Calcul Eco . <Mode>` + P2 P3 + aides + coût combustibles |
| `calculs-environnementaux.publicodes` | 511 | 17 blocs `env . Installation x …` (Scope 1/2/3) |
| `bilan-1an.publicodes` | 1 384 | 16 blocs `Bilan x <Mode>` complets + 6 blocs « exotiques » + `Calcul Bilan` (froid) |
| `ratios-techniques.publicodes` | 2 015 | 302 règles `ratios . <PREFIXE> …` (~197 transverses, ~105 par mode) |
| `ratios-economiques(-aides)` | 1 474 | invest. par mode, prix élec, aides MPR/CEE/CdP |
| `parametres-*` | 820 | entrées utilisateur (`par défaut:`) + injection départements |

Un même mode est éclaté sur 5 fichiers avec 4 conventions de nommage différentes
(`Installation x PAC air-air x Individuel` / `Calcul Eco . PAC air-air indiv` /
`Bilan x PAC air-air indiv` / `env . Installation x PAC air-air x Individuel`).

### 1.1 La duplication est massive et mécanique

**Calculs techniques** — 16 sous-règles types par bloc. 11 sont présentes dans
quasiment tous les blocs, et parmi elles **5 sont copiées au caractère près 16 fois**
(tout le paquet ECS : `besoin d'installation supplémentaire…`, `volume du ballon ECS`,
`consommation d'électricité chauffe-eau électrique`, `appoint…solaire`, alias
`combustible hors électricité`). Le reste est identique à un préfixe de ratio près.
La spécificité réelle d'un mode tient à **2 règles** : `gamme de puissance existante`
(6 structures distinctes) et `consommation combustible chaleur` (5 structures), plus
la présence ou non du refroidissement.

**Calculs économiques** — socle de 12 sous-règles (S1–S12) strictement identique en
structure dans 15 modes sur 17 (~80 % du volume est de la duplication mécanique).
Divergences réelles : RCU (+raccordement/SST, part fixe/variable, CEE en cumac),
RFU (pas d'ECS), PAC eau-eau coll (split forage/PAC), et 3 patrons d'abonnement
(sans abo / avec abo / abo collectif ÷ nb logements).

**Bilan** — 3 familles seulement :
1. combustibles + RCU + radiateur (intègrent les surcoûts froid) ;
2. PAC air-air & air-eau (le froid est produit par la PAC → pas de surcoût, `aides` = alias) ;
3. PAC eau-eau coll (forages séparés).
Au sein d'une famille, les blocs sont identiques modulo le mode référencé et la durée de vie.
L'amortissement passe partout par l'anchor YAML `&pmt` (~40 instanciations).

**Environnement** — 17 blocs à structure strictement uniforme (8 sous-règles,
Scope 1/2/3), qui ne varient que par facteur d'émission, ratio de conso et
`/ nombre de logements` en collectif.

### 1.2 Les 3 axes de variation sont orthogonaux

C'est le résultat le plus structurant de l'analyse :

- **Énergie** (gaz/fioul/granulés/PAC/…) → préfixe de ratios + formule `consommation
  combustible chaleur` + échelle de puissance ;
- **Avec/sans condensation** → uniquement 1 vs 2 rendements (chauffage vs chauffage+ECS)
  et l'arrangement de la formule combustible. Fioul indiv est le jumeau structurel de
  Gaz indiv sans cond ; Fioul coll celui de Gaz coll avec cond ;
- **Indiv/coll** → uniquement `× nb logements × coefficient de foisonnement` + échelle
  de puissance + division de l'abonnement/entretien par logement.

Une base commune par énergie avec surcharges est donc réaliste.

### 1.3 Ratios et paramètres

- **~197 règles transverses** (CHAF, RAF, CI, ECS, GNRL, PUIS = matrices bâtiment/climat
  via `remplace:`) → à garder centralisées.
- **~190 règles par mode** (blocs énergie de ratios-techniques, familles d'invest de
  ratios-economiques, `CO2 INS <mode>`, aides par mode) → migrables dans le fichier du mode.
- **Socles partagés** à ne pas enfouir dans un mode : `PAC GNRL` + `PAC DEROG3`
  (communs à toutes les PAC), barèmes de revenus MPR/CEE (axe revenu transverse à l'axe mode),
  `Investissement x TVA/pose`, `Amortissement`.
- Incohérences : prix de l'électricité dans `ratios-economiques` mais prix du gaz dans
  `parametres-economiques` ; 5 règles marquées `# pas un ratio` (calculs rangés dans les
  ratios) ; casse mixte `radiateur électrique` / `Radiateur électrique`.

### 1.4 Surface externe réelle (front)

- `test/external-keys.spec.ts` protège ~1 135 clés (Bilan, DebugDrawer, page paramètres).
- **Le test était incomplet** (complété depuis sur `refacto_regles_v2`) : les modules
  `chaleur-renouvelable`, `simulator` et `pac` du front lisent aussi
  `Bilan x <mode> . total sans installation` (via `coutParAnPublicodeKey`), les
  6 blocs Bilan « exotiques » (`PAC air-eau coll hybride`, `Solaire thermique`,
  `PAC capteurs solaires atmosphériques`, `PAC air-eau collective ECS`,
  `Chauffe-eau thermodynamique`, `Système solaire combiné`), l'ancien calcul cumac RCU
  (`Calcul Eco . Montant des aides . Réseaux de chaleur . *`), les plafonds de revenus
  (`ménage . revenu . plafond *`), `méthode tertiaire 2026`, `méthode résidentiel`,
  `type de bâtiment`, etc. Les blocs exotiques ne sont pas de vrais modes : ce sont des
  calculs d'exploitation partiels (add-ons) à isoler dans un fichier dédié.
- `total sans installation` est défini de façon incohérente (absent des blocs Gaz, Fioul,
  PAC air-air coll, Radiateur) alors que le catalogue front peut le demander pour
  n'importe quel mode → à généraliser.

### 1.5 Aucun filet de sécurité numérique

Les tests de valeurs dans `test/index.spec.ts` sont en **`describe.skip`** (ligne ~293).
Seule l'existence des clés est testée. **Prérequis absolu au refactor : un harnais
golden-master** (évaluation de toutes les clés externes sur plusieurs situations,
snapshot des valeurs — le script `export-csv` est une bonne base).

### 1.6 Bugs probables détectés au passage

**Décision (22/07/2026)** : ces bugs sont notés mais laissés de côté — le golden
master fige le comportement actuel tel quel ; les corrections viendront après la
réorganisation, avec mise à jour explicite des snapshots :

1. `Bilan x Gaz coll sans cond` : `P4spec` et `aides spécifiques` utilisent
   `ratios . GAZ COLL COND Durée de vie` (avec cond) — bilan-1an.publicodes:587-591, 623.
2. `Calcul Eco . P2 P3 … . PAC air-eau coll . gros entretien P3` référence le paramètre
   de **PAC air-air coll** — calculs-economiques.publicodes:1716.
3. PAC air-eau/eau-eau **indiv** : besoins ECS ajoutés inconditionnellement dans
   `consommation combustible chaleur`, alors que les variantes coll (et tous les autres
   modes) conditionnent à `type de production ECS = 'Avec équipement chauffage'` —
   calculs-techniques.publicodes:1224, 1316 vs 1480, 1580.
4. `gamme de puissance existante` Gaz coll avec cond mélange `<=` et `<` là où
   sans cond et fioul coll utilisent uniformément `<=` — calculs-techniques.publicodes:649-678.
5. `Bilan x Chauffe-eau thermodynamique` et `PAC air-eau collective ECS` divisent tous
   deux par `SCOP coll` (douteux pour le thermodynamique) — bilan-1an.publicodes:1295, 1302.

## 2. Comparatif des découpages

### Option A — 1 fichier par mode×variante (le POC)

```
src/modes/gaz-indiv.publicodes        → Gaz indiv avec cond / Gaz indiv sans cond
src/modes/pac-air-eau-indiv.publicodes
… (~16 fichiers de 300-700 lignes)
```

Chaque fichier : un namespace par mode avec sections `Installation`, `Calcul Eco`,
`P2 P3`, `Aides`, `Environnement`, `Bilan`.

- ✅ Localité parfaite : tout un mode dans un fichier, lecture autonome.
- ✅ Migration mécanique (c'est un déplacement, pas une réécriture).
- ❌ **La duplication reste entière** (~80 % du volume). Les 5 bugs ci-dessus sont
  précisément des dérives de copier-coller ; ce découpage les favorise.
- ❌ L'anchor `&pmt` et les patrons ECS/froid doivent être recopiés dans chaque fichier
  (les anchors YAML ne traversent pas les fichiers).
- ❌ indiv et coll d'une même énergie divergent silencieusement (c'est déjà arrivé, cf. bug 3).

### Option B — 1 fichier par énergie (~9 fichiers)

```
src/modes/gaz.publicodes           → 4 variantes (indiv/coll × cond/sans cond)
src/modes/fioul.publicodes         → 2 variantes
src/modes/granules.publicodes      → poêle indiv + chaudière coll
src/modes/pac-air-air.publicodes   → indiv + coll        (+ socle PAC partagé)
src/modes/pac-air-eau.publicodes   → indiv + coll
src/modes/pac-eau-eau.publicodes   → indiv + coll (+ forages)
src/modes/reseau-de-chaleur.publicodes
src/modes/reseau-de-froid.publicodes
src/modes/radiateur-electrique.publicodes
src/modes/add-ons-solaire-hybride.publicodes   → les 6 « pseudo-modes » du Bilan
```

Ce qui devient partageable **à l'intérieur** d'un fichier énergie (anchors YAML valides
dans un même fichier + règles communes de l'énergie) :

- l'échelle de puissance (identique entre cond/sans cond, et entre gaz coll/fioul coll) ;
- les formules paramétrées par variante (un seul patron `consommation auxiliaire`,
  `puissance ECS`, etc. avec le ratio en seul point de variation) ;
- un unique anchor `&pmt` par fichier (ou mieux : voir option C ciblée).

- ✅ Réduit fortement la duplication intra-énergie (l'axe cond/scond et l'axe indiv/coll
  sont précisément les plus dupliqués).
- ✅ Fichiers = frontières métier naturelles ; ajouter une variante d'une énergie se fait
  dans son fichier.
- ⚠️ La duplication **inter-énergies** du socle (paquet ECS, S1-S12 éco, structure env,
  structure bilan) subsiste si on ne fait que découper → à traiter par l'extraction des
  communs (voir recommandation).

### Option C — base commune + surcharges (`contexte:`)

Publicodes n'a pas de mixins, mais le mécanisme `contexte:` permet d'instancier une
règle générique :

```yaml
modèle . P1 conso:
  formule: modèle . consommation * modèle . prix unitaire

gaz coll avec cond . P1 conso:
  valeur: modèle . P1 conso
  contexte:
    modèle . consommation: gaz coll avec cond . consommation combustible
    modèle . prix unitaire: prix du gaz
```

- ✅ Zéro duplication de formule ; une correction s'applique partout.
- ❌ Verbosité de l'instanciation (~1 bloc `contexte:` par règle et par mode) : le gain
  net est faible pour les petites formules.
- ❌ Débogage nettement plus difficile dans `publicodes dev` (les évaluations sous
  contexte sont opaques) — or le DebugDrawer et la doc publiée sont des usages centraux ici.
- ❌ Coût runtime (réévaluations par contexte) sur un moteur déjà benchmarké (`pnpm bench`).

### Recommandation : B + extraction des communs (et C très ciblé)

L'essentiel du gain de l'option C peut être obtenu **sans** `contexte:` : les blocs les
plus dupliqués sont en réalité **indépendants du mode** et peuvent être calculés une
seule fois globalement :

- **ECS additionnelle** (ballon, chauffe-eau élec/solaire : volume, conso, invest, P1ECS,
  P4ECS, entretien) ne dépend du mode que par un booléen `besoin d'installation
  supplémentaire pour produire l'ECS` et par la puissance ECS de l'équipement →
  1 namespace commun `ecs additionnelle` + 1 flag par mode, au lieu de ~16 copies dans
  3 fichiers différents.
- **Froid / groupe froid / réseau de froid** (surcoûts P1'/P2/P3/P4/aides de
  `Calcul Bilan`) ne dépend du mode que du booléen « la PAC est réversible » → 1 namespace
  commun + 1 flag.
- **PMT / amortissement** : remplacer l'anchor `&pmt` par une règle publicodes commune
  (`amortissement . annuité` avec `contexte:` pour `capital` et `durée` — c'est LE bon
  cas d'usage de `contexte`, ~40 instanciations d'une même formule financière).

Structure cible :

```
src/
  commun/
    besoins.publicodes            # Calcul . puissances/besoins (ex-socle de calculs-techniques)
    ecs-additionnelle.publicodes  # ballon, chauffe-eau élec/solaire (calcul unique)
    froid.publicodes              # groupe froid, réseau de froid, surcoûts bilan
    amortissement.publicodes      # PMT en règle publicodes
    combustibles.publicodes       # prix gaz/élec/granulés/fioul/RCU/RFU (fusion de l'existant éclaté)
    aides-baremes.publicodes      # barèmes revenus MPR/CEE (axe revenu, transverse)
    pac-socle.publicodes          # PAC GNRL + PAC DEROG3
  modes/
    gaz.publicodes                # 4 variantes ; ratios gaz inclus dans le fichier
    fioul.publicodes              # …
    …
    add-ons-solaire-hybride.publicodes
  parametres/                     # entrées utilisateur (par défaut:) + départements
  compat.publicodes               # alias ancienne clé -> nouvelle clé (généré, temporaire)
```

Structure standard d'un mode (chaque variante suit exactement ce plan) :

```yaml
gaz coll avec cond:
  avec:
    ratios:          # rendements, conso aux., durée de vie, invest — modifiables depuis le front
    installation:    # puissances, gamme, flag ECS additionnelle, flag réversible
    consommations:   # combustible chaleur, auxiliaire, froid
    couts:           # P1 abo/conso/aux, P2, P3, investissement (P4 capital)
    aides:           # MPR / CdP / CEE (les barèmes restent dans commun/)
    environnement:   # Scope 1 / 2 / 3 / Total
    bilan:           # P1abo, P1conso, P1prime, P1ECS, P1Consofroid, P2, P3, P4,
                     # P4 moins aides, aides, total sans aides, total avec aides,
                     # total sans installation   ← généralisé à tous les modes
```

Compatibilité : `compat.publicodes` (généré par script à partir du mapping
ancien→nouveau) expose chaque ancienne clé comme `valeur: <nouvelle clé>`. Le test
`external-keys` continue de passer tel quel pendant la migration du front ; suppression
des alias en version majeure une fois le front migré.

## 3. Élagage

### 3.1 Vérifié mort (non atteignable depuis les clés front, y compris chaleur-renouvelable)

133 règles non atteignables depuis l'ensemble des clés consommées (spec + module
chaleur-renouvelable vérifié dans le repo front). Extraits notables :

- `mode affichage` (paramètre défini, lu nulle part) ; `Calcul:` (vide, commenté
  `# useless`) ; `version` ;
- `ratios économiques . Groupe froid` (placeholder `par défaut: 0` « temporaire ») ;
- bloc `ratios . PAC AB *` (PAC absorption gaz, 5 règles, plus rien ne pointe dessus) ;
- `ratios . CHAUF EAU SOLAIRE 250/400/550/650` + `Puissance installation x Capacité
  chauffe eau solaire` ;
- `ratios . PAC GNRL A/A+/A++/A+++` + `ratios . PAC * Classe énergétique` (mécanisme de
  classe énergétique abandonné) ;
- `Installation x Groupe froid x Individuel` (bloc tronqué) + `env . Installation x
  Groupe froid …` (tout à 0) — le calcul réel passe par les helpers globaux ;
- `Calcul Eco . P2 P3 … . Chauffe-eau électrique à accumulation` et `. Panneau solaire
  thermique pour production ECS` (P2/P3 jamais sommés) ;
- divers ratios env (`Emission spé Biogaz/Buches…`, `CO2 INS Ballon électrique/RFU/
  Solaire thermique`, `Emission moy Ratio moyen RC/RF`…) et aides tertiaires CEE
  spécifiques (GAZ COLL COND, PAC air-air) définies mais non branchées.

Liste complète : générée par script de reachabilité (voir §4, à intégrer aux outils du repo).

### 3.2 Intermédiaires triviaux à inliner (~200 règles à usage unique + alias)

- `consommation combustible hors électricité` : alias pur ou `0` dans 16 blocs ;
- `consommation combustible froid: 0`, `consommation auxiliaire: 0`,
  `puissance nécessaire pour ECS avec équipement: 0` etc. dans les modes non concernés
  → dérivables de la structure commune ;
- `gamme de puissance existante` en RCU/RFU : passthrough de `puissance équipement` ;
- `Investissement équipement par logement type tertiaire` : alias pur en indiv (8 blocs) ;
- `petit/gros entretien … par logement tertiaire` : 21×2 alias (= P2, ou ÷ nb logements) ;
- `CEE: formule: 0` (~13 blocs), `Total` des aides (patron identique 18×) ;
- `Scope 1` : alias de `besoins de chauffage et ECS si même équipement` dans les 17 blocs
  env (et cette dernière vaut 0 dans 9 blocs) ;
- `aides: aides spécifiques` (4 blocs PAC) ;
- `durée avant renouvellement elec/solaire` : alias de ratios ;
- `consommation Groupe Froid` : alias identique 17× vers le helper global.

**Attention** : une partie de ces intermédiaires est affichée par le DebugDrawer
(donc dans external-keys). L'élagage se fait en deux temps : d'abord alias de compat,
puis nettoyage du DebugDrawer côté front pour ne garder que les valeurs utiles, enfin
suppression des alias.

### 3.3 Uniformisations de nommage

- Un seul identifiant par mode partout (finir le travail du POC) — supprimer l'asymétrie
  `Calcul Eco . PAC air-air indiv` ↔ `Installation x PAC air-air x Individuel` ↔
  `Bilan x PAC air-air indiv` ;
- casse cohérente (`radiateur électrique` vs `Radiateur électrique`) ;
- corriger `ECS Quanté d'ECS par an` (typo) ;
- déplacer les 5 règles `# pas un ratio` de `ratios-economiques` vers les calculs ;
- réunifier les prix des combustibles (élec vs gaz aujourd'hui dans 2 fichiers différents).

## 4. Plan de migration proposé

Chaque étape est iso-résultats et vérifiée par le golden master ; 1 PR par étape.

1. **Filet de sécurité** : script golden-master (toutes les clés externes — spec complété
   avec les clés chaleur-renouvelable — × plusieurs situations de `situations/`,
   snapshot des valeurs arrondies). Réactiver les tests skippés sous cette forme.
2. ~~Décision sur les 5 bugs~~ → tranchée : comportement actuel figé, corrections
   post-refacto (§1.6).
3. **Extraction des communs** : `amortissement` (PMT en règle), `ecs additionnelle`,
   `froid`, `combustibles`, `aides-baremes`, `pac-socle`. Aucun renommage de clé externe
   à ce stade.
4. **Migration énergie par énergie** vers `src/modes/*.publicodes` avec la structure
   standard + alias dans `compat.publicodes` (générés). Ordre suggéré : gaz (le plus
   riche, valide le patron 4 variantes) → fioul (jumeau) → granulés → PAC ×3 → radiateur
   → RCU/RFU (les plus spécifiques) → add-ons.
5. **Élagage** : suppression des morts (§3.1), inline des triviaux (§3.2), généralisation
   de `total sans installation`.
6. **Front** : nettoyage du DebugDrawer (ne garder que les valeurs intéressantes),
   migration vers les nouvelles clés, puis suppression de `compat.publicodes` en version
   majeure.

## Annexe — chiffres clés

- 2 578 règles compilées ; ~1 135 clés consommées par le front (spec) + clés
  chaleur-renouvelable hors spec ;
- 133 règles non atteignables (hors départements) ; ~207 règles à usage unique ;
- duplication estimée : ~80 % du volume des blocs économiques, 5 sous-règles techniques
  copiées 16×, patron bilan copié par famille, patron env copié 17×.
