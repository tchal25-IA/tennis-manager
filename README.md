# Tennis Manager

Fiction interactive de **gestion de carrière tennis** (inspirée Destiny Eleven).  
Vertical slice Phase 1 : création joueur → 3 scènes → 1 match tactique → récompense.

Produit et architecture **propres à Tennis Manager** (pas calqué sur Quiz Rush).

## Prérequis

- Node.js 20+
- npm

> SQLite en local (zéro Docker). Cible prod ultérieure : PostgreSQL.

## Installation

```bash
cd App-Mobile-LOCAL/tennis-manager
npm run setup
```

Cela installe `backend/` + `mobile/`, pousse le schéma Prisma et seed les 3 scènes FR.

## Lancer en local

**Terminal 1 — API**

```bash
npm run backend:dev
```

API : http://localhost:3001/api

**Terminal 2 — App**

```bash
npm run mobile:start
```

Puis `i` (iOS sim), `a` (Android) ou `w` (web).

### API depuis un téléphone physique

Par défaut l’app pointe vers `http://localhost:3001/api`.  
Sur device, crée `mobile/.env` :

```bash
EXPO_PUBLIC_API_URL=http://IP_DE_TON_MAC:3001/api
```

## Boucle vertical slice

1. **Création** — nationalité, style, origine, surface, main → stats de départ  
2. **Hub** — état carrière + prochain pas  
3. **3 scènes** — coach, rival, sponsor (choix → stats / cash / célébrité)  
4. **Match tactique** — surface + tactique pré-match + moment clé  
5. **Récompense** — cash, célébrité, narratif de fin de slice  

## Structure

```
tennis-manager/
├── backend/          NestJS + Prisma (SQLite)
│   ├── prisma/       schema + seed (3 scènes)
│   └── src/
│       ├── player/
│       ├── narrative/
│       ├── match/
│       └── career/
└── mobile/           Expo + React Native (FR)
    └── src/screens/  Create, Hub, Scene, Match, Reward
```

## Endpoints utiles

| Méthode | Chemin | Rôle |
|---------|--------|------|
| POST | `/api/players` | Créer un joueur |
| GET | `/api/career/:id/hub` | Hub carrière |
| GET | `/api/narrative/:id/current` | Scène courante |
| POST | `/api/narrative/choice` | Résoudre un choix |
| POST | `/api/match/play` | Match tactique + reward |

## Docs

- [`PHASE-0-CADRAGE.md`](PHASE-0-CADRAGE.md) — cadrage MVP validé  
- [`SPECIFICATIONS.md`](SPECIFICATIONS.md) — cahier des charges détaillé  
