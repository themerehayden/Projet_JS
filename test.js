const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
}); // Définie l'objet rl qui lit les entrées du terminale et envoye les sorties dans le terminal

var wordToGuess; // Mot mystère à deviner
// const wordToGuess = "piano";
let hints = [];
let joueursRestants = 0;
let nbPlayers = 0;
let nbTurn = 0;
let currentTurn = 1; 
let file = "liste_francais.txt";
let lignes;
console.log("Bienvenue dans Just One - Version Console");
console.log("Un joueur doit deviner un mot, les autres donnent un indice.");
console.log("Si plusieurs joueurs donnent le même indice, il est supprimé !\n");

// Variables pour gérer le compteur
let tempsEcoule = 0;   // Temps écoulé en secondes
let interval;          // Référence à l'intervalle pour l'arrêter ou le réinitialiser

// Lecture du fichier :
function lectureFichier() {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur de lecture:', err);
            return;
        }
        lignes = data.split(/\r?\n/);
        askNbTurn();

    });
}
// Fonction pour démarrer le compteur
function startTimer() {
    if (interval) {
        console.log('Le compteur est déjà en cours.');
        return;
    }

    // Démarrer l'intervalle pour mettre à jour le temps toutes les secondes
    interval = setInterval(function() {
        tempsEcoule++;
    }, 1000); // 1000 ms = 1 seconde
}

// Fonction pour arrêter le compteur
function stopTimer() {
    if (interval) {
        clearInterval(interval);  // Annule l'intervalle
        interval = null;           // Réinitialise l'intervalle
        console.log(`Temps écoulé: ${tempsEcoule} secondes`);
    } else {
        console.log('Le compteur n\'est pas en cours.');
    }
}

// Fonction pour réinitialiser le compteur
function resetTimer() {
    tempsEcoule = 0;
    clearInterval(interval);  // Arrête l'intervalle
    interval = null;           // Réinitialise l'intervalle
}

function askNbTurn(){
    rl.question("Combien de tour voulez vous jouer ? : ", (hint) => {
        if (isNaN(hint) === false) {
            nbTurn = Number(hint);
            askNbPlayer();
        } else {
            console.log("L'entrée n'est pas un nombre !");
            askNbTurn();
        }
    }); // Fonction qui attend d'avoir une entrée pour s'executer
}

function askNbPlayer(){
    rl.question("A combien allez vous jouer ? : ", (hint) => {
        if (isNaN(hint) === false) {
            nbPlayers = Number(hint);
            gameLoop();
        } else {
            console.log("L'entrée n'est pas un nombre !");
            askNbPlayer();
        }
    }); // Fonction qui attend d'avoir une entrée pour s'executer
}


function gameLoop(){
    if (currentTurn > nbTurn) {
        console.log("Fin de la partie !");
        rl.close();
        return;
    }

    console.log(`\n--- Tour ${currentTurn}/${nbTurn} ---`);
    wordToGuess = lignes[Math.floor(Math.random() * lignes.length)];
    console.log(`\nMot à deviner : ${wordToGuess}`);
    hints = []; // Réinitialiser les indices
    joueursRestants = nbPlayers; // Réinitialiser le nombre de joueurs
    askHint();
}

function askHint() {
    if (joueursRestants === 0) {
        processHints();
        return;
    }
    

    rl.question(`Joueur ${nbPlayers - joueursRestants + 1}, entrez un indice : `, (hint) => {
        hints.push(hint.toLowerCase());
        joueursRestants--;
        stopTimer();
        resetTimer();
        askHint();
    }); // Fonction qui attend d'avoir une entrée pour s'executer

    startTimer();
}

function processHints() {
    const hintCount = {};
    hints.forEach(hint => {
        hintCount[hint] = (hintCount[hint] || 0) + 1; // Pas d'erreur si la clef n'existe pas 0_0, Cette ligne compte les occurences d'un mot
    });

    const uniqueHints = Object.keys(hintCount).filter(hint => hintCount[hint] === 1);
    // Object.keys() c'est les clefs du dictionnaire hintCount.
    // Array.filter() ici filtre sur le fait que pour un hint, la valeur dans le dictionnaire soit égale à 1.

    console.log("\x1Bc")
    console.log("\nIndices valides :", uniqueHints.length > 0 ? uniqueHints.join(", ") : "Aucun (tous supprimés)");
    // Test, si la taille de la liste uniqueHints > 0 alors on affiche les elements de la liste séparé par des virgules
    // Sinon on affiche Aucun (tous supprimés).

    rl.question("Devinez le mot mystère : ", (answer) => {
        if (answer.toLowerCase() === wordToGuess) {
            console.log("Bravo, vous avez trouvé le mot !");
        } else {
            console.log("Dommage, le mot était :", wordToGuess);
        }

        // Passer au tour suivant
        currentTurn++;
        gameLoop();
    }); // Pareil que l'autre quesion, attend une entrée dans le terminale pour proceder.
}

lectureFichier();
