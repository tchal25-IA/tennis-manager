# Configuration Vercel pour Tennis Manager

Ce projet utilise une architecture monorepo avec deux applications distinctes déployées sur Vercel.

## Projets Vercel requis

### 1. **tennis-manager-api** (Backend)
- **Root Directory**: `backend`
- **Framework Preset**: Other
- **Build Command**: (laissez vide, utilisera vercel.json)
- **Output Directory**: (laissez vide)
- **Install Command**: (laissez vide, utilisera vercel.json)

**Variables d'environnement:**
Aucune variable requise pour le déploiement de base (SQLite embarquée via seed.db).

**Configuration automatique:**
Le fichier `backend/vercel.json` gère:
- Installation des dépendances avec `npm install --include=dev`
- Génération du client Prisma
- Build de l'application NestJS
- Création de la base SQLite pré-seedée (`prisma/seed.db`)
- Configuration de la fonction serverless avec timeout de 60s et 1GB RAM

### 2. **tennis-manager** (Frontend Mobile/Web)
- **Root Directory**: `mobile`
- **Framework Preset**: Other
- **Build Command**: (laissez vide, utilisera vercel.json)
- **Output Directory**: `dist`
- **Install Command**: (laissez vide, utilisera vercel.json)

**Variables d'environnement:**
```
EXPO_PUBLIC_API_URL=https://tennis-manager-api.vercel.app/api
```

**Configuration automatique:**
Le fichier `mobile/vercel.json` gère:
- Installation des dépendances Expo
- Export de l'application pour le web avec `npx expo export --platform web`
- Configuration du SPA routing

## Processus de déploiement

### Configuration initiale (une seule fois)

1. **Créer le projet API sur Vercel:**
   ```bash
   # Via Vercel Dashboard ou CLI
   vercel --scope=VOTRE_TEAM
   # Sélectionner: backend/ comme Root Directory
   ```

2. **Créer le projet Frontend sur Vercel:**
   ```bash
   vercel --scope=VOTRE_TEAM
   # Sélectionner: mobile/ comme Root Directory
   # Ajouter la variable EXPO_PUBLIC_API_URL
   ```

3. **Configurer Git Integration:**
   - Les deux projets doivent pointer vers le même repo GitHub: `tchal25-IA/tennis-manager`
   - Activer "Automatic deployments" pour la branche `main`
   - Les Root Directories doivent être correctement configurées dans les Project Settings

### Déploiements automatiques

Une fois configurés, les projets se déploient automatiquement:
- **Push sur `main`** → Déploiement en production
- **Pull Request** → Preview deployment

### Vérification du déploiement

#### API Backend:
```bash
# Health check
curl https://tennis-manager-api.vercel.app/api

# Test de création de joueur
curl -X POST https://tennis-manager-api.vercel.app/api/player \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","nationality":"FR","height":180,"handedness":"RIGHT"}'
```

#### Frontend:
```bash
# Ouvrir dans le navigateur
open https://tennis-manager-one.vercel.app
```

## Architecture technique

### Backend (NestJS + Prisma + SQLite)

**Fonctionnement de la base de données:**
1. **Build time**: Le script `bake-db.js` crée `prisma/seed.db` avec des données initiales
2. **Runtime**: Le fichier `src/bootstrap-db.ts` copie `seed.db` vers `/tmp/tennis-manager.db` (Vercel permet l'écriture dans /tmp uniquement)
3. Chaque invocation de fonction cold start restaure la DB depuis le snapshot

**Limitations SQLite sur Vercel:**
- ⚠️ La base est recréée à chaque cold start
- ⚠️ Les données ne persistent pas entre les invocations
- ✅ Parfait pour une démo / vertical slice
- 💡 Pour la production: migrer vers PostgreSQL (Supabase, Neon, Vercel Postgres)

### Frontend (Expo + React Native Web)

L'application Expo est exportée en mode web statique et servie comme SPA.

**Configuration réseau:**
- La variable `EXPO_PUBLIC_API_URL` est injectée au build time
- Les appels API utilisent cette URL de base
- CORS est activé côté backend pour tous les origins

## Troubleshooting

### Erreur: "Module not found" pour Prisma
**Solution**: Vérifiez que `includeFiles: "prisma/**"` est dans vercel.json et que le buildCommand exécute `npx prisma generate`.

### Erreur: API retourne 404
**Causes possibles:**
1. Root Directory mal configurée (doit être `backend`)
2. Le rewrites dans vercel.json ne fonctionne pas
3. La fonction n'est pas déployée

**Solution**: Vérifiez les logs de build Vercel et assurez-vous que `api/index.ts` est bien détecté comme fonction.

### Erreur: "seed.db not found"
**Solution**: Le script `bake-db.js` doit s'exécuter dans le buildCommand. Vérifiez les logs de build.

### Frontend ne peut pas se connecter à l'API
**Solution**: Vérifiez que `EXPO_PUBLIC_API_URL` est correctement définie dans les Environment Variables du projet Vercel.

### Database is locked
**Cause**: Concurrence d'écriture sur SQLite dans /tmp
**Solution temporaire**: Accepter les erreurs occasionnelles ou passer à PostgreSQL
**Solution permanente**: Migrer vers Vercel Postgres ou Supabase

## Migration vers PostgreSQL (optionnelle)

Pour une application en production:

1. **Créer une base Postgres** (Supabase, Neon, ou Vercel Postgres)

2. **Mettre à jour le schema.prisma:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Ajouter DATABASE_URL** dans les Environment Variables Vercel:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/tennis_manager
   ```

4. **Adapter le buildCommand** dans vercel.json:
   ```json
   "buildCommand": "npx prisma generate && npx nest build"
   ```
   (Retirer `node scripts/bake-db.js`)

5. **Simplifier bootstrap-db.ts:**
   ```typescript
   export async function ensureDatabase() {
     // DATABASE_URL déjà configurée via env var Vercel
     if (!process.env.DATABASE_URL) {
       throw new Error('DATABASE_URL manquante');
     }
   }
   ```

6. **Exécuter les migrations:**
   ```bash
   # Localement avec DATABASE_URL pointant vers Postgres
   npx prisma db push
   npx prisma db seed
   ```

## Routes API disponibles

Toutes les routes sont préfixées par `/api`:

### Player
- `POST /api/player` - Créer un joueur
- `GET /api/player/:id` - Obtenir un joueur

### Narrative
- `GET /api/narrative/:playerId/current` - Scène narrative actuelle
- `POST /api/narrative/:playerId/resolve` - Résoudre un choix narratif

### Training
- `POST /api/training/:playerId` - Faire un entraînement

### Match
- `POST /api/match/:playerId/play` - Jouer un match

### Career
- `GET /api/career/:playerId/hub` - Hub de carrière (état général)
- `POST /api/career/:playerId/rematch` - Lancer un nouveau match (après slice)

## Support

Pour toute question: ouvrir une issue sur https://github.com/tchal25-IA/tennis-manager
