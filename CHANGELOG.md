# Historique des versions

Toutes les modifications notables de covoitCDLR sont suivies dans ce fichier.

Le format suit l'esprit de Keep a Changelog, avec des sections simples en francais.

## [1.1.0] - Juillet 2026

### Ajoute

- Bandeau de messages de covoiturage avec popup de consultation et coordonnees du participant.
- Bouton `Message` pour saisir une recherche ou une proposition en 300 caracteres maximum.
- Ajout de villes personnalisees depuis l'interface avec recherche GPS via `geo.api.gouv.fr`.
- Affichage discret du numero de version dans l'en-tete de l'application.

### Modifie

- Les trajets dont la date est passee ne sont plus affiches sur la carte.
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
