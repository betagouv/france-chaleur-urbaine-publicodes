# Récap — refactorisation des règles par mode de chauffage

> Branche `refacto_regles_v2`, 15 commits à partir de `dev` (v1.10.0), juillet 2026.
> L'analyse qui a précédé le chantier est dans [doc-refacto-modes.md](doc-refacto-modes.md).

## En une phrase

Le modèle, auparavant éclaté par *type de calcul* (technique, économique,
environnemental, bilan — chaque mode dupliqué dans 4-5 fichiers sous 4
conventions de nommage), est maintenant organisé par *mode de chauffage*
(1 fichier par énergie, une structure de sections uniforme par mode), avec
la duplication factorisée, les règles mortes supprimées et la compatibilité
front assurée par des alias — le tout sans changer un seul résultat de calcul.

## Garanties de non-régression

- **Golden master** ([test/golden.spec.ts](test/golden.spec.ts)) : 102 snapshots
  figeant P1abo → P4, aides, totaux et CO2 (Scope 2/3, Total) des 16 modes
  + add-ons sur 6 situations. Inchangés du premier au dernier commit.
- **Clés externes** : le test [external-keys.spec.ts](test/external-keys.spec.ts)
  (~1 170 clés, complété avec les modules chaleur-renouvelable / simulator / pac
  du front qui n'étaient pas couverts) passe à l'identique via les alias.
- **Hash canonique** : chaque déplacement de règles entre fichiers a été vérifié
  par hash SHA-256 du modèle compilé (clés triées) — déplacements *prouvés* purs.
- `pnpm export-csv` régénère un CSV strictement identique à celui de `dev`.

## Avant / après : organisation des fichiers

| Avant (`dev`) | Après (`refacto_regles_v2`) |
|---|---|
| `calculs-techniques.publicodes` (1 802 l.) — les 18 blocs `Installation x …` | `modes/gaz.publicodes` — les 4 variantes gaz : ratios, installation, coûts, entretien, aides, émissions, bilan |
| `calculs-economiques.publicodes` (2 465 l.) — 17 blocs `Calcul Eco . …` + P2P3 + aides | `modes/fioul.publicodes`, `granules`, `pac-air-air`, `pac-air-eau`, `pac-eau-eau`, `radiateur-electrique`, `reseau-de-chaleur`, `reseau-de-froid` — idem par énergie |
| `calculs-environnementaux.publicodes` (511 l.) — 17 blocs `env . Installation x …` | `modes/add-ons-solaire.publicodes` — les 6 pseudo-modes partiels (hybride, solaire…) |
| `bilan-1an.publicodes` (1 384 l.) — 22 blocs `Bilan x …` + anchor `&pmt` | `commun/` — besoins, ecs, froid, pac, combustibles, amortissement, consommations spécifiques chauffage/clim, coefficients d'intermittence |
| `ratios-techniques.publicodes` (2 015 l.) — 302 ratios tous modes confondus | ratios par mode dans le fichier du mode ; ratios transverses dans `commun/` |
| | `compat.publicodes` (généré) — 947 alias anciennes clés → nouvelles |

Volume : ~11 000 lignes de règles (hors départements) sur `dev` →
**~9 650 lignes** (hors départements et compat), après suppression de
99 règles mortes et ~1 400 lignes de duplication, malgré l'ajout des
racines de modes et des en-têtes de sections.

## Avant / après : nommage des clés

Un mode = un namespace, avec les mêmes sections partout :

| Avant (4 conventions) | Après |
|---|---|
| `Installation x Gaz coll avec cond x Collectif . puissance équipement` | `gaz coll avec cond . installation . puissance équipement` |
| `Calcul Eco . Gaz coll avec cond . Investissement équipement Total` | `gaz coll avec cond . coûts . Investissement équipement Total` |
| `Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . petit entretien P2` | `gaz coll avec cond . entretien . petit entretien P2` |
| `Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . CEE` | `gaz coll avec cond . aides . CEE` |
| `env . Installation x Gaz coll avec cond x Collectif . Total` | `gaz coll avec cond . environnement . Total` |
| `Bilan x Gaz coll avec cond . P4` | `gaz coll avec cond . bilan . P4` |

Les anciennes clés restent lisibles via `compat.publicodes` (alias) tant que le
front n'a pas migré. **Les clés que le front écrit (ratios, paramètres) n'ont
volontairement pas été renommées** : un alias ne propage pas les écritures ;
elles migreront en même temps que le front, en version majeure.

## Exemple concret : le P4 de « Gaz coll avec cond »

### Avant (`dev`)

Le calcul traversait 4 fichiers : `bilan-1an.publicodes` (ci-dessous),
`calculs-economiques.publicodes` (l'investissement), `ratios-techniques.publicodes`
(la durée de vie), `ratios-economiques.publicodes` (le coût), et dépendait d'un
anchor YAML `&pmt` défini en tête de fichier — donc impossible à déplacer :

```yaml
# bilan-1an.publicodes (en tête de fichier)
x-pmt: &pmt
  - si: ratios économiques . Amortissement x Taux actualisation != 0
    alors: ratios économiques . Amortissement x Taux actualisation * capital * ((1 + ratios économiques . Amortissement x Taux actualisation) ** durée) / ((1 + ratios économiques . Amortissement x Taux actualisation) ** durée - 1)
  - sinon: capital / durée

# … 500 lignes plus loin, répété ~70 fois avec d'autres durées/capitaux :
Bilan x Gaz coll avec cond:
  avec:
    P1abo: Calcul Eco . Gaz coll avec cond . Coût du combustible abonnement
    ...
    P4spec:
      variations: *pmt
      avec:
        durée: ratios . GAZ COLL COND Durée de vie
        capital: Calcul Eco . Gaz coll avec cond . Investissement équipement par logement type tertiaire

    P4ECS Ballon électrique:
      variations: *pmt
      avec:
        durée: ratios . CHAUF EAU ELEC Durée de vie
        capital: Calcul Eco . Gaz coll avec cond . Investissement ballon ECS à accumulation

    P4ECS Solaire Thermique:
      variations: *pmt
      avec:
        durée:
          variations:
            - si: type de production ECS = 'Solaire thermique'
              alors: ratios . CHAUF EAU SOLAIRE Durée de vie
            - sinon: 0
        capital:
          variations:
            - si: type de production ECS = 'Solaire thermique'
              alors: Calcul Eco . Gaz coll avec cond . Investissement ballon ECS solaire panneau inclus
            - sinon: 0

    aides spécifiques:
      variations: *pmt
      avec:
        durée: ratios . GAZ COLL COND Durée de vie
        capital: Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . Total
```

### Après

Tout le mode vit dans `modes/gaz.publicodes`, regroupé sous une seule règle
racine à son nom (sections imbriquées via `avec:`). L'amortissement est une
multiplication par un facteur d'annuité défini une seule fois dans
[commun/amortissement.publicodes](src/commun/amortissement.publicodes), les
références internes au mode sont relatives (`coûts . X`), et les corps
identiques entre les 4 variantes gaz sont partagés par anchor (`*bilan-p4`,
défini sur la première variante du fichier) :

```yaml
# modes/gaz.publicodes
gaz coll avec cond:
  description: Chaudière gaz collective à condensation
  avec:
    ratios:
      # Paramétrage du mode : alias lisibles vers les clés plates historiques,
      # qui restent canoniques et modifiables par le front (les écritures se
      # propagent à travers l'alias — testé dans index.spec.ts).
      avec:
        rendement chaudière chauffage: ratios . GAZ COLL COND Rendement chaudière chauffage
        rendement chaudière ECS: ratios . GAZ COLL COND Rendement chaudière ECS
        conso combustible: ratios . GAZ COLL COND Conso combustible
        durée de vie: ratios . GAZ COLL COND Durée de vie
        investissement équipement: ratios économiques . Gaz x coll avec cond
        petit entretien P2: Paramètres économiques . Petit entretien P2 . Gaz coll avec cond
        gros entretien P3: Paramètres économiques . Gros entretien P3 . Gaz coll avec cond
        CO2 installation: ratios environnementaux . CO2 INS Gaz coll avec cond
        # ...
    installation:
      avec: ...
    coûts:
      avec: ...
    entretien:
      avec: ...
    aides:
      avec: ...
    environnement:
      avec: ...
    bilan:
      avec:
        P1abo: coûts . Coût du combustible abonnement
        P1conso: coûts . Coût du combustible consommation
        P1prime: coûts . Coût électricité auxiliaire + Calcul Bilan . Surcout Réseau de froid P1prime
        P1ECS: *bilan-p1ecs
        P1Consofroid: coûts . Coût combustible froid
        P2: entretien . petit entretien P2 par logement tertiaire + Calcul Bilan . Surcout Réseau de froid P2
        P3: entretien . gros entretien P3 par logement tertiaire + Calcul Bilan . Surcout Réseau de froid P3
        P4spec:
          formule: coûts . Investissement équipement par logement type tertiaire * amortissement . facteur GAZ COLL COND
        P4ECS Ballon électrique:
          formule: coûts . Investissement ballon ECS à accumulation * amortissement . facteur CHAUF EAU ELEC
        P4ECS Solaire Thermique: *bilan-p4ecs-solaire-thermique
        P4: *bilan-p4
        aides spécifiques:
          formule: aides . Total * amortissement . facteur GAZ COLL COND
        aides: *bilan-aides
        P4 moins aides: *bilan-p4-moins-aides
        total sans aides: *bilan-total-sans-aides
        total avec aides: *bilan-total-avec-aides
```

Et une variante ne montre plus que ses **vraies** différences. Voici
l'intégralité de la partie coûts de « gaz indiv sans cond » — seuls
l'investissement et le ratio de consommation diffèrent de « avec cond »,
tout le reste est un alias vers le corps défini sur la première variante :

```yaml
    # (sous « gaz indiv sans cond: / avec: »)
    coûts:
      avec:
        Investissement équipement Total:
          produit:
            - ratios économiques . Gaz x indiv sans cond
            - ( 1 + ratios économiques . Investissement x Pose et mise en place de l'installation )
          unité: €TTC
        Investissement équipement par logement type tertiaire: *couts-investissement-equipement-par-logement-type-tertiaire-indiv
        Investissement ballon ECS à accumulation: *couts-investissement-ballon-ecs-a-accumulation
        Investissement ballon ECS solaire panneau inclus: *couts-investissement-ballon-ecs-solaire-panneau-inclus
        Total investissement avec ballon ECS à accumulation: *couts-total-investissement-avec-ballon-ecs-a-accumulation
        Total investissement ballon ECS solaire panneaux: *couts-total-investissement-ballon-ecs-solaire-panneaux
        Coût du combustible abonnement: *couts-cout-du-combustible-abonnement-indiv
        Coût du combustible consommation:
          produit:
            - Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part consommation
            - installation . consommation combustible chaleur
            - 1 / ratios . GAZ IND SCOND Conso combustible
          unité: €TTC/an
        Coût électricité auxiliaire: *couts-cout-electricite-auxiliaire
        Coût combustible pour ballon ECS à accumulation: *couts-cout-combustible-pour-ballon-ecs-a-accumulation
        Coût combustible pour ballon ECS solaire: *couts-cout-combustible-pour-ballon-ecs-solaire
        Coût combustible froid: *couts-cout-combustible-froid
```

Avant, ce même contenu occupait ~85 lignes intégralement recopiées — c'est ce
copier-coller qui avait produit les bugs du type « Gaz coll sans cond amorti
sur la durée de vie de *avec cond* » (bug d'ailleurs toujours en place,
volontairement : il est figé par le golden master et sera corrigé dans un
second temps, cf. doc-refacto-modes.md §1.6 — il est maintenant visible en
une ligne au lieu d'être noyé).

## Les mécanismes introduits

1. **Facteurs d'annuité** (`commun/amortissement.publicodes`) : la fonction
   Excel PMT, avant dupliquée par anchor dans 70 instanciations, est déclinée
   en 19 facteurs (un par durée de vie). Un amortissement = `capital × facteur`.
   L'alternative `contexte:` de publicodes a été testée et **écartée** :
   évaluation 3,7× plus lente. Les facteurs sont au contraire légèrement plus
   rapides que `dev` (mis en cache une fois par situation).
2. **Références relatives** : dans un mode, `coûts . X` suffit — publicodes
   remonte les namespaces. C'est ce qui rend les corps identiques entre
   variantes, donc factorisables.
3. **Anchors défini-à-la-première-occurrence** : la première variante d'un
   fichier porte le corps (`Nom: &anchor`), les suivantes l'aliasent
   (`Nom: *anchor`). 178 anchors, 236 alias, ~1 400 lignes en moins. Le modèle
   compilé est rigoureusement identique (mêmes nœuds YAML).
4. **Alias de compat** (`compat.publicodes`, généré) : 947 anciennes clés
   lues par le front → nouvelles clés. Coût transitoire : parsing +20 %,
   évaluation via les anciennes clés +23 % ; disparaît avec la migration front.
5. **Sections `ratios` par mode** (132 alias locaux) : le paramétrage de chaque
   mode est une section explicite dont les enfants portent des noms courts
   (`rendement chaudière chauffage`, `durée de vie`, `investissement
   équipement`…) et aliasent les clés plates historiques — qui restent
   canoniques et **écrites** par le front (la propagation des écritures est
   testée). Les formules du mode référencent `ratios . durée de vie` en
   relatif, ce qui a neutralisé les corps d'entretien/environnement entre
   variantes et permis une seconde passe de factorisation (+22 anchors).
   À la migration front, il suffira d'inverser le sens des alias.

## Élagage réalisé

99 règles mortes supprimées, vérifiées par analyse de reachabilité depuis
l'ensemble des clés réellement consommées (front inclus) : mécanisme de classe
énergétique PAC abandonné, bloc PAC absorption, bloc Groupe froid tronqué,
barèmes CEE jamais branchés, tables chauffe-eau solaire orphelines, ratios et
facteurs d'émission sans consommateur, typo `Quanté d'ECS`…

## Ce qui reste

1. **Côté front** : ménage du DebugDrawer (ne garder que les valeurs utiles),
   migration vers les nouvelles clés, puis suppression de `compat.publicodes`
   et renommage des clés écrites (ratios, paramètres) en version majeure.
2. **Corriger les 5 bugs figés** (doc-refacto-modes.md §1.6) avec mise à jour
   explicite et documentée des snapshots golden.
3. **Inline des intermédiaires triviaux** encore contractuels (alias
   « par logement tertiaire », `CEE: 0`, `Scope 1`…) une fois le DebugDrawer
   nettoyé.
4. Éventuellement : partage inter-énergies du socle bilan/ECS (les anchors ne
   traversent pas les fichiers ; demanderait soit un générateur, soit le
   renommage des ratios par mode pour des corps 100 % neutres).
