# Tennis Manager — Phase 0 (cadrage validé)

**Statut :** Phase 0 terminée · **Phase 1 vertical slice livrée** (voir README).

---

## Clarification produit

**Tennis Manager ≠ Quiz Rush.**  
Aucune réutilisation du gameplay, des écrans, du modèle de données métier, ni des flows Quiz Rush.  
La seule référence portefeuille est la **stack imposée** (React Native, NestJS, Prisma, PostgreSQL, Redis, JWT, Sentry) — pas la structure produit d’un autre jeu.

---

## Cadrage MVP (1 page)

### Vision
Fiction interactive de **gestion de carrière tennis** (inspirée Destiny Eleven) : le joueur ne joue pas point à point ; il gère stats, choix narratifs, entraînements, coach/sponsors, et fait des **choix tactiques** en match. Parcours fictionnel : junior (16 ans) → légende.

### Boucle de session cible
**8–12 minutes :** hub carrière → 1 événement narratif → 1 entraînement → 1 match → récompense.

### Must-have MVP

| Bloc | Scope |
|------|--------|
| Création perso | Nationalité, style (Attaquant / Défenseur / Complet), origine sociale, surface préférée, main dominante |
| Stats | Technique, Endurance, Mental (60–100) ; Célébrité (0–100) → sponsors / wildcards |
| Carrière | Arc Junior + début Challenger (pas 4 Grand Chelems complets) |
| Matchs | Choix pré-match + décisions aux moments clés ; résolution : stats × surface × forme × fatigue + 10–15 % aléatoire |
| Narratif | 15–25 scènes branchées (coach, rival, sponsor, blessure, médias) ; impacts stats / moral / cash / célébrité |
| Gestion | Entraînements physique / technique / mental ; 1 coach ; 2–3 sponsors ; ~50–100 cartes (équipement / coups) |
| Social light | Classement async (mondial / amis) ; partage de moments de carrière |

### Hors MVP (V1.1+)
Grand Chelems complets, PvP live, Battle Pass, licence ATP/WTA, 300+ cartes, doubles.

### Modèle & KPIs
- F2P éthique (pas de pay-to-win)
- Cibles : D1 > 40 % · D7 > 20 % · D30 > 10 % ; ~2–3 sessions/jour

### Domaines métier (propres à Tennis Manager)

```text
HubCarriere → MoteurNarratif → Entrainement → MoteurMatchTactique → Recompenses → HubCarriere
```

Modules backend prévus (après GO) : `player`, `career`, `narrative`, `match`, `inventory`, `leaderboard`.  
Schéma DB carrière (Player, Stats, Scene, Choice, Match, Card, Sponsor…) — **aucune** table héritée d’un quiz/duel.

### Emplacement
Projet : ce dossier (`App-Mobile-LOCAL/tennis-manager/`). Aujourd’hui : specs + cadrage uniquement.

---

## 3 options de démarrage (Phase 1)

1. **Vertical slice playable** (recommandé) — création joueur → 3 scènes → 1 match tactique → reward + scaffold monorepo minimal (mobile + API). Priorité fun / feeling (~2–3 jours de setup).
2. **Architecture d’abord** — monorepo + Prisma + JWT + écrans vides. Solide, zéro fun immédiat.
3. **Prototype match seul** — moteur de résolution + UI tactique isolée. Valide le cœur de jeu, ignore carrière/narratif.

---

## Décisions figées pour la Phase 1 (après GO)

| Décision | Choix |
|----------|--------|
| Option de démarrage | **1 — Vertical slice playable** |
| Contenu narratif | **Français uniquement** (MVP slice) |
| Client mobile | **Expo + React Native + TypeScript** |
| Backend | NestJS + Prisma + PostgreSQL (+ Redis quand utile) |
| Indépendance | Architecture et UX **spécifiques Tennis Manager** |

---

## Phase 1 — à lancer uniquement après ton GO

1. Scaffold monorepo Tennis Manager (`mobile/` + `backend/`)
2. Schéma DB carrière + vertical slice : création → 3 scènes → 1 match → reward
3. README + instructions de lancement local

**Attente GO :** réponds **GO** (ou « lance la Phase 1 ») pour démarrer le build.
