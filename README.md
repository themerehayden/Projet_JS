# Just One - Jeu de Devinettes

Just One est un jeu de devinettes en ligne de commande inspiré du jeu de société "Just One". Les joueurs doivent donner des indices uniques pour aider un joueur à deviner un mot secret.

## 📌 Fonctionnalités

- 🎲 Sélection aléatoire d'un mot à deviner.
- 💡 Saisie des indices par les joueurs.
- 🚫 Suppression automatique des indices en double.
- ✅ Vérification des réponses.
- 📊 Gestion du score et enregistrement des tours dans un fichier JSON.

## 📋 Prérequis

- Node.js installé sur votre machine.

## 🚀 Installation et Exécution

1. Clonez ce dépôt ou copiez les fichiers dans un dossier :
   ```sh
   git clone https://github.com/themerehayden/Projet_JS.git
   cd Projet_JS
   ```
2. Installez les dépendances (si nécessaire) :
   ```sh
   npm install
   ```
3. Exécutez le jeu :

   ```sh
   npm start
   ```

   ou:

   ```sh
   node just_one.js
   ```

## 🎮 Règles du Jeu

1. **Configuration** : Entrez le nombre de joueurs (minimum 3).
2. **Sélection du mot** : Un mot est choisi aléatoirement pour le tour.
3. **Donner des indices** : Tous les joueurs, sauf celui qui devine, écrivent un indice.
4. **Suppression des doublons** : Les indices en double ou trop similaires sont supprimés.
5. **Faire une devinette** : Le joueur tente de deviner le mot.
6. **Score** : Un point est attribué pour chaque bonne réponse.
7. **Fin du jeu** : Après 13 tours pour chaque joueur, le joueur avec le plus de points gagne.

## 📂 Structure du projet

```
Projet_JS/
│-- just_one.js        # Code principal du jeu
│-- game_log.json      # Fichier de sauvegarde des parties
│-- README.md          # Documentation du projet
```

## ✨ Améliorations Futures

- Intégrer un mode multijoueur en ligne.
- Ajouter des catégories de mots et ensemble des mots.
- Il y a des mots qui valident les conditions de la fonction getBaseForm (ex. mess, chess, boss, etc) mais ne sont pas des mots pluriels.

---

🎉 Amusez-vous bien en jouant à Just One !
