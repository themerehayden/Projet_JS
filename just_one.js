const fs = require('fs');  // fs: Module pour manipuler les fichiers (permet d'écrire/lire un journal des parties).
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

const wordFamilies = {
    prince: ['princess'],
    man: ['woman', 'men'],
    child: ['children'],
    foot: ['feet'],
    goose: ['geese'],
    person: ['people'],
    // Add more word families as needed...
};

// Readline setup
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Game state
let numPlayers = 0;
let currentRound = 1;
let currentGuesserIndex = 0;
let scores = [];
let shuffledWords = [];


// Shuffle function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Normalize text (removes accents and makes lowercase)
function normalizeText(text) {
    if (!text) return "";
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Get the base form of a word (handles plurals and word families)
function getBaseForm(word) {
    const lowerWord = normalizeText(word);
    for (const [root, variants] of Object.entries(wordFamilies)) {
        if (lowerWord === root || variants.includes(lowerWord)) {
            return root;
        }
    }
    return lowerWord.endsWith('s') && lowerWord.length > 3 ? lowerWord.slice(0, -1) : lowerWord;
}

// Remove duplicate or invalid clues
function removeDuplicateClues(clues, chosenWord) {
    const normalizedChosenWord = getBaseForm(chosenWord);
    const clueCounts = {};
    const uniqueClues = [];

    clues.forEach((clue) => {
        const baseForm = getBaseForm(clue);
        
        // ❌ Remove clues that match the chosen word
        if (baseForm === normalizedChosenWord) {
            console.log(`❌ Clue "${clue}" is the same as the chosen word and is removed.`);
            return;
        }

        clueCounts[baseForm] = (clueCounts[baseForm] || 0) + 1;
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
function saveGameTurn(turnData, callback) {
    fs.readFile('game_log.json', (err, data) => {
        let gameLog = [];

        if (!err && data.length > 0) {
            gameLog = JSON.parse(data);
        }

        gameLog.push(turnData);

        fs.writeFile('game_log.json', JSON.stringify(gameLog, null, 2), (err) => {
            if (err) {
                console.log('Error saving game log:', err);
            } else {
                console.log('Game turn saved to game_log.json');
                if (callback) callback(); // Call the next step after saving
            }
        });
    });
}

// Start the game
function startGame() {

    rl.question("Enter the number of players: ", (numPlayersInput) => {
        numPlayers = parseInt(numPlayersInput);
        if (numPlayers < 2) {
            console.log("There must be at least 2 players.");
            rl.close();
            return;
        }

        scores = Array(numPlayers).fill(0);
        shuffleArray(words);
        shuffledWords = words.slice(0, numPlayers * 3);

        playRound();
    });
}

// Play a round
function playRound() {
    if (currentRound > 4) {
        endGame();
        return;
    }

    console.log(`\n=== Round ${currentRound} ===`);
    const guesser = currentGuesserIndex + 1;
    console.log(`\n🎭 Player ${guesser} is the guesser this round!`);

    shuffleArray(shuffledWords);
    const chosenCards = shuffledWords.slice(0, numPlayers);

    console.log(`\nHere are ${numPlayers} cards numbered from 1 to ${numPlayers}:`);
    for (let i = 0; i < numPlayers; i++) {
        console.log(`Card ${i + 1}`);
    }

    rl.question(`Player ${guesser}, choose a card (1-${numPlayers}): `, (chosenIndex) => {
        chosenIndex = parseInt(chosenIndex) - 1;

        if (isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= numPlayers) {
            console.log("Invalid choice. Please pick a valid number.");
            return playRound();
        }

        const chosenWord = chosenCards[chosenIndex];
        console.log(`\n🔹 Player ${guesser} chose card number ${chosenIndex + 1}.`);
        console.log(`\n❗ The word on this card is: " + chosenWord + " (Hidden for Player ${guesser}. Only other players can see this!) ❗`);

        let clues = [];
        let playerCount = 0;
        
        // Collecting clues 
        function getClues() {
            if (playerCount < numPlayers - 1) {
                const clueGiver = (currentGuesserIndex + 1 + playerCount) % numPlayers + 1;
                rl.question(`Player ${clueGiver}, enter your clue: `, (clue) => {
                    clues.push(clue);
                    playerCount++;
                    getClues();
                });
            } else {
                clues = removeDuplicateClues(clues, chosenWord);
                console.log("\n✅ Clues collected: " + clues.join(", "));
                askForGuess(chosenWord, clues);
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
        saveGameTurn(turnData, () => {
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