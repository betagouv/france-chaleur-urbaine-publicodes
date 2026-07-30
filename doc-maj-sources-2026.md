# Compte rendu — audit des sources et mise à jour des valeurs (juillet 2026)

> Audit réalisé le 30/07/2026 sur l'ensemble des `note:` des fichiers
> `src/**/*.publicodes` (363 notes/descriptions, ~20 sources distinctes),
> suivi de deux branches empilées :
>
> - **`maj-sources-2026`** (`160de83`) — documentation des sources, **sans
>   aucun changement de valeur** (golden strictement inchangé, preuve de
>   non-régression) ;
> - **`maj-valeurs-2026`** (`33ad9c7`) — mise à jour des valeurs aux
>   références 2025-2026, golden recalculé (187 snapshots, unités inchangées).

## 1. Inventaire des sources et état de fraîcheur

| Source | Millésime cité | Champs concernés | État au 30/07/2026 |
|---|---|---|---|
| TRV électricité (via « ELCIMAI + TRV » et « AMORCE ») | 2024 | `combustibles . électricité . tarifs` : prix kWh base/HP/HC, abonnements | 🔴 3 révisions manquées (−15 % fév. 2025, TVA août 2025, fév. 2026) → **corrigé** |
| Accise électricité (ex-TICFE) | 2024 (21 €/MWh) | `taxes . Part Variable x Accise` | 🔴 30,85 €/MWh depuis fév. 2026 → **corrigé** |
| TVA abonnement élec/gaz | 5,5 % | `taxes . Part Fixe x TVA`, `taxes . TVA part fixe` | 🔴 20 % depuis le 01/08/2025 → **corrigé** |
| Prix repère gaz (CRE) | non sourcé (2024) | `gaz . coût de la molécule/transport/distribution/CEE HT`, abonnement | 🟠 +7,4 % juil. 2026 → **recalé sur août 2026** |
| Accise gaz (ex-TICGN) | 2024 (16,37 €/MWh) | `gaz . taxes . TICGN` | 🟠 16,39 €/MWh fév. 2026 → **corrigé** |
| Fioul (impots.gouv + prix marché) | 2024 | `fioul . prix livraison incluse`, TVA, TICPE | 🔴 ~1,16 €TTC/L calculé vs 1,40-1,65 réel → **corrigé** (TICPE inchangée) |
| CEEB (granulés) | 2024 | `granulés . prix pour les granulés` | 🟠 ~412-426 €TTC/t (relevés 2026) → **corrigé** |
| MaPrimeRénov' (Service-Public) | 2024 | `aides . ma prime rénov` des modes | 🟠 seul le poêle à granulés avait bougé → **corrigé (1250/1000/750)**, autres montants vérifiés conformes 2026 |
| Coup de pouce chauffage | 2024 (planchers) | `aides . coup de pouce` (RCU 700 €, PAC eau-eau 5 000 €, ECS solaire 5 000 €) | 🔴 réformé au 01/01/2026 : plus de minimum, bonification CEE ×2 à ×5 → **marqué obsolète, refonte à prévoir** |
| Registre CEE (EMMY) | 2024 (8,16/8,04 €/MWhc) | `aides . valeur CEE` | 🟠 P6 (2026-2030) : classique ~8,5-9, précarité 9-13 €/MWhc → non modifié (cotation spot) |
| Barèmes CEE FCU (« Gouvernement 2024 ») | 2024 | `aides . CEE . barème FCU résidentiel/tertiaire` | 🟠 à confronter à l'arrêté en vigueur 01/2026 (les fiches `aides cumac` sont déjà en v. 01/01/2026) |
| Base Empreinte | 2023 (gaz/fioul/granulés), 2020 (élec par usage) | `facteurs CO2 . *` | 🟠 base courante v23.6 (07/2025) ; écart méthodo élec (69,3 vs 147 g conventionnel) → non modifié, choix à arbitrer |
| ADEME Coûts EnR&R | éd. 2022 (données 2020) | coûts au kW PAC air-air indiv, PAC eau-eau indiv/coll | 🟠 édition janv. 2025 (données 2021-2022) disponible → non modifié (relecture d'étude nécessaire) |
| Enquête FEDENE | 2025 (données 2024) | contenu CO2, CO2 ACV, taux EnRR, coûts raccordement | 🟢 dernière édition |
| Enquête AMORCE prix chaleur/froid | données 2024 | prix moyen, part fixe/variable RCU/RFU | 🟢 dernière édition |
| Barème revenus ANAH | non sourcé | `bareme-revenu-mpr.publicodes` (6 grilles) | 🟢 correspond exactement au barème **2026** (vérifié : 24 031 € TM IdF 1 pers.) |
| Fiches CEE BAR-TH-137 / BAT-TH-127 | v. 01/01/2026 | `aides cumac` réseau de chaleur | 🟢 en vigueur |
| Costic / Cégibat (DJU) | — | `departements.publicodes` (96 depts × chaud/froid) | ⚪ normales climatiques |
| INIES | 2022 | `CO2 installation` de tous les modes | ⚪ pas d'échéance publique |
| SDES | 2023 | coût équipement PAC air-eau indiv | ⚪ à revoir à l'occasion |
| Constructeurs (Atlantic 23/24, Thermor 24, Invicta 24, Hargassner) et ELCIMAI 2024 | 2023-2024 | coûts d'équipement, pose, sous-stations, tarifs tertiaires | ⚪ données catalogue/BE partenaire |

## 2. Branche `maj-sources-2026` — documentation (zéro impact numérique)

- **Convention unifiée** sur tous les fichiers édités à la main
  (`departements.publicodes`, généré, non touché) :
  `note: "Source : <document> (<millésime>) — <URL> — màj : <périodicité>"`.
  URL et périodicité quand elles existent — sources couvertes : Base
  Empreinte, TRV/CRE, prix repère gaz/CRE, CEEB via Propellet, EMMY, coup de
  pouce (ecologie.gouv), MaPrimeRénov' (Service-Public), ANAH, FEDENE,
  AMORCE, INIES, Librairie ADEME. Le champ publicodes `références:` a été
  écarté : il n'est pas exploité par le front.
- **Périodicité de mise à jour** indiquée dans chaque note sourcée
  (« màj : révisions TRV en février et août », « màj : indice
  trimestriel », « màj : cotation mensuelle du registre EMMY »…) : elle dit
  quand revérifier la valeur.
- **Champs désormais sourcés** : accises gaz/élec, TVA, CTA, prix moyens CEE,
  barème de revenus MPR (= barème ANAH 2026, vérifié).
- **Nettoyages** : champ égaré `source: 2021` (contenu CO2 réseau de froid)
  converti en note ; notes-URL brutes (coup de pouce collectif, fiches CEE)
  convertie en libellé + référence ; « ADEME Coûts EnR 2022 2020 » explicité.
- **Provenances inconnues marquées en commentaire** (pour ne pas inventer) :
  décomposition du prix du gaz, grille d'abonnement gaz tertiaire, barème CEE
  FCU tertiaire.

## 3. Branche `maj-valeurs-2026` — valeurs mises à jour

| Champ | Avant | Après | Référence |
|---|---|---|---|
| Élec — prix kWh base | 0,1708 €HT | 0,1297 €HT | TRV fév. 2026 : 0,1927 €TTC (≥ 9 kVA ; 0,1940 ≤ 6 kVA) |
| Élec — prix kWh HP / HC | 0,2040 / 0,1513 €HT | 0,1412 / 0,1007 €HT | TRV fév. 2026 : 0,2065 / 0,1579 €TTC |
| Élec — accise | 0,021 €/kWh | 0,03085 €/kWh | tarif ménages fév. 2026 |
| Élec + gaz — TVA abonnement | 5,5 % | 20 % | depuis le 01/08/2025 |
| Gaz — accise (TICGN) | 0,01637 €/kWh | 0,01639 €/kWh | fév. 2026 |
| Gaz — molécule HT | 0,043 €/kWh | 0,0637 €/kWh | calé sur prix repère CRE août 2026 (0,1256 €TTC/kWh chauffage) |
| Gaz — abonnement distribution HT | 139 €/an | 178 €/an | calé sur abonnement prix repère CRE août 2026 (360,79 €TTC/an) |
| Fioul — prix HT hors TICPE | 0,84 / 0,80 €HT/L | 1,12 / 1,08 €HT/L | relevés juillet 2026 (~1,50 €TTC/L, marché volatil) |
| Granulés — prix sac / vrac | 330 / 365 €HT/t | 380 / 387 €HT/t | relevés mars-avril 2026 (indice CEEB) |
| MPR poêle à granulés | 1 800/1 500/1 000 € | 1 250/1 000/750 € | barème 2026 (−30 %) |
| Notes MPR (montants inchangés) | « 2024 » | « 2026 » | montants vérifiés au barème 2026 : PAC air-eau 5 000/4 000/3 000, PAC géo 11 000/9 000/6 000, raccordements 1 200/800/400, CESI 4 000/3 000/2 000 |
| Coup de pouce (planchers) | notes « montant minimal » | notes « obsolète, réformé 01/01/2026 » | valeurs conservées en attendant la refonte |

**Correction de formule** : la part variable élec appliquait la TVA au prix
HT mais pas à l'accise (`prix × 1,2 + accise`) ; elle est passée à
`(prix + accise) × 1,2`, conforme au droit fiscal. Les prix stockés sont
désormais de **vrais HT hors accise**.

**Vérifications** (valeurs reconstruites vs références publiques) :

| Grandeur calculée | Modèle | Référence |
|---|---|---|
| Élec, conso individuelle TTC | 0,1927 €/kWh | TRV base ≥ 9 kVA : 0,1927 |
| Gaz, part variable TTC | 0,12557 €/kWh | prix repère chauffage : 0,12558 |
| Gaz, abonnement TTC | 360,61 €/an | prix repère : 360,79 |
| Fioul TTC | 1,5002 €/L | ~1,50 (moyenne juillet) |
| Granulés sac TTC | 418 €/t | ~418 (relevé mars 2026) |

Tests : 1 306 verts, 57 skippés (état antérieur), golden recalculé en
totalité (187 snapshots — les **unités** sont strictement inchangées).

## 4. Non mis à jour (assumé) et chantiers restants

1. **Refonte coup de pouce** : depuis le 01/01/2026 il n'y a plus de montant
   plancher ; la prime = forfait cumac de la fiche × coefficient (×2 à ×5)
   × valeur CEE. `coup de pouce PAC air-eau` est déjà modélisé ainsi
   (`CEE × 5`) ; reste à convertir RCU (700 €), PAC eau-eau et ECS solaire
   (5 000 €), et à zéroter ou recalculer les planchers conservés.
2. **Grille d'abonnement élec individuelle/collective** : les valeurs
   (« ELCIMAI + TRV 2024 ») ne correspondent pas à la grille TRV brute
   (probablement des surcoûts liés au chauffage) — construction à élucider
   avec ELCIMAI avant toute mise à jour.
3. **TRV au 1er août 2026** : hausse moyenne annoncée de ~2,5 % (base
   +3,1 %) — à répercuter dès la grille publiée.
4. **Décomposition gaz** : molécule et distribution ont été calées sur le
   prix repère TTC ; la décomposition fine (transport/stockage/CEE/
   commercialisation) reste celle de 2024 — à affiner avec l'open data CRE.
5. **Valeur CEE** : cotation EMMY spot (P6 : classique ~8,5-9, précarité
   9-13 €/MWhc) — définir une politique de mise à jour (moyenne mensuelle ?).
6. **Facteurs Base Empreinte** : élec par usage (millésime 2020) vs valeur
   conventionnelle chauffage de la base courante (147 g) — choix
   méthodologique à arbitrer ; gaz/fioul 2023 à revalider contre v23.6.
7. **Coûts d'équipement** : ADEME Coûts EnR&R édition janv. 2025 (données
   2021-2022) disponible pour les PAC ; SDES > 2023 ; catalogues
   constructeurs à rafraîchir via ELCIMAI.
8. **Contenu CO2 direct des réseaux de froid** : millésime 2021, non couvert
   par l'enquête FEDENE 2025 — source à retrouver.
9. **Barème CEE FCU tertiaire** : source à documenter et à confronter à
   l'arrêté en vigueur depuis le 01/01/2026.

## 5. Références consultées

- TRV élec : [Selectra — TRV](https://selectra.info/energie/electricite/prix/trv),
  [Révolution Énergétique — prix au 01/02/2026](https://www.revolution-energetique.com/actus/voici-les-nouveaux-prix-de-lelectricite-au-1er-fevrier-2026/),
  [prix-elec.com — évolutions 2026](https://prix-elec.com/tarifs/evolution/2026)
- Accises : [fournisseurs-electricite.com — accise élec](https://www.fournisseurs-electricite.com/contrat-electricite-gaz/taxes/accise-electricite),
  [Omnegy — accises élec/gaz 2026](https://www.omnegy.com/evolution-accise-electricite-ticfe-et-gaz-ticgn-en-2026/)
- Gaz : [CRE — prix repère](https://www.cre.fr/consommateurs/prix-reperes-et-references/prix-repere-de-vente-de-gaz-naturel-a-destination-des-clients-residentiels.html),
  [CRE — +7,4 % au 01/07/2026](https://www.cre.fr/actualites/toute-lactualite/le-prix-repere-de-vente-de-gaz-augmente-de-74-ttc-au-1er-juillet-2026-soit-une-augmentation-moyenne-de-27-euros-ttc-sur-la-facture-de-juillet.html)
- Granulés : [Selectra — prix pellets](https://selectra.info/energie/bois/granules-pellets/prix),
  [Kelwatt — prix pellets](https://www.kelwatt.fr/prix/pellets-granules-bois)
- Fioul : [lenergeek — relevés juillet 2026](https://lenergeek.com/2026/07/20/prix-fioul-domestique-combien-coutent-1000-fioul-lundi-20-juillet-2026/)
- MaPrimeRénov' : [ANAH — mode d'emploi mars 2026 (PDF)](https://www.anah.gouv.fr/sites/default/files/2026-03/202603-MPR-modeEmploi_WEB.pdf),
  [dpeclair — barème 2026](https://dpeclair.fr/aides/maprimerenov-2026/bareme-tableau-2026/),
  [Kazamea — raccordement réseaux](https://kazamea-energie.com/prime-eco-energie/maprimerenov/quels-travaux/raccordement/),
  [Quotidiag — plafonds 2026](https://www.quotidiag.fr/maprimerenov-et-aides-anah-plafonds-de-ressources-2026/)
- Coup de pouce : [ecologie.gouv.fr](https://www.ecologie.gouv.fr/politiques-publiques/coup-pouce-chauffage),
  [Hellio](https://particulier.hellio.com/blog/financement/coup-pouce-chauffage)
- CEE : [S2EE — baromètre 2026](https://s2ee.fr/barometre-cee-2026.php),
  [Dynamis — prix P6](https://dynamis-energies.fr/prix-des-cee-en-2026-2030-faut-il-vendre-vos-certificats-maintenant-ou-attendre-la-periode-6/)
- Facteurs d'émission : [notre-environnement.gouv.fr](https://www.notre-environnement.gouv.fr/themes/climat/les-emissions-de-gaz-a-effet-de-serre-et-l-empreinte-carbone-ressources/article/les-facteurs-d-emission-de-gaz-a-effet-de-serre),
  [Base Empreinte](https://base-empreinte.ademe.fr/)
- Coûts EnR : [Geothermies — édition janv. 2025](https://www.geothermies.fr/actualites/news/lademe-publie-une-nouvelle-edition-de-son-etude-sur-les-couts-des-energies)
