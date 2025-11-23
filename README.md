# Space Dealer

Petit jeu de commerce de ressources entre planetes, jouable directement dans le navigateur (HTML + JavaScript vanilla, sans framework).  
Le joueur incarne un marchand qui achète et revend des marchandises entre plusieurs planetes pour faire fortune.
il monte en niveau et pourras acheter un autre vaisseau avec de l'or.

---

## Fonctionnalités

### ✅ planetes & ressources

## planetes / stations (monde SF)

pour l'instant seulement 5

1. **Nébuloport Sigma**
2. **Cité-Anneau d’Helios**
3. **Kryon Prime**
4. **Bazar d’Orbital-9**
5. **Nova-Zéphyr**
6. **Colonnie de Vanta IX**
7. **Dôme de Lumenia**
8. **Astreport Miridal**
9. **Spatio-Havre d’Ydris**
10.   **Cité-Forge d’Obsidia**
11.   **Plateforme Draconis-Delta**
12.   **Port-Brume d’Aurora-3**
13.   **Caravansérail d’Axion**
14.   **Colonie-Ruche de Sélénith**
15.   **Station Libre de Tesseract**
16.   **Arcologie d’Ultravion**
17.   **Hub Quantique de Myrr IX**
18.   **Cité-Nexus d’Azkar**
19.   **Chantier Orbital de K-47**
20.   **Port-Nébuleuse d’Elara**

---

## Ressources à marchander

Les planete devrait avoir chacune 2 à 3 ressources principale quelles produisent et en tout 8 ressources.

### Métaux & minerais futuristes

-  Fer d’astéroïde brut
-  Titane stellaire
-  Iridium noir
-  Néonium cristallisé
-  Alliage quantique Q-17
-  Poussière de comète raffinée
-  Obsidium synthétique
-  Plasma solide

### Énergies & carburants

-  Cristaux d’hyperflux
-  Noyaux d’antimatière stabilisée
-  Cellules à fusion froide
-  Gaz solaire compressé
-  Batteries à flux sombre
-  Essence de trou noir

### Biotech & organique

-  Algues nutritives d’Ultravion
-  Sérum régénérant alpha
-  Gênes de xéno-faune
-  Épices psychotropes de Myrr IX
-  Graines stellaires terraformantes
-  Carne synthétique premium

### Technologie & données

-  Modules cybernétiques militaires
-  Circuits neuraux liquides
-  Datacubes cryptés
-  IA de contrebande « boîte noire »
-  Matrices holo-divertissement
-  Nanodrones utilitaires

### Marchandises exotiques & luxe

-  Tapis gravitationnels
-  Bijoux de cristaux chantants
-  Parfums de brume astrale
-  Art fractal luminescent
-  Reliques pré-humaines
-  Animaux de compagnie holographiques

-  Pour chaque ville et ressource :
   -  **Quantité en stock**
   -  **Certainne ressources locales sont produitent toutes les 15 minutes si un stock min est atteint**
   -  **Prix d’achat** de la ressource dans cette ville en fonction des stock
   -  **Prix de vente** de la ressource dans cette ville en fonction des stock
   -  **position dans l'espace**
   -  etc...

Les données de départ sont codées en dur dans `defaultWorld` et recopiées dans `localStorage` lors de la création d’une nouvelle partie.
a l'avenir le tout sera dans des table php et chaque ville auras sa fiches avec nom, chaque ressources, stock, prix par ressources, taux de production, position x,y,z, etc....
ville et ressources auront une table pivot.

---

### ✅ Joueur

-  Nom : “Billy bob”
-  Planete de départ : **tirée au hasard** parmi les Planetes existantes
-  Commence avec :
   -  **1000 or**
   -  **Cargaison vide**
   -  **Niveau 1**, **0 XP**
   -  **Vaisseau cargot categorie Niveau 1**, **3 emplacement de stockage (100 unité par emplacement)**
-  Gagne de l’XP en **achetant** ou **vendant** des ressources  
   (par exemple : +1 XP par unité échangée)
-  Le **niveau** dépend de l’XP (100 XP par niveau)
-  Le niveau donne un **bonus de réduction sur le coût des voyages** :
   -  Formule actuelle : `réduction = min(0.5, niveau * 0.02)`  
      → 2 % par niveau, max 50 %

---

### ✅ Commerce

-  On ne peut commercer **que dans la Planete actuelle** du joueur.
-  Interface :
   -  Choix de la ressource
   -  Choix de la quantité
   -  Boutons **Acheter** / **Vendre** / **max (met a jour le champs avec le max achetable)**
-  Achat :
   -  Vérification du **stock de la ville**
   -  Vérification de l’**or du joueur**
   -  Vérification de l’**espace de stockage disponible du joueur**
   -  Mise à jour :
      -  stock Planete ↓
      -  cargaison joueur ↑
      -  or joueur ↓
-  Vente :
   -  Vérification de la **cargaison du joueur**
   -  Mise à jour :
      -  stock Planete ↑
      -  cargaison joueur ↓
      -  or joueur ↑

Chaque transaction sauvegarde immédiatement la partie en base de données.

---

### ✅ Voyage entre Planete

-  Les Planetev sont reliées par des **routes** définies dans `defaultWorld.routes`.
-  Pour chaque route :  
   `temps` (durée du trajet en millisecondes) + `cout` (coût de base en or).
-  Dans l’onglet **Voyage**, la liste des destinations possibles depuis la ville actuelle est affichée avec :
   -  Durée estimée (en secondes)
   -  Coût réel = `coutBase * (1 - réductionVoyage)`
-  Un bouton **Voyager** permet de lancer un trajet :
   -  L’or du joueur est débité immédiatement
   -  Le jeu enregistre un objet `voyage` dans l’état :
      -  Planete de départ / d’arrivée
      -  durée totale
      -  heure de départ
   -  Une **fenêtre modale** affiche :
      -  texte “Voyage de X vers Y”
      -  **barre de progression** qui se remplit jusqu’à 100 %
   -  Pendant le voyage :
      -  commerce désactivé
      -  lancement d’un `setInterval` qui met à jour la progression
   -  À la fin :
      -  Planete actuelle = Planete d’arrivée
      -  l’objet `voyage` est effacé
      -  la modale est cachée

Un mécanisme de **sécurité au chargement** vérifie si un voyage sauvegardé est déjà terminé (temps écoulé) et le clôture automatiquement.

---

### ✅ Sauvegarde / chargement

Tout se fait via une base de données MySQL et une API PHP.

-  **Nouvelle partie**  
   → crée un nouvel état de jeu à partir de `defaultWorld`
-  **Charger la sauvegarde**  
   → lit l’état depuis la base de données.
-  **Effacer la sauvegarde**  
   → supprime la sauvegarde de la base de données.
-  En jeu, bouton **“Sauvegarder la partie”** :  
   → force l’écriture de l’état actuel dans la base de données.

---

## Lancer le jeu

### 1. Pré-requis

- Un navigateur moderne (Chrome, Firefox, Edge…).
- Un serveur web local avec PHP et MySQL.

### 2. Installation

1.  **Configurer le serveur web**
    -   Assurez-vous que votre serveur web (par exemple, Apache ou Nginx) est en cours d'exécution et configuré pour servir des fichiers PHP.
2.  **Configurer la base de données**
    -   Créez une nouvelle base de données MySQL nommée `merchant_game`.
    -   Copiez `php/config.php.example` vers `php/config.php` et mettez à jour les informations de connexion à la base de données.
    -   Exécutez le script `php/setup.php` pour créer la table `saves`. Vous pouvez le faire en ligne de commande (`php php/setup.php`) ou en y accédant via votre navigateur.
3.  **Lancer le jeu**
    -   Ouvrez le projet dans votre navigateur, en pointant vers la racine du projet.

---

## Contrôles / UX

-  Depuis **l’écran d’accueil** :
   -  **Nouvelle partie** : commence une partie et initialise la sauvegarde.
   -  **Charger la sauvegarde** : reprend la dernière partie (si elle existe).
   -  **Effacer la sauvegarde** : remet le jeu à zéro.
-  Dans **l’écran de jeu** :
   -  **Panneau Planete** : clic sur une Planete → affiche ses stocks/prix (Planete sélectionnée).
   -  **Fiche du joueur** : affiche or, niveau, XP, Planete actuelle, réduction de coût.
   -  **Cargaison** : liste les ressources possédées par le joueur.
   -  **Planete sélectionnée** : tableau des stocks/prix de la Planete choisie.
   -  **Commerce** :
      -  choisir ressource + quantité, cliquer sur **Acheter** ou **Vendre**.
   -  **Voyage** :
      -  cliquer sur un bouton **Voyager** vers une autre Planete.
      -  observer la barre de progression.
   -  **Sauvegarder la partie** : enregistre immédiatement dans la base de données.
   -  **Retour au menu** : revient à l’écran d’accueil.

---

## Structure du code

-  **HTML** : structure de base (écran d’accueil, écran de jeu, overlay de voyage).
-  **CSS** : style sombre, layout en grille pour le jeu, modale de voyage, barre de progression.
-  **JavaScript** :
   -  `js/game/data.js` : configuration initiale des villes, ressources et routes.
   -  `js/game/state.js` : état courant (joueur, villes, routes, voyage) et communication avec l'API.
   -  `js/game/ui.js` : rendu de l’UI.
   -  `js/game/main.js` : logique du jeu (commerce, voyage, etc.).
-  **PHP** :
   - `php/api.php`: API pour la gestion des sauvegardes.
   - `php/config.php`: Configuration de la base de données (ignoré par git).
   - `php/setup.php`: Script pour la création de la base de données.

---

## Limites actuelles / pistes d’évolution

-  Pas encore d’**éditeur de carte** (positions des Planete en pixel art).
-  Pas encore d’**éditeur de Planete / ressources** dans l’interface (modif des prix, quantités, ajout/suppression de villes).
-  Pas de gestion de **difficulté** ni d’objectifs (score, nombre de jours, etc.).
-  Pas de graphique ou d’historique des prix.

Idées pour la suite :

-  Écran “Éditeur” pour :
   -  placer les Planete sur une petite carte en pixels,
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
