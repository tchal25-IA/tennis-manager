# Déploiement Railway - API Backend

## 🚂 Option 1: Via Dashboard Railway (Recommandé - 5 min)

### 1️⃣ Créer nouveau projet
1. Aller sur https://railway.app/new
2. **Deploy from GitHub repo**
3. Sélectionner `tchal25-IA/tennis-manager`
4. Autoriser Railway à accéder au repo

### 2️⃣ Configurer le service API

**Service Settings**:
```
Name: tennis-manager-api
Root Directory: backend
Builder: Dockerfile
```

**Variables d'environnement**:
```
NODE_ENV=production
PORT=3001
```

**Optionnel - Postgres** (pour persistence):
```
1. Ajouter Postgres depuis Railway Dashboard
2. Railway auto-configure DATABASE_URL
3. Ajuster schema.prisma pour PostgreSQL
```

### 3️⃣ Déployer

Railway détecte automatiquement `backend/Dockerfile` et build.

**URL générée**: `https://tennis-manager-api-production-xxxx.up.railway.app`

### 4️⃣ Vérifier
```bash
# Health check
curl https://YOUR-RAILWAY-URL.up.railway.app/api

# Test création joueur
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/player \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Player","nationality":"FR","playStyle":"ALLROUND","socialOrigin":"MIDDLE","preferredSurface":"CLAY","dominantHand":"RIGHT"}'
```

---

## 🚂 Option 2: Via Railway CLI

### Installation CLI
```bash
npm i -g @railway/cli
railway login
```

### Déploiement
```bash
cd backend
railway init
railway up
```

Railway détecte le Dockerfile et déploie automatiquement.

### Obtenir l'URL
```bash
railway domain
# Ou dans Dashboard → Settings → Domains
```

---

## 📱 Mise à jour Frontend

Une fois l'API Railway déployée, mettre à jour le frontend:

**Fichier `mobile/.env.production`**:
```
EXPO_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api
```

**Build frontend pour Vercel**:
Le `vercel.json` dans mobile/ utilisera cette variable au build.

---

## 🗄️ Base de données

### SQLite (Par défaut - Demo)
Le Dockerfile bake `prisma/seed.db` qui est utilisé au runtime.
⚠️ Données non persistantes entre redéploiements.

### PostgreSQL (Production - Recommandé)

**1. Ajouter Postgres dans Railway**
```
Dashboard → Add Service → Postgres
```

Railway auto-configure `DATABASE_URL`.

**2. Adapter schema.prisma**
```prisma
datasource db {
  provider = "postgresql"  // au lieu de sqlite
  url      = env("DATABASE_URL")
}
```

**3. Retirer bake-db.js du Dockerfile**
```dockerfile
# Commenter cette ligne:
# RUN node scripts/bake-db.js || echo "Bake DB skipped"
```

**4. Ajouter migration au démarrage**
Créer `backend/scripts/railway-start.sh`:
```bash
#!/bin/sh
npx prisma db push --accept-data-loss
npx prisma db seed
node dist/src/main.js
```

Mettre à jour Dockerfile CMD:
```dockerfile
CMD ["sh", "scripts/railway-start.sh"]
```

---

## ⚙️ Configuration Dockerfile

Le Dockerfile fourni:
- Base: Node 22 Alpine (léger)
- Install deps avec `--include=dev` (Prisma)
- Generate Prisma client
- Build NestJS
- Bake seed.db (SQLite fallback)
- Expose port 3001
- CMD: `node dist/src/main.js`

---

## 🧪 Test complet

```bash
# Après déploiement Railway
export API_URL="https://YOUR-RAILWAY-URL.up.railway.app/api"

# Test E2E
cd backend
API_URL=$API_URL node scripts/test-e2e.js
```

---

## 🔄 Comparaison Vercel vs Railway

| Aspect | Vercel | Railway |
|--------|--------|---------|
| Setup | Root Directory manuel | Auto-détecte Dockerfile |
| Database | SQLite temporaire /tmp | Postgres natif |
| Build | Serverless functions | Container Docker |
| Deploy time | ~1-2 min | ~2-3 min |
| Cold start | Oui (serverless) | Non (always-on) |
| Prix | Gratuit (hobby) | $5/mois après trial |

**Recommandation**: Railway pour API backend avec Postgres, Vercel pour frontend Expo static.

---

## 📋 Checklist déploiement Railway

- [x] Dockerfile créé (`backend/Dockerfile`)
- [x] railway.json configuré
- [ ] Créer projet Railway depuis GitHub
- [ ] Configurer Root Directory `backend`
- [ ] (Optionnel) Ajouter Postgres
- [ ] Déployer et obtenir URL
- [ ] Tester `/api` endpoint
- [ ] Mettre à jour `mobile/.env.production`
- [ ] Valider flow complet (rematch + FR)

---

**Documentation complète**: Voir `RAILWAY-DEPLOY.md`
