# Héberger Clair sur Netlify

Ce dossier est la version Netlify complète, sans fichier CMD et sans serveur à démarrer sur ton PC. Netlify exécute les fonctions JavaScript côté serveur. La connexion Discord et les rapports utilisent une Netlify Function. Aucun token de bot n’est nécessaire. Le design et les outils sont conservés.

## Secrets et outils F12

Le HTML, le CSS et le JavaScript de l’interface restent visibles dans le navigateur : bloquer F12 ne les protège pas. Les webhooks, la clé OAuth et la clé de session restent dans les variables Netlify côté Functions. Aucun token de bot n’est requis ni inclus. Ne colle aucun secret dans le HTML ou le JavaScript de l’interface. Le build vérifie les fichiers navigateur et refuse les formats courants de tokens et webhooks ; ce contrôle ne remplace pas une revue des modifications.

Le token de bot, la clé OAuth et les webhooks précédemment partagés doivent être réinitialisés ou remplacés depuis Discord. Ajoute uniquement les nouvelles valeurs utiles dans Netlify. Retirer un secret du code ne révoque pas les copies déjà exposées.

Le domaine par défaut est https://clairsearch45.netlify.app, configuré dans server/config.mjs. SITE_ORIGIN est facultatif pour ce domaine et permet de le remplacer si nécessaire. Aucun domaine n’est réservé par cette archive.

## 1. Créer le projet

Décompresse l’archive. Mets le contenu de ce dossier dans un dépôt GitHub privé, puis importe ce dépôt dans Netlify avec **Add new project → Import an existing project**. Ne mets jamais de secrets dans le dépôt.

Les réglages sont dans `netlify.toml` : commande de build `npm run build`, dossier publié `public`, fonctions `netlify/functions`, Node 22. Le premier déploiement peut afficher une erreur de configuration tant que les variables ci-dessous ne sont pas renseignées.

Le simple glisser-déposer de fichiers HTML sur Netlify Drop ne déploie pas ce serveur. Utilise l’import Git ci-dessus ou la CLI Netlify (`npx netlify-cli login`, `npx netlify-cli init`, puis `npx netlify-cli deploy --build --prod`) depuis ce dossier après configuration.

## 2. Renseigner les variables d’environnement

Dans la configuration du projet Netlify, ouvre **Environment variables**. Ajoute ces variables au contexte Production, avec accès aux **Functions** (ou tous les scopes). Le fichier `.env.example` contient les noms, sans secrets. Ne le publie pas comme fichier de configuration rempli.

| Variable | Valeur |
| --- | --- |
| `SITE_ORIGIN` | L’adresse définitive, par exemple `https://clairsearch45.netlify.app`, sans `/` à la fin |
| `DISCORD_CLIENT_ID` | L’identifiant de ton application Discord |
| `DISCORD_CLIENT_SECRET` | La clé secrète OAuth2 de cette application, pas le token du bot |
| `SESSION_SECRET` | Une nouvelle clé aléatoire de 64 caractères hexadécimaux |
| `DISCORD_WEBHOOK_IP` | Webhook IP |
| `DISCORD_WEBHOOK_DNS` | Webhook DNS |
| `DISCORD_WEBHOOK_DOMAIN` | Webhook informations de domaine |
| `DISCORD_WEBHOOK_URL` | Webhook URL |
| `DISCORD_WEBHOOK_SEARCH` | Webhook recherche avancée |
| `DISCORD_WEBHOOK_BASE64` | Webhook encodeur |
| `DISCORD_WEBHOOK_PHOTO` | Webhook métadonnées photo |

Pour générer SESSION_SECRET sur ton ordinateur avec Node :

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Garde cette clé dans Netlify. Sa modification invalide toutes les connexions existantes. Une destination non configurée affiche une erreur d’envoi sans bloquer la recherche. Les valeurs privées de ton installation locale ne sont pas copiées dans cette archive. Remplace les secrets précédemment partagés dans le chat avant une mise en ligne.

## 3. Configurer la redirection Discord

Dans Discord Developer Portal → ton application → OAuth2 → Redirects, ajoute exactement :

```text
https://clairsearch45.netlify.app/auth/discord/callback
```

Cette redirection correspond au domaine préconfiguré. Si tu utilises un autre domaine, définis SITE_ORIGIN et adapte cette redirection. Enregistre. Redéploie le site dans Netlify après avoir renseigné les variables. Les domaines de previews ne sont pas acceptés : ouvre le domaine principal configuré. Si tu changes de domaine, modifie SITE_ORIGIN et la redirection Discord ensemble.

## 4. Vérifier

Ouvre le site, clique sur Connecte-toi, accepte l’association annoncée puis autorise Discord. Essaie une recherche et vérifie le salon correspondant. Pour une photo, coche l’accord avant l’analyse : seules les métadonnées sont envoyées, jamais l’image.

En local, `npm run build` et `npm test` vérifient le code et un parcours OAuth simulé entre différentes instances, sans contacter Discord. La validation finale avec ton domaine et ton compte doit être faite après déploiement.

## Fonctionnement et limites

- Sessions de 8 heures dans un cookie chiffré AES-GCM, HttpOnly, Secure, SameSite=Lax. Aucun jeton OAuth conservé. La déconnexion efface le cookie du navigateur ; elle n’invalide pas une copie qui aurait été volée avant son expiration. Change SESSION_SECRET pour invalider toutes les sessions.
- Les scripts des outils et les API restent protégés par la session. Les fichiers serveur et les variables ne sont pas exposés par les routes publiques.
- Les rapports incluent l’IP publique déclarée via GeoJS et l’adresse de connexion fournie par Netlify. Ils sont annoncés avant connexion ; les photos nécessitent un accord explicite avant analyse. Un VPN peut masquer l’adresse d’origine.
- Une limite Netlify de 120 requêtes par minute et par IP est déclarée pour la fonction, y compris les fichiers de l’interface. Les recherches utilisent les fournisseurs existants.
- La prévention des doublons de rapports reste limitée à chaque instance de fonction : pas de garantie entre instances ou redémarrages. Aucun renvoi automatique après un résultat incertain.
- Les messages restent dans Discord jusqu’à leur suppression par les personnes ayant les droits nécessaires. Le site ne supprime pas ces messages automatiquement.
- Le trafic utilise les quotas Netlify Functions. Cette archive prépare le déploiement ; aucun site n’a été publié ni aucun abonnement souscrit.

Documentation : https://docs.netlify.com/build/functions/api/ et https://docs.netlify.com/build/configure-builds/file-based-configuration/
