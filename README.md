# Clair — version Discord, OSINT et Utilitaires

Cette version reprend le dossier Clair-Render fourni, notamment son index.html, sa connexion Discord et ses réglages d’apparence. Les anciens outils du menu ont été remplacés.

## Outils

- Discord : Identifiant Discord (date encodée), Invitation de bot (sans permission par défaut).
- OSINT : Recherche de pseudo (liens non vérifiés), Analyse d’adresse e-mail (format et MX, sans confirmation de boîte), Informations réseau (IP ou DNS).
- Utilitaires : Métadonnées de fichier (SHA-256 et EXIF), Informations navigateur, Liste de proxys (format et déduplication uniquement).

Les scripts Python ont servi de référence fonctionnelle. Ils ne sont pas exécutés ou distribués par ce site. Les fonctions de spam, de bruteforce, de connexion par jeton et de destruction de comptes ne sont pas intégrées. L’analyse exhaustive audio, l’extraction de fichiers embarqués et les tests réseau de proxys ne sont pas implémentés.

Les recherches, adresses IP des visiteurs et métadonnées ne sont plus envoyées automatiquement à Discord. L’ancien endpoint de rapports retourne HTTP 410. OAuth demande uniquement identify depuis cette interface. Les requêtes DNS utilisent Google DNS ; la recherche IP envoie seulement l’adresse saisie à GeoJS. Les analyses locales et exports restent dans le navigateur.

## Render

Utiliser un Web Service Node avec la commande de build `npm run build` et la commande de démarrage `npm start`. Conserver les valeurs serveur existantes de DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, SESSION_SECRET et SITE_ORIGIN. Le callback Discord est SITE_ORIGIN suivi de /auth/discord/callback. Ne placer aucun secret dans les fichiers navigateur.

Remplacer les fichiers du projet Render par ceux de cette archive puis déployer. Aucun déploiement distant n’a été effectué depuis cette livraison. Les variables DISCORD_WEBHOOK_* ne sont plus utilisées par l’interface ni l’endpoint de rapports.

## Vérifications

`npm test` : quatre tests réussis (configuration, OAuth, absence de transmission et outils locaux).
`npm run build` : vérification des sources publiques et de syntaxe réussie.
Aucune validation visuelle dans un navigateur ni connexion OAuth réelle effectuée. Les services externes n’ont pas été interrogés pendant les tests.

La bibliothèque EXIF conserve sa licence dans server/EXIFR-LICENSE.txt.
