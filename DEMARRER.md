# Reprendre Tennis Manager (Mac / iPhone Cursor)

## Repo

- **Nom :** `tennis-manager`
- **URL :** https://github.com/tchal25-IA/tennis-manager
- **App :** https://tennis-manager-one.vercel.app
- **API :** https://tennis-manager-api.vercel.app/api

## Sur Mac (Cursor Desktop)

1. `git clone https://github.com/tchal25-IA/tennis-manager.git`
2. Ouvre le dossier dans Cursor (**File → Open Folder**)
3. Nouveau chat Agent → colle `PROMPT.md` si tu démarres à froid
4. Local : `npm run setup` puis `npm run backend:dev` + `npm run mobile:start`

Tu peux aussi : **New Agent → From GitHub Repo** → `tchal25-IA/tennis-manager`.

## Sur iPhone (app Cursor)

1. Connecte le même compte Cursor / GitHub
2. Ouvre le projet **depuis GitHub** (`tennis-manager`)
3. Les agents cloud travaillent sur le repo distant (pas besoin du dossier local Mac)
4. Pour jouer : Safari → https://tennis-manager-one.vercel.app

> L’app iPhone Cursor pilote surtout le code via agents cloud. Le build Expo natif iOS reste sur Mac (Xcode / EAS). Le vertical slice web est jouable sur iPhone via Safari.
