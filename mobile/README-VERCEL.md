# Frontend App - Configuration Vercel

## ⚙️ Configuration requise dans Vercel Dashboard

**URL Settings**: https://vercel.com/thibauds-projects-528bdc51/tennis-manager/settings

### Build & Development Settings

```
Root Directory: mobile
Framework Preset: Other (Expo n'est pas auto-détecté)
Node.js Version: 22.x
Build Command: (laisser vide - géré par vercel.json)
Output Directory: dist
Install Command: (laisser vide - géré par vercel.json)
```

### Variables d'environnement (REQUIS)

```
EXPO_PUBLIC_API_URL=https://tennis-manager-api.vercel.app/api
```

⚠️ **Important**: Cette variable doit être définie dans Vercel Dashboard → Settings → Environment Variables pour tous les environnements (Production, Preview, Development).

## 🔨 Build Process

Le fichier `vercel.json` gère automatiquement:

1. **Installation**: `npm install --include=dev`
2. **Export Expo**: `npx expo export --platform web`
3. **Output**: `dist/` (SPA statique)

## 🧪 Test local

```bash
cd mobile

# Setup
npm install

# Dev
npm run web

# Build test
npx expo export --platform web
# Servir dist/
npx serve dist
```

## 🌐 Configuration réseau

L'app utilise `EXPO_PUBLIC_API_URL` pour tous les appels API:

```typescript
// src/api.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';
```

En local: `.env` pointe vers `http://localhost:3001/api`  
En prod: Variable Vercel pointe vers `https://tennis-manager-api.vercel.app/api`

## 📱 Écrans disponibles

- **CreateScreen**: Création joueur (stats initiales)
- **HubScreen**: Hub carrière (progression, stats)
- **SceneScreen**: Scènes narratives FR (3 scènes)
- **TrainingScreen**: Entraînements spécialisés (5 types)
- **MatchScreen**: Match tactique (choix stratégiques)
- **RewardScreen**: Résultat + récompenses

## ⚠️ Troubleshooting

### "Unable to resolve module ../../App"
→ Vérifier que Root Directory est `mobile` dans Vercel settings  
→ Le build doit s'exécuter depuis `/vercel/path0/mobile/`, pas `/vercel/path0/`

### API retourne 404/CORS
→ Vérifier que `EXPO_PUBLIC_API_URL` est définie dans Vercel  
→ Vérifier que l'API backend est bien déployée

### "Module not found" pour Expo
→ Vérifier que `installCommand` installe toutes les deps Expo

Voir `VERCEL-DEPLOY.md` pour guide complet.
