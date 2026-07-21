# Historique des versions

Toutes les modifications notables de covoitCDLR sont suivies dans ce fichier.

Le format suit l'esprit de Keep a Changelog, avec des sections simples en francais.

## [1.5.2] - Juillet 2026

### Corrige

- Correction de la fonction Supabase `upsert_technician` quand l'identifiant `id` est ambigu pendant l'ajout d'un-e participant-e.

## [1.5.1] - Juillet 2026

### Corrige

- Les noms et prenoms sont affiches avec une majuscule initiale.
- Les participant-e-s en doublon sont masques a l'affichage.
- L'ajout Supabase reutilise une fiche existante avec meme prenom, nom et telephone.

## [1.5.0] - Juillet 2026

### Ajoute

- Bouton `Ajouter participant-e-s` dans les options.
- Popup de creation de participant-e avec prenom, nom, ville et telephone.
- Ajout partage dans Supabase via une fonction RPC protegee par mot de passe.

## [1.4.11] - Juillet 2026

### Modifie

- Presentation des annonces defilantes au format `Prenom Nom jour/mois message`.

## [1.4.10] - Juillet 2026

### Corrige

- Le bandeau d'annonces reprend son defilement apres fermeture d'une popup de message, notamment sur mobile.

## [1.4.9] - Juillet 2026

### Modifie

- Simplification et reformulation du texte d'aide et de la section `Pour les geeks`.

## [1.4.8] - Juillet 2026

### Corrige

- Redessin de la carte quand une ville personnalisee arrive en temps reel sur mobile.
- Le trace ne retombe plus sur la ville par defaut si une destination modifiee n'a pas encore ses coordonnees.

## [1.4.7] - Juillet 2026

### Ajoute

- Liste deroulante dans la popup d'annonce pour consulter tous les messages actifs.

## [1.4.6] - Juillet 2026

### Ajoute

- Boutons `Fermer` en bas des popups `Aide` et `Options` pour faciliter l'usage mobile.

## [1.4.5] - Juillet 2026

### Modifie

- Reformulation du texte d'aide et du README autour des donnees relatives aux technicien-ne-s.

## [1.4.4] - Juillet 2026

### Modifie

- Separation de `Aide et options` en deux boutons et deux fenetres distinctes.

## [1.4.3] - Juillet 2026

### Ajoute

- Section `Pour les geeks` dans l'aide avec une explication detaillee du fonctionnement de l'application.
- Bouton `Proposer une amelioration` ouvrant un mail vers le contact du projet.

### Modifie

- README mis a jour avec les annonces, la luminosite de carte, les villes personnalisees et le fonctionnement Supabase.

## [1.4.2] - Juillet 2026

### Corrige

- Le bandeau d'annonces defile aussi sur la version mobile.

## [1.4.1] - Juillet 2026

### Corrige

- Les messages sans statut de trajet sont affiches dans le bandeau d'annonces.
- Le bandeau d'annonces reste visible sur mobile avec un message d'attente si aucune annonce active n'est disponible.
- L'enregistrement d'une annonce signale maintenant clairement si le message reste local au lieu d'etre partage via Supabase.

### Modifie

- Le reglage de luminosite de carte est deplace au-dessus de la carte et reste limite aux themes sombres.
- Le bouton mobile de liste affiche `Participant-e-s`.

## [1.4.0] - Juillet 2026

### Ajoute

- Bandeau de messages de covoiturage avec popup de consultation et coordonnees du participant.
- Bouton `Message` pour saisir une recherche ou une proposition en 300 caracteres maximum.
- Ajout de villes personnalisees depuis l'interface avec recherche GPS via `geo.api.gouv.fr`.
- Curseur de luminosite de la carte pour les themes sombres, persistant dans le navigateur.
- Affichage discret du numero de version dans l'en-tete de l'application.

### Modifie

- Les trajets dont la date est passee ne sont plus affiches sur la carte.
- La carte s'ouvrira par defaut sur les retours a partir du 23 juillet 2026.
- Le bandeau de messages affiche les messages actifs des allers et des retours, quel que soit le mode de carte selectionne.
- Le titre de la liste devient `Participant-e-s`.

## [1.0.0] - Juillet 2026

### Ajoute

- Application Vite TypeScript vanilla.
- Carte Leaflet basee sur OpenStreetMap.
- Marqueur du festival a Chalon-sur-Saone.
- Chargement des techniciens depuis Supabase via une fonction RPC securisee.
- Protection d'acces par mot de passe a l'ouverture de la page.
- Liste des participants avec statut de covoiturage.
- Pastilles de participants avec initiales sur la carte.
- Popups participants avec nom, prenom, ville et telephone.
- Gestion des trajets aller et retour.
- Statuts `Propose un covoit` et `Cherche un covoit`.
- Formulaire de renseignement des trajets.
- Villes de depart et d'arrivee modifiables selon le sens du trajet.
- Villes-etapes ajoutables et supprimables.
- Liste enrichie de villes francaises avec coordonnees GPS.
- Traces de trajet en lignes continues colorees par participant.
- Affichage mobile avec bascule `Carte` / `Participants`.
- Fenetre `Aide et options`.
- Themes visuels persistants dans le navigateur.
- Section de credits et liens vers les autres applications.
- Documentation README avec captures d'ecran.

### Corrige

- Chemin des images compatible avec GitHub Pages.
- Coordonnees de Flee pour la commune du code postal 21140.
- Deduplonnage des villes malgre accents, casse, tirets et apostrophes.
- Recalcul Leaflet sur mobile lors du retour a la carte.

### Technique

- Deploiement GitHub Pages via GitHub Actions.
- Configuration Supabase injectee au build par variables GitHub Actions.
- Donnees privees isolees dans `.private/`, ignore par Git.
