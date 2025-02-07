// Utiliser des promesses chaque fois qu'on traite des operations asynchrones: des tâches qui prennent du temps et ne se terminent pas immédiatement
const fs = require('fs').promises;  // fs: Module pour manipuler les fichiers (permet d'écrire/lire un journal des parties).
const readline = require('readline'); // readline: Module pour interagir avec l'utilisateur via le terminal.

const words = [
    "word", "letter", "number", "person", "pen", "class", "people", "sound", "water", "side",
    "place", "man", "men", "woman", "women", "boy", "girl", "year", "day", "week", "month",
    "name", "sentence", "line", "air", "land", "home", "hand", "house", "picture", "animal",
    "mother", "father", "brother", "sister", "world", "head", "page", "country", "question",
    "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree", "farm", "story",
    "sea", "night", "life", "north", "south", "east", "west", "child", "children", "example", "paper",
    "music", "river", "car", "foot", "feet", "book", "science", "room", "friend", "idea", "fish",
    "mountain", "horse", "watch", "color", "face", "wood", "list", "bird", "body", "dog", "family",
    "song", "door", "product", "wind", "ship", "area", "rock", "order", "fire", "problem", "prince", "man",
    "child", "person" // Add more if needed
];

// Définit des familles de mots pour gérer les variations
const wordFamilies = {  
    prince: ['princess'],
    man: ['woman', 'men'],
    child: ['children'],
    foot: ['feet'],
    goose: ['geese'],
    person: ['people'],
    // Add more word families as needed...
};

// Initialise readline pour permettre les interactions avec l'utilisateur dans le terminal.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Game state
let numPlayers = 0;
let currentRound = 1;
let currentGuesserIndex = 0; // Indice du joueur qui devine.
let scores = [];
let shuffledWords = []; // Mots mélangés pour chaque partie.


// Mélange aléatoirement un tableau. di tung vi tri i roi tim vi tri j bat ky moi roi dao phan tu cho nhau
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Normalize text (removes accents and makes lowercase)
// Met le texte en minuscules et supprime les accents pour éviter les erreurs dues aux variantes d'écriture.
function normalizeText(text) {
    if (!text) return ""; 
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // applies Unicode Normalization Form D (NFD), which decomposes characters into their base characters and diacritical marks. For example, the character é would be decomposed into e followed by an accent mark.
}

/* For the input text "école":

After .toLowerCase(), it becomes "école".
After .normalize("NFD"), it becomes "école" (where the accent is a separate character).
After .replace(/[\u0300-\u036f]/g, ""), it becomes "ecole", removing the accent.
*/

// Get the base form of a word (handles plurals and word families)
function getBaseForm(word) {
    const lowerWord = normalizeText(word);
    for (const [root, variants] of Object.entries(wordFamilies)) { // root, variants sont comme des clefs et valeurs dans une dict
        if (lowerWord === root || variants.includes(lowerWord)) {
            return root;
        }
    }
    return lowerWord.endsWith('s') && lowerWord.length > 3 ? lowerWord.slice(0, -1) : lowerWord; // slice: prendre d'indice 0 jusqu'a avant la fin dans le cas de 's' sinon garder le mot
}

// Remove duplicate or invalid clues
function removeDuplicateClues(clues, chosenWord) {
    const normalizedChosenWord = getBaseForm(chosenWord);
    const clueCounts = {}; // an object that will track how many times each base form of the clues appears.
    const uniqueClues = []; // an array that will hold the final list of clues that are unique and valid.

    clues.forEach((clue) => {
        const baseForm = getBaseForm(clue);
        
        // Remove clues that match the chosen word
        if (baseForm === normalizedChosenWord) {
            console.log(`❌ Clue "${clue}" is the same as the chosen word and is removed.`);
            return;
        }

        clueCounts[baseForm] = (clueCounts[baseForm] || 0) + 1; // verifier si une indice apparait plus de une fois, si 1er fois -> 0 sinon ...
    });

    clues.forEach((clue) => {
        const baseForm = getBaseForm(clue);
        if (clueCounts[baseForm] === 1) {
            uniqueClues.push(clue);
        } else {
            console.log(`❌ Clue "${clue}" is too similar to another clue and is removed.`);
        }
    });

    return uniqueClues;
}

// Function to save game turn to log
function saveGameTurn(turnData) {
    return fs.readFile('game_log.json', 'utf8')
        .then((data) => {
            let gameLog = [];

            if (data.length > 0) {
                gameLog = JSON.parse(data);
            }

            gameLog.push(turnData);

            return fs.writeFile('game_log.json', JSON.stringify(gameLog, null, 2));
        })
        .then(() => {
            console.log('Game turn saved to game_log.json');
        })
        .catch((err) => {
            console.error('Error saving game log:', err);
            throw err; // Propagate error to be handled by caller
        });
}

// Start the game
function startGame() {
    rl.question("Enter the number of players: ", (numPlayersInput) => {
        numPlayers = parseInt(numPlayersInput); // convertir en int
        if (numPlayers < 2) {
            console.log("There must be at least 2 players.");
            rl.close();
            return;
        }

        scores = Array(numPlayers).fill(0);
        shuffleArray(words);
        shuffledWords = words.slice(0, numPlayers);

        playRound();
    });
}

// Play a round
function playRound() {
    if (currentRound > 13*numPlayers) {
        endGame();
        return;
    }

    console.log(`\n=== Round ${currentRound} ===`);
    const guesser = currentGuesserIndex + 1;
    console.log(`\n🎭 Player ${guesser} is the guesser this round!`);

    // shuffleArray(shuffledWords);
    // const chosenCards = shuffledWords.slice(0, numPlayers);

    console.log(`\nHere are ${numPlayers} cards numbered from 1 to ${numPlayers}:`);
    for (let i = 0; i < numPlayers; i++) {
        console.log(`Card ${i + 1}`);
    }

    rl.question(`Player ${guesser}, choose a card (1-${numPlayers}): `, (chosenIndex) => {
        chosenIndex = parseInt(chosenIndex) - 1; // The input is converted from a 1-based index (player sees 1, 2, 3...) to a 0-based index (program uses 0, 1, 2...).

        if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= numPlayers) {
            console.log("Invalid choice. Please pick a valid number.");
            return playRound();
        }

        const chosenWord = shuffledWords[chosenIndex];  // The word corresponding to the chosen card is selected from shuffledWords.
        console.log(`\n🔹 Player ${guesser} chose card number ${chosenIndex + 1}.`);
        console.log(`\n❗ The word on this card is: ${chosenWord} (Hidden for Player ${guesser}. Only other players can see this!) ❗`);

        let clues = [];  // store the clues given by players
        let playerCount = 0; // keeps track of how many players have given a clue.
        
        // Fucntion recursively collects clues from all players except the guesser.
        function getClues() {
            if (playerCount < numPlayers - 1) { // One player is the guesser, so the remaining numPlayers - 1 players must provide clues.
                const clueGiver = (currentGuesserIndex + 1 + playerCount) % numPlayers + 1; // ensures that each player (except the guesser) gives exactly one clue.
                rl.question(`Player ${clueGiver}, enter your clue: `, (clue) => {
                    clues.push(clue);
                    playerCount++;
                    getClues();
                });
            } else { // once all the clues are collected 
                clues = removeDuplicateClues(clues, chosenWord);
                console.log("\n✅ Clues collected: " + clues.join(", "));
                askForGuess(chosenWord, clues); // move on to the guessing phase with the cl
            }
        }

        getClues();
    });
}

// Handle player guess
function askForGuess(wordToGuess, clues) {
    const guesser = currentGuesserIndex + 1;

    rl.question(`\n🎯 Player ${guesser}, guess the word: `, (guess) => {
        const result = guess.toLowerCase() === wordToGuess ? 'correct' : 'incorrect';

        // Update score if correct
        if (result === 'correct') {
            scores[currentGuesserIndex]++;
        }

        // Save game turn data
        const turnData = {
            round: currentRound,
            guesser: guesser,
            wordToGuess,
            clues,
            guess,
            result,
            scores: [...scores],
            timestamp: new Date().toISOString(),
        };

        console.log(result === 'correct' ? "\n🎉 Correct! Well done!\n" : `\n❌ Wrong! The correct word was "${wordToGuess}".\n`);

        // Save game turn and then move to the next round
        saveGameTurn(turnData).then(() => {
            currentGuesserIndex = (currentGuesserIndex + 1) % numPlayers;
            currentRound++;
            playRound();
        });     
    });
}

// End game and show final scores and ranking
function endGame() {
    console.log("\n🎊 Game Over! Final Scores:");
    
    // Sort scores in descending order
    const sortedScores = scores
        .map((score, index) => ({ player: index + 1, score }))
        .sort((a, b) => b.score - a.score);

    sortedScores.forEach((playerScore, index) => {
        console.log(`Player ${playerScore.player}: ${playerScore.score} points`);
    });

    const winner = sortedScores[0];
    console.log(`\n🏆 Player ${winner.player} wins with ${winner.score} points!`);
    console.log("\nThanks for playing!");
    rl.close();
}

// Start game
console.log("\n🎉 Welcome to Just One! 🎉");
console.log("📝 A cooperative word-guessing game.");
console.log("💡 Rules:");
console.log("  - One player will be the guesser.");
console.log("  - Other players give one-word clues.");
console.log("  - Duplicate or similar clues will be removed!");
console.log("  - Try to guess the secret word!\n");

rl.question("🔹 Press Enter to start the game...", () => {
    startGame(); // Start the game after pressing Enter
});