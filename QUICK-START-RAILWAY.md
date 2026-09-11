# 🚂 Quick Start: Déploiement Railway (5 minutes)

## Étape 1: Créer le projet Railway

1. Aller sur **https://railway.app/new**
2. Cliquer **"Deploy from GitHub repo"**
3. Si premier usage: Autoriser Railway à accéder à GitHub
4. Sélectionner `tchal25-IA/tennis-manager`

## Étape 2: Configurer le service

Railway détecte automatiquement que c'est un monorepo.

**Configuration**:
- **Service Name**: `tennis-manager-api`
- **Root Directory**: `backend` ⚠️ IMPORTANT
- **Builder**: Dockerfile (auto-détecté depuis `backend/Dockerfile`)

Cliquer **"Deploy"**

## Étape 3: Attendre le build (~2-3 min)

Railway va:
1. Cloner le repo
2. Naviguer vers `backend/`
3. Builder le Dockerfile
4. Déployer le container

Suivre les logs en temps réel dans le Dashboard.

## Étape 4: Obtenir l'URL de production

Une fois déployé (statut READY):

1. Aller dans **Settings** → **Networking** → **Public Networking**
2. Cliquer **"Generate Domain"**
3. Copier l'URL: `https://tennis-manager-api-production-xxxx.up.railway.app`

## Étape 5: Tester l'API

```bash
# Remplacer YOUR-RAILWAY-URL par l'URL générée
export API_URL="https://YOUR-RAILWAY-URL.up.railway.app"

# Health check
curl $API_URL/api

# Créer un joueur
curl -X POST $API_URL/api/player \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Lucas",
    "lastName": "Martin",
    "nationality": "FR",
    "playStyle": "ALLROUND",
    "socialOrigin": "MIDDLE",
    "preferredSurface": "CLAY",
    "dominantHand": "RIGHT"
  }'

# Si le joueur est créé avec succès, l'API fonctionne! ✅
```

## Étape 6: Pointer le frontend Expo vers Railway

### Option A: Via Vercel Dashboard (pour frontend déployé)

1. Aller sur https://vercel.com/thibauds-projects-528bdc51/tennis-manager/settings/environment-variables
2. Ajouter variable:
   - **Name**: `EXPO_PUBLIC_API_URL`
   - **Value**: `https://YOUR-RAILWAY-URL.up.railway.app/api`
   - **Environments**: Cocher tous (Production, Preview, Development)
3. Redéployer le frontend depuis Vercel Dashboard

### Option B: Test local

```bash
cd mobile
echo "EXPO_PUBLIC_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api" > .env.production
npm run web
```

## Étape 7: Valider le flow complet

1. Ouvrir l'app (Vercel ou local)
2. Créer un joueur
3. Jouer 3 scènes narratives (FR)
4. Faire un entraînement (5 choix)
5. Jouer un match tactique
6. Vérifier les stats dans le hub
7. **Tester le rematch** ✅

Si tout fonctionne: **Production débloquée!** 🎉

---

## 🔧 Troubleshooting

### Le build échoue
- Vérifier que Root Directory est bien `backend`
- Consulter les logs Railway pour l'erreur exacte

### L'API ne répond pas (502)
- Attendre 30s après "READY" (cold start initial)
- Vérifier que le port est bien 3001 dans le Dockerfile
- Consulter les logs runtime dans Railway Dashboard

### Frontend ne peut pas se connecter
- Vérifier que `EXPO_PUBLIC_API_URL` contient l'URL Railway complète avec `/api`
- Vérifier les CORS: l'API NestJS accepte tous les origins par défaut

---

## 💡 Bonus: Ajouter Postgres (optionnel)

Pour persister les données entre déploiements:

1. Dans Railway Dashboard → **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway auto-configure la variable `DATABASE_URL`
3. Adapter `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Redéployer Railway (il détecte le changement et rebuild)

---

**Temps total**: ~5-10 minutes pour une API production live! 🚀
