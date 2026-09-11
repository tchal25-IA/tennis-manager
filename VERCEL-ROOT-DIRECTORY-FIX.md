# ⚠️ FIX URGENT: Configuration Vercel Root Directory

## 🔴 Problème diagnostiqué

Les déploiements GitHub sont en **ERROR** pour les deux projets car **rootDirectory n'est pas configuré** dans les settings Vercel.

### App (`tennis-manager`)
**Erreur actuelle**: 
```
Error: Unable to resolve module ../../App from /vercel/path0/node_modules/expo/AppEntry.js
```

**Cause**: Vercel build depuis la racine du repo (`/vercel/path0/`) au lieu de `/vercel/path0/mobile/`

**Log déploiement**: `dpl_8YjXDjRKsjeHrex9dXPVkx7j3kzh`

### API (`tennis-manager-api`)
**Erreur actuelle**:
```
sh: line 1: prisma: command not found
Error: Command "prisma generate && nest build && node scripts/bake-db.js" exited with 127
```

**Cause**: 
1. Vercel build depuis la racine au lieu de `backend/`
2. `npm install` (sans `--include=dev`) → Prisma non installé car dans devDependencies

**Log déploiement**: `dpl_C9AXdifGTtwV8359i1A53eH1YmUW`

---

## ✅ Solution: Configurer Root Directory dans Vercel Dashboard

### 1️⃣ Projet `tennis-manager` (App)

**URL Settings**: https://vercel.com/thibauds-projects-528bdc51/tennis-manager/settings

1. Aller dans **Settings** → **General**
2. Section **Build & Development Settings**
3. **Root Directory**: Changer de `.` (ou vide) vers `mobile`
4. Cliquer **Save**

Configuration finale:
```
Root Directory: mobile
Framework Preset: Other (ou laisser Auto-detect)
Build Command: (laisser vide, vercel.json le gère)
Output Directory: dist
Install Command: (laisser vide, vercel.json le gère)
```

### 2️⃣ Projet `tennis-manager-api` (Backend)

**URL Settings**: https://vercel.com/thibauds-projects-528bdc51/tennis-manager-api/settings

1. Aller dans **Settings** → **General**
2. Section **Build & Development Settings**
3. **Root Directory**: Changer de `.` vers `backend`
4. Cliquer **Save**

Configuration finale:
```
Root Directory: backend
Framework Preset: Other (NestJS détection automatique)
Build Command: (laisser vide, vercel.json le gère)
Output Directory: (laisser vide)
Install Command: (laisser vide, vercel.json le gère)
```

⚠️ **Important**: Le `vercel.json` dans `backend/` spécifie déjà `installCommand: "npm install --include=dev"` qui installera correctement Prisma.

---

## 🧪 Validation post-correction

Après avoir configuré les Root Directories:

### 1. Redéployer depuis GitHub
Pusher un nouveau commit sur `main` ou utiliser le bouton "Redeploy" dans Vercel Dashboard.

### 2. Vérifier les logs de build
- App: Doit montrer `Cloning completed` puis `Running "vercel build"` depuis `/vercel/path0/mobile/`
- API: Doit montrer `npm install --include=dev` puis `prisma generate` sans erreur

### 3. Tester les endpoints
```bash
# API Backend
curl https://tennis-manager-api.vercel.app/api/career/test/hub
# Doit retourner 404 (joueur introuvable) et non 502

# App Frontend
curl -I https://tennis-manager-one.vercel.app
# Doit retourner 200 OK
```

---

## 🔄 Alternative: Déploiement manuel CLI (workaround temporaire)

Si l'accès aux settings Vercel est bloqué, déployer manuellement depuis chaque dossier:

```bash
# App
cd mobile
vercel --prod

# API
cd ../backend
vercel --prod
```

Les déploiements manuels CLI spécifient automatiquement le bon contexte de build.

---

## 📊 État actuel vs État désiré

| Aspect | État actuel (❌ ERROR) | État désiré (✅ READY) |
|--------|------------------------|------------------------|
| App rootDirectory | `.` (racine repo) | `mobile` |
| API rootDirectory | `.` (racine repo) | `backend` |
| GitHub deploy app | ERROR (App.tsx not found) | READY |
| GitHub deploy API | ERROR (prisma not found) | READY |
| Prod URLs | 404/502 | Fonctionnels |

---

## 🎯 Checklist finale

- [ ] Configurer Root Directory `mobile` pour projet `tennis-manager`
- [ ] Configurer Root Directory `backend` pour projet `tennis-manager-api`
- [ ] Redéployer depuis GitHub (push sur main ou Redeploy button)
- [ ] Valider logs de build (pas d'erreur prisma ou App.tsx)
- [ ] Tester API: `curl https://tennis-manager-api.vercel.app/api`
- [ ] Tester App: Ouvrir https://tennis-manager-one.vercel.app
- [ ] Valider flow rematch + FR en prod

---

**Dernière mise à jour**: 11 Sep 2026 18:28 UTC  
**Référence déploiements ERROR**:  
- App: `dpl_8YjXDjRKsjeHrex9dXPVkx7j3kzh`  
- API: `dpl_C9AXdifGTtwV8359i1A53eH1YmUW`
