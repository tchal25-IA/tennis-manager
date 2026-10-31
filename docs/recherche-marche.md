# Recherche marché — jeux de management sportif mobile

_Analyse réalisée le 31 octobre 2026 à partir des fiches et avis publics App Store / Google Play._

## Ce que les joueurs recherchent

### Une carrière longue où chaque décision compte

Les promesses qui reviennent dans **Tennis Manager Mobile** et **Top Eleven** sont la construction sur plusieurs saisons, le développement d’un jeune talent, les tournois graduels, le recrutement de staff et les choix tactiques. Les joueurs apprécient la profondeur et le sentiment de faire grandir « leur » joueur ou club, davantage qu’une succession de matchs isolés.

Sources :
- [Tennis Manager Mobile — App Store](https://apps.apple.com/us/app/tennis-manager-mobile/id1296747770)
- [Tennis Manager Mobile — Google Play](https://play.google.com/store/apps/details?id=com.reboundcg.tennismanager)
- [Top Eleven — Google Play](https://play.google.com/store/apps/details?id=eu.nordeus.topeleven.android)

### Une progression visible et compréhensible

L’entraînement, les styles de jeu, le staff et les statistiques créent une bonne boucle quand le joueur comprend :

1. ce que son choix va coûter (fatigue, monnaie) ;
2. quelle statistique va progresser ;
3. comment cette statistique influence le prochain match ;
4. ce qu’une victoire débloque dans la saison.

À l’inverse, les avis de Tennis Manager Mobile dénoncent des instructions opaques et des résultats ressentis comme aléatoires malgré de meilleures statistiques. Tennis Clash suscite la même frustration lorsque les valeurs affichées semblent sans effet.

Sources :
- [Avis Tennis Manager Mobile — Google Play](https://play.google.com/store/apps/details?id=com.reboundcg.tennismanager)
- [Avis Tennis Clash — App Store](https://apps.apple.com/us/app/tennis-clash-sports-stars-game/id1346179411?platform=iphone&see-all=reviews)

### Des matchs courts, lisibles et spectaculaires

Tennis Clash est apprécié pour sa prise en main immédiate, ses animations et ses sessions de quelques minutes. Les jeux de management conservent cette tension avec une simulation visuelle, des moments clés et la possibilité d’ajuster la tactique. Pour Tennis Manager, une timeline animée avec score, adversaire, effet de surface et décisions explicites est un meilleur investissement initial qu’un moteur 3D coûteux.

Source : [Tennis Clash — App Store](https://apps.apple.com/us/app/tennis-clash-sports-stars-game/id1346179411)

### Une raison saine de revenir

Calendrier de saison, entraînement avant le tournoi et récompense quotidienne forment une boucle de retour claire. Top Eleven utilise matchs quotidiens, entraînements et récompenses ; le jeu a aussi documenté une forte amélioration de rétention grâce à des campagnes de réengagement ciblées. La récompense doit toutefois respecter le temps du joueur : elle ne doit ni échouer après une publicité, ni devenir obligatoire pour rester compétitif.

Sources :
- [Top Eleven — Google Play](https://play.google.com/store/apps/details?id=eu.nordeus.topeleven.android)
- [Étude de rétention Top Eleven — Game Developer](https://www.gamedeveloper.com/programming/how-data-scientists-slashed-early-churn-in-top-eleven)

## Plaintes récurrentes à ne pas reproduire

| Irritant | Signal dans les avis | Décision pour Tennis Manager |
|---|---|---|
| Pay-to-win et monnaies multiples | Très fréquent sur Tennis Clash et Top Eleven | Une seule monnaie, aucune mécanique payante dans la boucle |
| Résultats « truqués » ou opaques | Tennis Manager Mobile, Tennis Clash | Afficher effets, fatigue, surface et moments tactiques |
| Trop de pubs / récompenses non créditées | Top Eleven, Tennis Clash | Prime quotidienne immédiate, sans publicité |
| Énergie qui empêche de jouer | Tennis Manager Mobile, Top Eleven | Fatigue stratégique, mais aucun verrou temporel |
| Menus et coffres encombrants | Tennis Clash | Hub unique : prochaine action, calendrier, staff |
| Crashs, connexions perdues, chargements | Tous les titres étudiés | Web jouable, API testée de bout en bout, erreurs explicites |
| Progression trop lente | Tennis Clash | Gains d’entraînement déterministes et visibles |

## Boucle cible

`Prime quotidienne → choix d’entraînement → tournoi du calendrier → 3 décisions tactiques → récompense + classement → semaine suivante`

Une saison compte huit semaines et alterne terre battue, dur et gazon. Le joueur voit le tournoi suivant et peut investir ses gains dans son coach. Le coach améliore les gains d’entraînement, ce qui relie économie, staff, progression et performance.

## Priorisation

1. **P0 — Saison et calendrier persistants** : donne un objectif, du contexte et une continuité à chaque match.
2. **P0 — Entraînement lisible et progression** : conséquences garanties affichées avant validation.
3. **P0 — Match tactique animé** : conserver la timeline existante et l’ancrer dans le tournoi prévu.
4. **P1 — Staff simple mais utile** : trois niveaux de coach, coût clair, bonus déterministe.
5. **P1 — Récompense quotidienne saine** : série plafonnée, sans publicité ni achat.
6. **P2 — Académie, scouting, sponsors, multi-joueurs** : fort potentiel mais trop larges avant validation de la boucle cœur.
7. **À éviter maintenant — PvP et 3D** : coût technique élevé et risques de matchmaking, latence et équilibrage déjà au centre des plaintes concurrentes.

## Indicateurs à instrumenter ensuite

- taux de création de joueur terminée ;
- taux `scènes → premier entraînement → premier match` ;
- nombre de semaines jouées par carrière ;
- répartition des entraînements et tactiques ;
- retour J1/J7 et taux de récupération de la prime ;
- abandons avant/après une défaite.
