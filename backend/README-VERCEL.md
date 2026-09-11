# Backend API - Configuration Vercel

## ⚙️ Configuration requise dans Vercel Dashboard

**URL Settings**: https://vercel.com/thibauds-projects-528bdc51/tennis-manager-api/settings

### Build & Development Settings

```
Root Directory: backend
Framework Preset: NestJS (auto-détecté) ou Other
Node.js Version: 22.x (requis pour Prisma 6.x)
Build Command: (laisser vide - géré par vercel.json)
Output Directory: (laisser vide)
Install Command: (laisser vide - géré par vercel.json)
```

### Variables d'environnement

Aucune variable requise pour le déploiement de base (SQLite embarquée via `prisma/seed.db`).

Pour PostgreSQL en production (optionnel):
```
DATABASE_URL=postgresql://user:pass@host:5432/tennis_manager
```

## 🔨 Build Process

Le fichier `vercel.json` gère automatiquement:

1. **Installation**: `npm install --include=dev` (installe Prisma)
2. **Prisma**: `npx prisma generate` (génère le client)
3. **NestJS**: `npx nest build` (compile TypeScript)
4. **Seed DB**: `node scripts/bake-db.js` (crée `prisma/seed.db` pré-peuplée)

## 🧪 Test local

```bash
cd backend

# Setup
npm install
npm run bake:db

# Dev
npm run start:dev

# Test
curl http://localhost:3001/api
```

## 📡 Routes API

Toutes préfixées par `/api`:

- `POST /api/player` - Créer joueur
- `GET /api/career/:playerId/hub` - Hub carrière
- `POST /api/career/:playerId/rematch` - Nouveau match
- `GET /api/narrative/:playerId/current` - Scène narrative
- `POST /api/narrative/choice` - Résoudre choix
- `POST /api/training/do` - Entraînement
- `POST /api/match/play` - Jouer match

## ⚠️ Troubleshooting

### "prisma: command not found"
→ Vérifier que `installCommand` dans vercel.json inclut `--include=dev`

### "seed.db not found" 
→ Vérifier que le buildCommand exécute `node scripts/bake-db.js`

### "The table Player does not exist"
→ La DB SQLite n'a pas été créée correctement au build time

Voir `VERCEL-DEPLOY.md` pour guide complet.
