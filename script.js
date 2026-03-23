 /******************************
 *  FAZAN BATTLE — Sorin (themask)
 *  Versiune completă, stabilă + FUNNY LINES
 ******************************/

// -----------------------------
// WebSocket IndoFinity
// -----------------------------
const socket = new WebSocket("ws://localhost:62024");

socket.onopen = () => {
    console.log("Conectat la IndoFinity WebSocket!");
};

socket.onmessage = (event) => {
    try {
        const packet = JSON.parse(event.data);

        if (packet.event === "chat") {

            const user =
                packet.data.nickname ||
                packet.data.uniqueId ||
                packet.data.displayName ||
                packet.data.username ||
                "necunoscut";

            const message = packet.data.comment || "";

            console.log("CHAT:", user, message);

            // Trimitem mesajul către joc
            onChatMessage(user, message);
        }

    } catch (err) {
        console.log("Eroare IndoFinity JSON:", err);
    }
};

/* ---------------------------------------------------
   1. Funny Lines — LISTE MARI, RANDOM
--------------------------------------------------- */

// La începutul rundei
const funnyStart = [
    "Hai că începe circul, luați popcorn!",
    "Runda nouă, nervi noi.",
    "Capo a dat drumul la joacă, pregătiți-vă!",
    "Să vedem cine e treaz și cine doar respiră.",
    "Atenție, începe haosul controlat.",
    "Cine dă primul cuvânt? Cine are curaj?",
    "Hai că nu doare, scrieți ceva!",
    "Runda asta promite… sau poate nu.",
    "Să înceapă dansul literelor!",
    "Cine rupe jocul primul?",
    "Capo vă privește… fără presiune.",
    "Atenție, începe distracția… sau tragedia."
];

// Cuvânt invalid
const funnyInvalid = [
    "Dicționarul a zis pas.",
    "Asta nu există nici în universul paralel.",
    "Inventăm cuvinte noi, văd…",
    "Nu merge, șefu’, încearcă altceva.",
    "Dacă era cuvânt, îl știam și eu.",
    "Dicționarul a plecat acasă la asta.",
    "Nu, nu, nu… încearcă din nou.",
    "Apreciez creativitatea, dar nu merge.",
    "Cuvânt nou? Frumos, dar nu azi.",
    "Dicționarul a făcut infarct.",
    "Nu e în listă, nu e în viață.",
    "Asta e fanfic, nu cuvânt."
];

// Câștigător runda
const funnyWinner = [
    "BOOM! A închis runda ca un capo adevărat!",
    "Respect, ai rupt jocul!",
    "Și restul? Mai încercăm data viitoare.",
    "Așa se face, luați notițe!",
    "A închis runda cu stil.",
    "Și cu asta… s-a zis runda.",
    "Capo approves.",
    "A dat cuvântul final, literalmente.",
    "Așa se joacă FAZAN, oameni buni.",
    "Runda s-a predat singură.",
    "A venit, a văzut, a închis.",
    "Restul jucătorilor: *tăcere*."
];

// Ultimele 10 secunde
const funnyLastSeconds = [
    "10 secunde… și nimeni nu face nimic. Superb.",
    "Hai că se duce runda, dormim bine.",
    "Tic-tac, tic-tac… suspans zero.",
    "Ultimele secunde și tot nimic? Frumos.",
    "Alo? Mai joacă cineva?",
    "Se duce timpul ca salariul pe 1 ale lunii.",
    "Hai că nu vă grăbiți, nu e concurs… oh wait.",
    "Timpul trece, inspirația nu vine.",
    "10 secunde de liniște… poetic.",
    "Dacă mai așteptăm puțin, vine și Crăciunul.",
    "Timpul moare, runda moare, toți mor… de somn.",
    "Ultima șansă… sau nu."
];

// Funcție random
function randomLine(list) {
    return list[Math.floor(Math.random() * list.length)];
}

/* ---------------------------------------------------
   2. Dicționar + starturi valide
--------------------------------------------------- */

let dictionary = [];
let validStarts = [];

function buildValidStarts() {
    const set = new Set();

    dictionary.forEach(word => {
        if (word.length >= 2) {
            const start = word.substring(0, 2).toUpperCase();
            set.add(start);
        }
    });

    validStarts = Array.from(set);
}

fetch("https://raw.githubusercontent.com/kamilmielnik/romanian-dictionary/master/loc5.txt")
    .then(res => res.text())
    .then(text => {
        dictionary = text
            .split("\n")
            .map(w => w.trim().toLowerCase())
            .filter(w => w.length > 1);

        buildValidStarts();
        loadScores();
        checkMidnightReset();
        startRound();
    });

/* ---------------------------------------------------
   3. Filtru obscenități
--------------------------------------------------- */

const bannedRoots = [
    "piz","pzd","pula","pul","fut","futu","muie","mui",
    "curv","drac","mortii","plm","sugi","suge","sugator",
    "coi","coaie","boule","handic","retard","javra"
];

function isCleanWord(word) {
    word = word.toLowerCase();
    return !bannedRoots.some(root => word.includes(root));
}

/* ---------------------------------------------------
   4. Structura jocului
--------------------------------------------------- */

const game = {
    letters: null,
    usedWords: [],
    roundActive: false,
    timer: null,
    timeLeft: 60,
    lastValidWord: null,
    lastValidUser: null
};

/* ---------------------------------------------------
   5. Timer
--------------------------------------------------- */

function startTimer() {
    stopTimer();
    game.timeLeft = 60;
    updateTimerUI(game.timeLeft);

    game.timer = setInterval(() => {
        game.timeLeft--;
        updateTimerUI(game.timeLeft);

        if (game.timeLeft === 10) {
            setStatus(randomLine(funnyLastSeconds));
        }

        if (game.timeLeft <= 0) {
            stopTimer();
            endRound();
        }
    }, 1000);
}

function stopTimer() {
    if (game.timer) clearInterval(game.timer);
    game.timer = null;
}

/* ---------------------------------------------------
   6. Start runda
--------------------------------------------------- */

function generateRandomLetters() {
    return validStarts[Math.floor(Math.random() * validStarts.length)];
}

function startRound() {
    game.roundActive = true;
    game.usedWords = [];
    game.lastValidWord = null;
    game.lastValidUser = null;

    game.letters = generateRandomLetters();
    updateLettersUI(game.letters);

    setStatus(randomLine(funnyStart));
    startTimer();
}

/* ---------------------------------------------------
   7. Validare cuvânt
--------------------------------------------------- */

function validateWord(word) {
    word = word.toLowerCase();

    if (!isCleanWord(word))
        return { valid: false, reason: randomLine(funnyInvalid) };

    if (!dictionary.includes(word))
        return { valid: false, reason: randomLine(funnyInvalid) };

    if (!word.startsWith(game.letters.toLowerCase()))
        return { valid: false, reason: "Nu începe cu literele cerute." };

    if (game.usedWords.includes(word))
        return { valid: false, reason: "Cuvânt deja folosit." };

    return { valid: true };
}

/* ---------------------------------------------------
   8. Scoruri
--------------------------------------------------- */

let leaderboardDay = {};
let leaderboardGlobal = {};

function saveScores() {
    localStorage.setItem("fazanDay", JSON.stringify(leaderboardDay));
    localStorage.setItem("fazanGlobal", JSON.stringify(leaderboardGlobal));
}

function loadScores() {
    leaderboardDay = JSON.parse(localStorage.getItem("fazanDay") || "{}");
    leaderboardGlobal = JSON.parse(localStorage.getItem("fazanGlobal") || "{}");
}

function givePoints(username, points) {
    if (!leaderboardDay[username]) leaderboardDay[username] = 0;
    leaderboardDay[username] += points;

    if (!leaderboardGlobal[username]) leaderboardGlobal[username] = 0;
    leaderboardGlobal[username] += points;

    saveScores();
    updateScoreUI(username);
}

/* ---------------------------------------------------
   9. Reset la miezul nopții
--------------------------------------------------- */

function checkMidnightReset() {
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            leaderboardDay = {};
            saveScores();
            setStatus("Top Day resetat automat!");
        }
    }, 60000);
}

/* ---------------------------------------------------
   10. Procesare cuvânt
--------------------------------------------------- */

function processPlayerWord(username, word) {
    if (!game.roundActive) return;

    const result = validateWord(word);

    if (!result.valid) {
        setStatus(`${username}: ${result.reason}`);
        return;
    }

    game.usedWords.push(word);
    game.lastValidWord = word;
    game.lastValidUser = username;

    updateWordUI(word, username);
    setStatus(`${username} a dat un cuvânt valid!`);

    givePoints(username, 1);

    const nextStart = word.slice(-2).toUpperCase();
    game.letters = nextStart;
    updateLettersUI(nextStart);

    const canContinue = dictionary.some(w =>
        w.startsWith(nextStart.toLowerCase()) &&
        !game.usedWords.includes(w)
    );

    if (!canContinue) {
        setStatus(`${username} a închis runda! ${randomLine(funnyWinner)}`);
        stopTimer();
        setTimeout(startRound, 3000);
        return;
    }

    startTimer();
}

/* ---------------------------------------------------
   11. Final runda
--------------------------------------------------- */

function endRound() {
    game.roundActive = false;

    if (!game.lastValidWord) {
        setStatus("Nimeni nu a dat niciun cuvânt. Runda moartă.");
        setTimeout(startRound, 3000);
        return;
    }

    setStatus("Timpul a expirat! Runda se reia.");
    setTimeout(startRound, 3000);
}

/* ---------------------------------------------------
   12. Comenzi chat
--------------------------------------------------- */

function handleCommand(username, message) {

    if (message === ".top") {
        const top = Object.entries(leaderboardDay)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (top.length === 0) {
            setStatus("TOP ZI: gol.");
            return;
        }

        let msg = "TOP ZI:\n";
        top.forEach(([user, score], i) => {
            msg += `${i+1}. ${user} - ${score}p\n`;
        });

        setStatus(msg);
        return;
    }

    if (message === ".global") {
        const top = Object.entries(leaderboardGlobal)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (top.length === 0) {
            setStatus("TOP GLOBAL: gol.");
            return;
        }

        let msg = "TOP GLOBAL:\n";
        top.forEach(([user, score], i) => {
            msg += `${i+1}. ${user} - ${score}p\n`;
        });

        setStatus(msg);
        return;
    }

    if (message === ".scor") {
        const d = leaderboardDay[username] || 0;
        const g = leaderboardGlobal[username] || 0;

        setStatus(`${username}: ZI ${d}p | GLOBAL ${g}p`);
        return;
    }
}

/* ---------------------------------------------------
   13. Chat handler
--------------------------------------------------- */

function onChatMessage(username, message) {
    const clean = message.trim();

    if (clean.startsWith(".")) {
        handleCommand(username, clean);
        return;
    }

    if (clean.startsWith("#")) {
        const word = clean.substring(1).trim().toLowerCase();
        processPlayerWord(username, word);
        return;
    }
}

/* ---------------------------------------------------
   14. UI Hooks
--------------------------------------------------- */

function setStatus(msg) {
    const el = document.getElementById("fazan-status");
    if (el) el.textContent = msg;
}

function updateLettersUI(letters) {
    const el = document.getElementById("fazan-letters");
    if (el) el.textContent = letters;
}

function updateWordUI(word, username) {
    const el = document.getElementById("fazan-word");
    if (el) el.textContent = `${word} (${username})`;
}

function updateTimerUI(seconds) {
    const el = document.getElementById("fazan-timer");
    if (el) el.textContent = seconds;
}

function updateScoreUI(username) {
    const el = document.getElementById("fazan-score");
    if (!el) return;

    const d = leaderboardDay[username] || 0;
    const g = leaderboardGlobal[username] || 0;

    el.textContent = `${username}: ZI ${d}p | GLOBAL ${g}p`;
}
