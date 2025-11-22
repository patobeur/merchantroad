# Space Dealer

Petit jeu de commerce de ressources entre villes, jouable directement dans le navigateur (HTML + JavaScript vanilla, sans framework).  
Le joueur incarne un marchand qui achète et revend des marchandises entre plusieurs villes pour faire fortune.

---

## Fonctionnalités

### ✅ Villes & ressources

-  4 villes de départ : **Ville_A**, **Ville_B**, **Ville_C**, **Ville_D**.
-  10 ressources :
   -  Cacao
   -  Coton
   -  Pierres précieuses
   -  Raisins
   -  Poudre à canon
   -  Métal
   -  Rations
   -  Pimenter
   -  Canne à sucre
   -  Tabac vieilli
-  Pour chaque ville et ressource :
   -  **Quantité en stock**
   -  **Prix d’achat** de la ressource dans cette ville

Les données de départ sont codées en dur dans `defaultWorld` et recopiées dans `localStorage` lors de la création d’une nouvelle partie.

---

### ✅ Joueur

-  Nom : “Marchand”
-  Ville de départ : **tirée au hasard** parmi les villes existantes
-  Commence avec :
   -  **1000 or**
   -  **Cargaison vide**
   -  **Niveau 1**, **0 XP**
-  Gagne de l’XP en **achetant** ou **vendant** des ressources  
   (par exemple : +1 XP par unité échangée)
-  Le **niveau** dépend de l’XP (100 XP par niveau)
-  Le niveau donne un **bonus de réduction sur le coût des voyages** :
   -  Formule actuelle : `réduction = min(0.5, niveau * 0.02)`  
      → 2 % par niveau, max 50 %

---

### ✅ Commerce

-  On ne peut commercer **que dans la ville actuelle** du joueur.
-  Interface :
   -  Choix de la ressource
   -  Choix de la quantité
   -  Boutons **Acheter** / **Vendre**
-  Achat :
   -  Vérification du **stock de la ville**
   -  Vérification de l’**or du joueur**
   -  Mise à jour :
      -  stock ville ↓
      -  cargaison joueur ↑
      -  or joueur ↓
-  Vente :
   -  Vérification de la **cargaison du joueur**
   -  Mise à jour :
      -  stock ville ↑
      -  cargaison joueur ↓
      -  or joueur ↑

Chaque transaction sauvegarde immédiatement la partie dans `localStorage`.

---

### ✅ Voyage entre villes

-  Les villes sont reliées par des **routes** définies dans `defaultWorld.routes`.
-  Pour chaque route :  
   `temps` (durée du trajet en millisecondes) + `cout` (coût de base en or).
-  Dans l’onglet **Voyage**, la liste des destinations possibles depuis la ville actuelle est affichée avec :
   -  Durée estimée (en secondes)
   -  Coût réel = `coutBase * (1 - réductionVoyage)`
-  Un bouton **Voyager** permet de lancer un trajet :
   -  L’or du joueur est débité immédiatement
   -  Le jeu enregistre un objet `voyage` dans l’état :
      -  ville de départ / d’arrivée
      -  durée totale
      -  heure de départ
   -  Une **fenêtre modale** affiche :
      -  texte “Voyage de X vers Y”
      -  **barre de progression** qui se remplit jusqu’à 100 %
   -  Pendant le voyage :
      -  commerce désactivé
      -  lancement d’un `setInterval` qui met à jour la progression
   -  À la fin :
      -  ville actuelle = ville d’arrivée
      -  l’objet `voyage` est effacé
      -  la modale est cachée

Un mécanisme de **sécurité au chargement** vérifie si un voyage sauvegardé est déjà terminé (temps écoulé) et le clôture automatiquement.

---

### ✅ Sauvegarde / chargement

Tout se fait via `localStorage` :

-  Clé utilisée : `merchant_save_v1`
-  Contenu :
   -  configuration des ressources et villes modifiées
   -  état du joueur
   -  éventuel voyage en cours

Interface :

-  **Nouvelle partie**  
   → crée un nouvel état de jeu à partir de `defaultWorld` et écrase la sauvegarde.
-  **Charger la sauvegarde**  
   → lit l’état depuis `localStorage` (si présent).
-  **Effacer la sauvegarde**  
   → supprime la clé de sauvegarde dans `localStorage`.
-  En jeu, bouton **“Sauvegarder la partie”** :  
   → force l’écriture de l’état actuel dans `localStorage`.

---

## Lancer le jeu

### 1. Pré-requis

-  Un simple navigateur moderne suffit (Chrome, Firefox, Edge…).
-  Aucune dépendance, aucun bundler : un seul fichier `index.html`.

### 2. Installation

1. Placer `index.html` dans un dossier.
2. (Optionnel) Lancer un petit serveur local si tu veux le live-reload :

   -  Avec VS Code : extension **Live Server**
   -  Ou en Python :  
      `python -m http.server` (puis ouvrir `http://localhost:8000`)

3. Ouvrir `index.html` dans le navigateur.

---

## Contrôles / UX

-  Depuis **l’écran d’accueil** :
   -  **Nouvelle partie** : commence une partie et initialise la sauvegarde.
   -  **Charger la sauvegarde** : reprend la dernière partie (si elle existe).
   -  **Effacer la sauvegarde** : remet le jeu à zéro.
-  Dans **l’écran de jeu** :
   -  **Panneau Villes** : clic sur une ville → affiche ses stocks/prix (ville sélectionnée).
   -  **Fiche du joueur** : affiche or, niveau, XP, ville actuelle, réduction de coût.
   -  **Cargaison** : liste les ressources possédées par le joueur.
   -  **Ville sélectionnée** : tableau des stocks/prix de la ville choisie.
   -  **Commerce** :
      -  choisir ressource + quantité, cliquer sur **Acheter** ou **Vendre**.
   -  **Voyage** :
      -  cliquer sur un bouton **Voyager** vers une autre ville.
      -  observer la barre de progression.
   -  **Sauvegarder la partie** : enregistre immédiatement dans `localStorage`.
   -  **Retour au menu** : revient à l’écran d’accueil (la partie reste dans `localStorage`).

---

## Structure du code

Tout est dans `index.html` :

-  **HTML** : structure de base (écran d’accueil, écran de jeu, overlay de voyage).
-  **CSS** : style sombre, layout en grille pour le jeu, modale de voyage, barre de progression.
-  **JavaScript** :
   -  `defaultWorld` : configuration initiale des villes, ressources et routes.
   -  `gameState` : état courant (joueur, villes, routes, voyage).
   -  Fonctions principales :
      -  création d’une nouvelle partie (`createNewGameState`)
      -  sauvegarde / chargement (`saveGame`, `loadGameFromStorage`)
      -  rendu de l’UI (`renderPlayerPanel`, `renderCitiesList`, `renderCityDetails`, `renderTradePanel`, `renderTravelPanel`)
      -  gestion du commerce (`doTrade`, `addXp`)
      -  gestion du voyage (`startTravel`, `updateTravelProgress`, `finishTravel`, overlay)

---

## Limites actuelles / pistes d’évolution

-  Pas encore d’**éditeur de carte** (positions des villes en pixel art).
-  Pas encore d’**éditeur de villes / ressources** dans l’interface (modif des prix, quantités, ajout/suppression de villes).
-  Pas de gestion de **difficulté** ni d’objectifs (score, nombre de jours, etc.).
-  Pas de graphique ou d’historique des prix.

Idées pour la suite :

-  Écran “Éditeur” pour :
   -  placer les villes sur une petite carte en pixels,
   -  modifier leurs ressources,
   -  recalculer automatiquement les temps/coûts de voyage selon la distance.
-  Gestion de plusieurs **slots de sauvegarde**.
-  Évènements aléatoires (hausse/baisse des prix, blocage de routes, piraterie, etc.).
-  Tutoriel intégré pour les élèves / joueurs.

---

## Développement

Le projet est volontairement simple pour rester **lisible** et **pédagogique** :

-  Pas de framework,
-  pas de build,
-  DOM manipulé à la main (`createElement`, `textContent`, `addEventListener`),
-  état stocké dans un objet JS unique `gameState`.
