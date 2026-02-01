// ============================================
// JEU DES BÂTONNETS - Application éducative
// Pour enfants de 4 ans
// ============================================

// État du jeu
const gameState = {
    currentGame: null,
    scores: {
        counting: 0,
        addition: 0,
        subtraction: 0
    },
    currentAnswer: 0,
    roundsPlayed: 0
};

// Couleurs des bâtonnets (comme dans le jeu physique)
const STICK_COLORS = ['red', 'blue', 'green', 'yellow'];

// ============================================
// SYSTÈME DE SONS (Web Audio API)
// ============================================

let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Débloquer l'audio sur iOS
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Son de succès (mélodie joyeuse)
function playSuccessSound() {
    initAudio();
    const notes = [523.25, 659.25, 783.99]; // Do, Mi, Sol
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.15, 'sine', 0.3), i * 100);
    });
}

// Son d'erreur (son doux)
function playErrorSound() {
    initAudio();
    playTone(200, 0.3, 'sine', 0.2);
}

// Son de célébration (fanfare)
function playCelebrationSound() {
    initAudio();
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 659.25, 783.99];
    const durations = [0.1, 0.1, 0.1, 0.15, 0.3, 0.15, 0.4];
    let time = 0;
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, durations[i], 'sine', 0.3), time * 1000);
        time += durations[i] + 0.05;
    });
}

// Son de clic
function playClickSound() {
    initAudio();
    playTone(800, 0.05, 'sine', 0.1);
}

// Générateur de ton
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// ============================================
// NAVIGATION ENTRE ÉCRANS
// ============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function goToMenu() {
    playClickSound();
    showScreen('menu-screen');
    gameState.currentGame = null;
    gameState.roundsPlayed = 0;
}

function startGame(gameType) {
    playClickSound();
    initAudio(); // S'assurer que l'audio est initialisé au premier clic
    gameState.currentGame = gameType;
    gameState.roundsPlayed = 0;

    switch(gameType) {
        case 'counting':
            showScreen('counting-screen');
            startCountingRound();
            break;
        case 'addition':
            showScreen('addition-screen');
            startAdditionRound();
            break;
        case 'subtraction':
            showScreen('subtraction-screen');
            startSubtractionRound();
            break;
    }
}

function continueGame() {
    playClickSound();
    showScreen(gameState.currentGame + '-screen');

    switch(gameState.currentGame) {
        case 'counting':
            startCountingRound();
            break;
        case 'addition':
            startAdditionRound();
            break;
        case 'subtraction':
            startSubtractionRound();
            break;
    }
}

// ============================================
// ACTIVITÉ 1: COMPTE LES BÂTONNETS
// ============================================

function startCountingRound() {
    const container = document.getElementById('counting-sticks');
    const answersContainer = document.getElementById('counting-answers');
    const feedback = document.getElementById('counting-feedback');

    // Vider les conteneurs
    container.innerHTML = '';
    answersContainer.innerHTML = '';
    feedback.innerHTML = '';
    feedback.className = 'feedback';

    // Générer un nombre aléatoire entre 1 et 10
    const count = Math.floor(Math.random() * 10) + 1;
    gameState.currentAnswer = count;

    // Choisir une couleur aléatoire
    const color = STICK_COLORS[Math.floor(Math.random() * STICK_COLORS.length)];

    // Créer les bâtonnets avec animation
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const stick = document.createElement('div');
            stick.className = `stick ${color} appearing`;
            container.appendChild(stick);
        }, i * 100);
    }

    // Créer les boutons de réponse (3 choix)
    const answers = generateAnswerChoices(count, 1, 10);
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkCountingAnswer(answer, btn);
        answersContainer.appendChild(btn);
    });
}

function checkCountingAnswer(answer, btn) {
    const feedback = document.getElementById('counting-feedback');
    const allButtons = document.querySelectorAll('#counting-answers .answer-btn');

    if (answer === gameState.currentAnswer) {
        // Bonne réponse
        btn.classList.add('correct');
        playSuccessSound();
        feedback.textContent = getSuccessMessage();
        feedback.className = 'feedback success';
        gameState.scores.counting++;
        updateScore('counting');

        allButtons.forEach(b => b.disabled = true);

        gameState.roundsPlayed++;
        setTimeout(() => {
            if (gameState.roundsPlayed >= 5) {
                showCelebration();
            } else {
                startCountingRound();
            }
        }, 1500);
    } else {
        // Mauvaise réponse
        btn.classList.add('wrong');
        playErrorSound();
        feedback.textContent = getEncouragementMessage();
        feedback.className = 'feedback error';

        setTimeout(() => {
            btn.classList.remove('wrong');
            btn.disabled = true;
            feedback.textContent = 'Essaie encore !';
        }, 800);
    }
}

// ============================================
// ACTIVITÉ 2: LA MACHINE À ADDITIONNER
// ============================================

function startAdditionRound() {
    const group1 = document.getElementById('addition-group1');
    const group2 = document.getElementById('addition-group2');
    const answersContainer = document.getElementById('addition-answers');
    const feedback = document.getElementById('addition-feedback');

    // Vider les conteneurs
    group1.innerHTML = '';
    group2.innerHTML = '';
    answersContainer.innerHTML = '';
    feedback.innerHTML = '';
    feedback.className = 'feedback';

    // Générer deux nombres dont la somme ≤ 10
    const num1 = Math.floor(Math.random() * 5) + 1; // 1-5
    const maxNum2 = Math.min(5, 10 - num1);
    const num2 = Math.floor(Math.random() * maxNum2) + 1; // 1 à (10-num1)
    const sum = num1 + num2;
    gameState.currentAnswer = sum;

    // Choisir deux couleurs différentes
    const colors = [...STICK_COLORS].sort(() => Math.random() - 0.5);
    const color1 = colors[0];
    const color2 = colors[1];

    // Créer les bâtonnets du premier groupe
    for (let i = 0; i < num1; i++) {
        setTimeout(() => {
            const stick = document.createElement('div');
            stick.className = `stick ${color1} appearing`;
            group1.appendChild(stick);
        }, i * 100);
    }

    // Créer les bâtonnets du deuxième groupe
    for (let i = 0; i < num2; i++) {
        setTimeout(() => {
            const stick = document.createElement('div');
            stick.className = `stick ${color2} appearing`;
            group2.appendChild(stick);
        }, (num1 + i) * 100);
    }

    // Créer les boutons de réponse
    const answers = generateAnswerChoices(sum, 2, 10);
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkAdditionAnswer(answer, btn);
        answersContainer.appendChild(btn);
    });
}

function checkAdditionAnswer(answer, btn) {
    const feedback = document.getElementById('addition-feedback');
    const resultBox = document.querySelector('.result-box');
    const allButtons = document.querySelectorAll('#addition-answers .answer-btn');

    if (answer === gameState.currentAnswer) {
        // Bonne réponse
        btn.classList.add('correct');
        resultBox.textContent = answer;
        resultBox.style.borderStyle = 'solid';
        resultBox.style.background = '#58D68D';
        resultBox.style.color = 'white';
        playSuccessSound();
        feedback.textContent = getSuccessMessage();
        feedback.className = 'feedback success';
        gameState.scores.addition++;
        updateScore('addition');

        allButtons.forEach(b => b.disabled = true);

        gameState.roundsPlayed++;
        setTimeout(() => {
            // Réinitialiser la boîte de résultat
            resultBox.textContent = '?';
            resultBox.style.borderStyle = 'dashed';
            resultBox.style.background = 'white';
            resultBox.style.color = '#667eea';

            if (gameState.roundsPlayed >= 5) {
                showCelebration();
            } else {
                startAdditionRound();
            }
        }, 1500);
    } else {
        // Mauvaise réponse
        btn.classList.add('wrong');
        playErrorSound();
        feedback.textContent = getEncouragementMessage();
        feedback.className = 'feedback error';

        setTimeout(() => {
            btn.classList.remove('wrong');
            btn.disabled = true;
            feedback.textContent = 'Compte tous les bâtonnets !';
        }, 800);
    }
}

// ============================================
// ACTIVITÉ 3: IL EN RESTE COMBIEN ?
// ============================================

function startSubtractionRound() {
    const container = document.getElementById('subtraction-sticks');
    const answersContainer = document.getElementById('subtraction-answers');
    const feedback = document.getElementById('subtraction-feedback');
    const instruction = document.getElementById('subtraction-instruction');

    // Vider les conteneurs
    container.innerHTML = '';
    answersContainer.innerHTML = '';
    feedback.innerHTML = '';
    feedback.className = 'feedback';

    // Générer les nombres pour la soustraction
    const total = Math.floor(Math.random() * 6) + 4; // 4-9 (pour avoir assez à enlever)
    const toRemove = Math.floor(Math.random() * (total - 1)) + 1; // 1 à (total-1)
    const remaining = total - toRemove;
    gameState.currentAnswer = remaining;

    // Choisir une couleur
    const color = STICK_COLORS[Math.floor(Math.random() * STICK_COLORS.length)];

    // Instruction initiale
    instruction.innerHTML = `Il y a <strong>${total}</strong> bâtonnets...`;

    // Créer tous les bâtonnets
    const sticks = [];
    for (let i = 0; i < total; i++) {
        const stick = document.createElement('div');
        stick.className = `stick ${color} appearing`;
        stick.style.animationDelay = `${i * 0.1}s`;
        container.appendChild(stick);
        sticks.push(stick);
    }

    // Après un délai, faire partir certains bâtonnets
    setTimeout(() => {
        instruction.innerHTML = `<strong>${toRemove}</strong> s'en ${toRemove > 1 ? 'vont' : 'va'}... 👋`;

        // Sélectionner aléatoirement les bâtonnets à enlever
        const toRemoveIndexes = [];
        while (toRemoveIndexes.length < toRemove) {
            const idx = Math.floor(Math.random() * total);
            if (!toRemoveIndexes.includes(idx)) {
                toRemoveIndexes.push(idx);
            }
        }

        // Animer le départ
        toRemoveIndexes.forEach((idx, i) => {
            setTimeout(() => {
                sticks[idx].classList.add('leaving');
            }, i * 200);
        });

        // Après l'animation, supprimer les bâtonnets et afficher la question
        setTimeout(() => {
            toRemoveIndexes.sort((a, b) => b - a).forEach(idx => {
                sticks[idx].remove();
            });

            instruction.innerHTML = `Il en reste combien ?`;

            // Créer les boutons de réponse
            const answers = generateAnswerChoices(remaining, 1, 10);
            answers.forEach(answer => {
                const btn = document.createElement('button');
                btn.className = 'answer-btn';
                btn.textContent = answer;
                btn.onclick = () => checkSubtractionAnswer(answer, btn);
                answersContainer.appendChild(btn);
            });
        }, toRemove * 200 + 600);

    }, total * 100 + 1000);
}

function checkSubtractionAnswer(answer, btn) {
    const feedback = document.getElementById('subtraction-feedback');
    const allButtons = document.querySelectorAll('#subtraction-answers .answer-btn');

    if (answer === gameState.currentAnswer) {
        // Bonne réponse
        btn.classList.add('correct');
        playSuccessSound();
        feedback.textContent = getSuccessMessage();
        feedback.className = 'feedback success';
        gameState.scores.subtraction++;
        updateScore('subtraction');

        allButtons.forEach(b => b.disabled = true);

        gameState.roundsPlayed++;
        setTimeout(() => {
            if (gameState.roundsPlayed >= 5) {
                showCelebration();
            } else {
                startSubtractionRound();
            }
        }, 1500);
    } else {
        // Mauvaise réponse
        btn.classList.add('wrong');
        playErrorSound();
        feedback.textContent = getEncouragementMessage();
        feedback.className = 'feedback error';

        setTimeout(() => {
            btn.classList.remove('wrong');
            btn.disabled = true;
            feedback.textContent = 'Compte ceux qui restent !';
        }, 800);
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function generateAnswerChoices(correct, min, max) {
    const choices = [correct];

    while (choices.length < 4) {
        // Générer des réponses proches mais différentes
        let offset = Math.floor(Math.random() * 3) + 1;
        if (Math.random() < 0.5) offset = -offset;

        let choice = correct + offset;

        // S'assurer que le choix est dans les limites et pas déjà présent
        if (choice >= min && choice <= max && !choices.includes(choice)) {
            choices.push(choice);
        }
    }

    // Mélanger les réponses
    return choices.sort(() => Math.random() - 0.5);
}

function updateScore(gameType) {
    document.getElementById(`${gameType}-score`).textContent = gameState.scores[gameType];
}

function showCelebration() {
    const celebrationText = document.getElementById('celebration-text');
    const messages = [
        '🎉 Bravo !',
        '🌟 Super !',
        '👏 Génial !',
        '🏆 Champion !'
    ];
    celebrationText.textContent = messages[Math.floor(Math.random() * messages.length)];

    showScreen('celebration-screen');
    playCelebrationSound();
    gameState.roundsPlayed = 0;
}

function getSuccessMessage() {
    const messages = [
        '🎉 Bravo !',
        '⭐ Super !',
        '👍 Très bien !',
        '🌟 Parfait !',
        '👏 Excellent !'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

function getEncouragementMessage() {
    const messages = [
        'Presque !',
        'Essaie encore !',
        'Tu peux le faire !'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================
// INITIALISATION
// ============================================

// Débloquer l'audio sur le premier toucher (nécessaire pour iOS)
document.addEventListener('touchstart', initAudio, { once: true });
document.addEventListener('click', initAudio, { once: true });

// Empêcher le zoom sur double-tap (iPad)
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - (this.lastTouchEnd || 0) < 300) {
        e.preventDefault();
    }
    this.lastTouchEnd = now;
}, false);

// Log de démarrage
console.log('🎮 Jeu des Bâtonnets chargé et prêt !');
