# Clair sur Render + GitHub

Aucun CMD, aucune installation sur ton PC. Render lance le serveur JavaScript automatiquement.

## Installation conseillée
1. Crée un dépôt GitHub privé. Décompresse Clair-Render.zip et ajoute son contenu à la racine du dépôt : render.yaml et package.json doivent être directement à la racine. Ne téléverse pas le ZIP lui-même. N'ajoute aucun secret au dépôt.
2. Dans Render, choisis New → Blueprint et connecte ce dépôt GitHub.
3. Render lit render.yaml : service Web gratuit, démarrage et clé SESSION_SECRET générée automatiquement. Renseigne DISCORD_CLIENT_ID et DISCORD_CLIENT_SECRET (clé OAuth2, pas token du bot).
4. Attends le déploiement et copie l'adresse HTTPS attribuée par Render. Le nom clairsearch45 est demandé mais l'adresse définitive peut être différente. SITE_ORIGIN est détecté automatiquement via RENDER_EXTERNAL_URL : ne renseigne pas l'ancien domaine Netlify.
5. Dans Discord Developer Portal → application → OAuth2 → Redirects, ajoute l'adresse Render suivie de /auth/discord/callback. Exemple uniquement : https://clairsearch45.onrender.com/auth/discord/callback. Utilise impérativement le domaine réellement attribué.
6. Dans Render → service → Environment, ajoute tes destinations : DISCORD_WEBHOOK_IP, DISCORD_WEBHOOK_DNS, DISCORD_WEBHOOK_DOMAIN, DISCORD_WEBHOOK_URL, DISCORD_WEBHOOK_SEARCH, DISCORD_WEBHOOK_BASE64 et DISCORD_WEBHOOK_PHOTO. Enregistre et redéploie. Un webhook absent n'empêche pas la connexion, mais l'envoi de cet outil échoue explicitement.
7. Ouvre le site, connecte-toi et vérifie une recherche. La transmission est annoncée ; les métadonnées photo nécessitent un accord avant analyse. Le fichier photo reste dans le navigateur.

## Si tu choisis New → Web Service au lieu de Blueprint
Runtime Node, formule Free, Build Command : npm run build, Start Command : npm start, Health Check : /healthz. Dans ce cas, SESSION_SECRET n'est pas généré automatiquement : renseigne une clé aléatoire de 32 octets encodés en hexadécimal (64 caractères) ou Base64. Le parcours Blueprint ci-dessus évite cette étape manuelle.

## Notes
- L'offre gratuite se met en veille après 15 minutes d'inactivité ; la première visite suivante peut être lente.
- Aucun secret n'est inclus. Remplace les clés déjà exposées avant de les utiliser en production.
- Sessions chiffrées, cookies Secure/HttpOnly, durée 8 heures. Les logs envoyés dans Discord y restent jusqu'à suppression manuelle. Pas de suppression automatique.
- L'IP publique déclarée est détectée par GeoJS. L'adresse réseau directe du serveur peut correspondre au proxy Render ; elle n'est pas présentée comme une preuve d'identité.
- Aucun abonnement ni déploiement n'a été effectué depuis cette archive.
- Vérifications locales : npm run build et npm test. OAuth et webhooks testés avec des réponses simulées.

Documentation : https://render.com/docs/blueprint-spec et https://render.com/docs/free
