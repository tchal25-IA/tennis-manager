# Tennis Manager

Fiction interactive de **gestion de carrière tennis** (inspirée Destiny Eleven).  
Vertical slice : création joueur → 3 scènes → 1 match tactique → récompense.

## Liens

| | URL |
|--|-----|
| **App web (live)** | https://amino-prospective-fourth-ebony.trycloudflare.com |
| **App web (Vercel)** | https://tennis-manager-one.vercel.app (ancien build — Git deploy KO) |
| **Worker CF preview** | https://tennis-manager.invited-iguanadon-ddd.workers.dev |
| **API** | https://tennis-manager-api.vercel.app/api |
| **GitHub** | https://github.com/tchal25-IA/tennis-manager |

## Déploiement

| Couche | Plateforme | Notes |
|--------|------------|--------|
| App web (Expo) | **Vercel** | Jouable dans le navigateur |
| API (NestJS) | **Vercel** | Serverless + SQLite seedée (`/tmp`) |
| Code | **GitHub** | Repo dédié `tchal25-IA/tennis-manager` |

> SQLite sur Vercel convient au vertical slice (demo). Pour une prod durable : PostgreSQL (Supabase/Neon).

## Local

```bash
npm run setup
npm run backend:dev   # http://localhost:3001/api
npm run mobile:start  # Expo
```

## Structure

```
tennis-manager/
├── backend/   NestJS + Prisma
└── mobile/    Expo + React Native (web/iOS/Android)
```

Voir [`PHASE-0-CADRAGE.md`](PHASE-0-CADRAGE.md), [`SPECIFICATIONS.md`](SPECIFICATIONS.md) et [`DEMARRER.md`](DEMARRER.md) (reprise Mac / iPhone Cursor).

## Déploiement Cloudflare Worker (preview)

Stack autonome (front Expo + API in-memory) :

```bash
cd mobile && EXPO_PUBLIC_API_URL=/api npx expo export --platform web
rm -rf ../deploy/cf-worker/assets && cp -a dist ../deploy/cf-worker/assets
cd ../deploy/cf-worker && npx wrangler deploy --temporary
```

Claim preview account: see wrangler output `Claim URL`.
