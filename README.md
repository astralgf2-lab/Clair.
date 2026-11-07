# Clair Studio — édition 02

## Installation sur le projet existant

1. Extraire l’archive.
2. Dans le dépôt GitHub lié à Render, remplacer les fichiers à la racine par le CONTENU du dossier Clair-Studio (server/, test/, package.json, start.mjs, etc.). Ne pas ajouter un sous-dossier Clair-Studio dans le dépôt.
3. Dans Render, conserver Branch = main, Root Directory vide, Start Command = npm start. Build Command = npm run build (ou yarn install && yarn build si déjà configuré).
4. Conserver DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, SESSION_SECRET et SITE_ORIGIN (ou le domaine Render automatique).
5. Pour les journaux de connexion, ajouter DISCORD_WEBHOOK_LOGIN dans Render uniquement, avec un webhook régénéré. Ne pas publier cette valeur dans GitHub.
6. Déployer le dernier commit puis actualiser le site avec Ctrl+F5. Une reconnexion permet de tester le nouvel accord de partage.

## Nouvelle interface

Accueil à trois univers, catégories fermées par défaut, outils dépliés au clic, recherche clavier Ctrl+K, vue adaptée au mobile, thèmes clair/sombre, mouvement réduit, états de chargement, erreurs explicites, copie et exports texte/JSON. Les analyses restent en mémoire dans l’onglet, sans historique persistant.

## Les 11 outils

### Discord
- Explorer un serveur Discord : informations publiques d’une invitation (nom, description, identifiant, estimations membres/en ligne, salon, expiration et fonctionnalités). Aucun accès aux messages ni aux listes privées de membres.
- Décoder un identifiant Discord : date UTC et locale, ancienneté, worker, processus, séquence, détection de date future. Ne confirme pas l’existence du compte.
- Créer une invitation de bot : choix des permissions explicites, valeur numérique et lien OAuth2. Pas de permission administrateur automatique.

### OSINT
- Analyser une adresse IP : pays, région et ville estimés, ASN, organisation, fournisseur, fuseau et carte au clic.
- Explorer un domaine : A, AAAA, MX, NS, TXT, CAA et SOA, TTL et erreurs partielles ; liens registre et certificats.
- Diagnostiquer une adresse e-mail : format et politiques du domaine (MX, null MX, SPF et DMARC). Ni validation SMTP ni recherche de propriétaire ou de comptes privés.
- Chercher un pseudo public : profils candidats sur cinq plateformes et recherches exactes. Les liens sont explicitement non vérifiés ; aucun faux statut « compte trouvé ».

### Utilitaires
- Inspecter un fichier : type déclaré et signature, taille et date, empreintes SHA-256 et SHA-1, aperçu image et métadonnées EXIF/IPTC/XMP disponibles, GPS et lien carte. Lecture dans un worker, limite 25 Mo, limite de durée. Les PDF/audio reçoivent les empreintes et la signature, pas un décodage complet de leur contenu.
- Décrypter un lien : domaine réel, protocole, chemin, fragment, paramètres, signaux simples et retrait des paramètres de suivi courants. Ne visite pas le lien et ne garantit pas sa sécurité.
- Nettoyer une liste de proxys : normalisation HTTP/HTTPS/SOCKS, ports, doublons, entrées invalides et export propre (500 maximum). Ne teste pas la disponibilité, la vitesse ni l’anonymat.
- Diagnostic du navigateur : écran, fenêtre, langues, fuseau, capacités matérielles exposées, estimation réseau et stockage du site. Aucun accès au système complet.

## Connexion et journaux

OAuth Discord conservé. Une case facultative, non cochée, explique le partage du pseudo, de l’identifiant, de l’e-mail et de l’IP publique avec le salon du propriétaire. Le scope email et la consultation GeoJS de l’IP du visiteur ne sont activés qu’après cet accord. La connexion sans partage reste possible. Un échec de journalisation ne bloque pas l’accès et n’est pas retenté automatiquement. Les recherches et fichiers ne sont pas envoyés au webhook.

L’IP fournie par le navigateur reste une déclaration non vérifiée ; un VPN ou proxy peut modifier l’IP de sortie. Les jetons OAuth ne sont jamais envoyés au webhook. La suppression de la session n’efface pas un journal déjà reçu sur Discord.

## Vérification et limites

- 12 tests automatiques : OAuth/session, consentement et journaux, refus d’accès non connecté aux nouvelles routes, DNS et erreur partielle, MX/SPF/DMARC, invitation publique, identifiant Discord, proxys, URL et signature.
- Build et syntaxe des scripts contrôlés.
- Vérification navigateur sur un serveur d’aperçu local isolé : catégories repliables, recherche, analyse d’identifiant et export proposé. Vérification de largeur mobile à 390 px ; pas de débordement horizontal observé.
- Les requêtes externes sont testées avec des réponses simulées. Aucune connexion OAuth réelle et aucun envoi réel au webhook pendant ces vérifications. Pas de déploiement distant effectué.
- Les services publics peuvent refuser ou limiter les requêtes. Les erreurs sont affichées par outil ; aucune donnée de résultat n’est inventée.
- Le serveur limite les analyses externes à 15 par minute et par utilisateur, en mémoire par instance.

Références API :
- https://docs.discord.com/developers/resources/invite
- https://developers.google.com/speed/public-dns/docs/doh/json

La licence de la bibliothèque EXIF est conservée dans server/EXIFR-LICENSE.txt.
