# Analyse critique — lisibilité et maintenance du modèle

> Analyse du 24/07/2026 (fin de la branche `refacto_regles_v2`), après la
> réorganisation par modes. Statuts : ✅ traité sur la branche · 🔜 décidé, à
> faire · 💤 volontairement laissé de côté · ❓ à arbitrer.

## 1. Robustesse du filet de sécurité

- ✅ **Le golden ne vérifiait pas les unités.** Prouvé par l'incident des
  11 unités corrompues par une regex de nettoyage, passées inaperçues sur
  plusieurs commits. Corrigé : les snapshots portent désormais
  `valeur unité` (« 275.89 €TTC/an »), vérifié sans dérive de valeur.
- ✅ **Situations golden trop peu variées** (6 situations, toutes à Paris,
  même bâtiment). Ajouté : maison DPE F hors IdF en HP/HC avec aides
  (barèmes hors IdF, facteurs BAR-TH-171 maison), immeuble avant 1974 à
  Marseille 60 logements sur réseau de froid, petit collectif RE2020 sans
  ECS ni clim, tertiaire commerces RT2012 2 000 m², parc social à besoins
  imposés — 187 snapshots.
- ❌ (correction d'un faux constat) : `situations/situations.publicodes` ne
  contient **pas** de clés dupliquées — les répétitions relevées étaient
  entre blocs de situations distincts, l'analyse initiale était fausse.
- 💤 **`external-keys.spec.ts` est maintenu à la main** (déjà pris en défaut
  deux fois pendant le chantier). Un script de synchronisation avec le repo
  front reste souhaitable à terme ; décision : on laisse en l'état, le rôle
  du test est de garantir l'existence des clés utilisées par le front.
- ❓ **57 tests `describe.skip` dans index.spec.ts** : poids mort remplacé
  par le golden, à supprimer à l'occasion.

## 2. Scories de la refonte

- ✅ Slugs d'anchors réalignés sur les noms actuels (95 renommages :
  `couts-p1-abonnement-indiv` au lieu de `couts-cout-du-combustible-…`).
- ✅ 18 en-têtes `######` orphelins (artefacts d'imbrication) retirés.
- ✅ Derniers séparateurs ` x ` traités : barèmes CEE restructurés sous
  `aides . CEE .`, `Coup de pouce PAC air-eau`, tarif gaz tertiaire rapatrié
  sous `combustibles . gaz`, casse `consommation groupe froid`. Les ` x `
  restants sont exclusivement les clés historiques canoniques écrites par le
  front (éligibilité aides, efficacité BAR-TH-171) — voulus jusqu'à la
  migration UI.
- ✅ Blocs commentés morts supprimés (Chaudière biomasse, MPR Supérieur).
- ✅ `Ma prime rénov'`/`renov'` harmonisé (l'unique variante accentuée était
  dans un bloc mort supprimé).
- 💤 **Unités hétérogènes — décision : ne pas y toucher pour l'instant.**
  Constats consignés pour plus tard :
  - typo `€HT/€d'investissment` (18 occurrences) ;
  - `kWh elec` avec le commentaire « corrigé pour faire fonctionner la
    division » — conversion douteuse à élucider ;
  - `€/an` vs `€TTC/an`, `kWhef` vs `kWh`, `kWh/m2/an` vs `kWhef/m2.an` ;
  - incohérence **rendue visible par le golden** : `environnement . scope 2`
    en `kgCO2e` vs `scope 3` en `kgCO2e/an` (sommés ensemble dans total).
  Prérequis de la normalisation : le golden-avec-unités (fait) ; chaque
  changement d'unité doit être justifié car il peut changer une conversion.

## 3. Questions de fond (à arbitrer)

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
- ❓ **`volume du ballon ECS`** : l'enfant de chaque mode référence le global
  homonyme par une résolution acrobatique (auto-référence apparente).
  Fonctionne, mais fragile aux renommages — à traiter explicitement.
- ❓ **Section `environnement`** : patron verbeux hérité (`besoins de
  chauffage et ECS si même équipement` = 0 dans 9 modes, `scope 1` alias
  pur) — bloqué par le contrat DebugDrawer, comme bilan/coûts.
- 🔜 **Les 5 bugs figés** (doc-refacto-modes.md §1.6) + l'orphelin qu'ils
  créent (`Paramètres économiques . Gros entretien P3 . PAC air-eau coll`,
  défini mais plus référencé) : PR dédiée avec mise à jour golden documentée
  et revue métier — premier vrai changement de valeurs depuis le début.

## 4. Documentation

- ✅ `doc-architecture.md` : organisation, conventions (anchors, références
  relatives, doctrine des clés écrites), tests, recettes de modification.
- ❓ **Documentation publiée** (site publi.codes, partenariat AMORCE) :
  ~51 `description:` pour ~2 400 règles. Gros levier : descriptions sur les
  règles de tête (racines de modes, sections, sorties bilan) et champ
  structuré `références:` pour les sources (ADEME, INIES, Base Empreinte…)
  au lieu de `note:` libres (292).
- ❓ README à mettre à jour (pointer doc-architecture.md) ; regrouper les
  `doc-*.md` dans un dossier `docs/`.

## 5. Outillage et fin de vie de compat

- ❓ Committer dans `scripts/` les outils forgés pendant le chantier :
  reachabilité des règles mortes, hash canonique du modèle compilé
  (aujourd'hui dans un scratchpad éphémère).
- ❓ compat.publicodes (~1 150 alias) : ajouter un test « aucune règle
  interne ne référence une clé de compat » pour empêcher de nouvelles
  dépendances aux vieux noms ; préparer le script de suppression pour la
  migration front.
- ❓ Vérifier que la CI exécute compile + tests sur les PR (le workflow
  visible ne couvre que la publication npm).
- ❓ Publicodes est en `^1.9` : surveiller la v2 (la migration éventuelle
  s'appuiera sur le golden).
