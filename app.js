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
    roundsPlayed: 0,
    // Pour l'addition en 3 étapes
    additionStep: 0,
    additionNum1: 0,
    additionNum2: 0,
    additionColor1: '',
    additionColor2: ''
};

// Couleurs des bâtonnets (comme dans le jeu physique)
const STICK_COLORS = ['red', 'blue', 'green', 'yellow'];

// ============================================
// FONCTION UTILITAIRE : GROUPEMENT DES BÂTONNETS
// ============================================

// Divise un nombre en groupes de 2-5 pour faciliter le comptage visuel
// Retourne un tableau de tailles de groupes. Ex: 7 → [3, 4] ou [2, 5]
function splitIntoGroups(total) {
    if (total <= 5) {
        return [total]; // Un seul groupe
    }

    if (total <= 10) {
        // 2 groupes de préférence
        // On essaie de faire des groupes équilibrés entre 2 et 5
        const half = Math.floor(total / 2);
        const group1 = Math.max(2, Math.min(5, half));
        const group2 = total - group1;

        // Si group2 > 5, on ajuste
        if (group2 > 5) {
            return [5, total - 5];
        }
        return [group1, group2];
    }

    // Pour > 10 (ne devrait pas arriver mais au cas où)
    const groups = [];
    let remaining = total;
    while (remaining > 0) {
        const groupSize = Math.min(5, remaining);
        groups.push(groupSize);
        remaining -= groupSize;
    }
    return groups;
}

// Crée les bâtonnets groupés dans un conteneur
function createGroupedSticks(container, total, color, animationDelay = 0) {
    const groups = splitIntoGroups(total);
    const sticks = [];
    let stickIndex = 0;

    groups.forEach((groupSize, groupIndex) => {
        // Créer un wrapper pour le groupe
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'stick-group-wrapper';

        for (let i = 0; i < groupSize; i++) {
            const stick = document.createElement('div');
            stick.className = `stick ${color} appearing`;
            stick.style.animationDelay = `${(stickIndex + animationDelay) * 0.1}s`;
            groupWrapper.appendChild(stick);
            sticks.push(stick);
            stickIndex++;
        }

        container.appendChild(groupWrapper);
    });

    return sticks;
}

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

    // Créer les bâtonnets groupés pour faciliter le comptage
    createGroupedSticks(container, count, color);

    // Créer les boutons de réponse (4 choix)
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
// ACTIVITÉ 2: LA MACHINE À ADDITIONNER (3 étapes)
// ============================================

function startAdditionRound() {
    const sticksContainer = document.getElementById('addition-sticks-container');
    const operationContainer = document.getElementById('addition-operation');
    const answersContainer = document.getElementById('addition-answers');
    const feedback = document.getElementById('addition-feedback');
    const instruction = document.getElementById('addition-instruction');

    // Vider les conteneurs
    sticksContainer.innerHTML = '';
    operationContainer.innerHTML = '';
    answersContainer.innerHTML = '';
    feedback.innerHTML = '';
    feedback.className = 'feedback';

    // Générer deux nombres dont la somme ≤ 10
    const num1 = Math.floor(Math.random() * 5) + 1; // 1-5
    const maxNum2 = Math.min(5, 10 - num1);
    const num2 = Math.floor(Math.random() * maxNum2) + 1; // 1 à (10-num1)

    // Choisir deux couleurs différentes
    const colors = [...STICK_COLORS].sort(() => Math.random() - 0.5);

    // Stocker dans gameState pour les étapes suivantes
    gameState.additionNum1 = num1;
    gameState.additionNum2 = num2;
    gameState.additionColor1 = colors[0];
    gameState.additionColor2 = colors[1];
    gameState.additionStep = 1;

    // Créer la structure visuelle : bâtonnets en bas, opération au-dessus
    // Groupe 1
    const group1Wrapper = document.createElement('div');
    group1Wrapper.className = 'addition-group';
    group1Wrapper.id = 'add-group1';

    const sticks1Container = document.createElement('div');
    sticks1Container.className = 'sticks-box';
    createGroupedSticks(sticks1Container, num1, gameState.additionColor1);

    const number1Box = document.createElement('div');
    number1Box.className = 'number-box';
    number1Box.id = 'add-num1';
    number1Box.innerHTML = '<span class="result-box">?</span>';

    group1Wrapper.appendChild(number1Box);
    group1Wrapper.appendChild(sticks1Container);

    // Opérateur +
    const plusOperator = document.createElement('div');
    plusOperator.className = 'op-symbol-vertical';
    plusOperator.textContent = '+';

    // Groupe 2
    const group2Wrapper = document.createElement('div');
    group2Wrapper.className = 'addition-group';
    group2Wrapper.id = 'add-group2';

    const sticks2Container = document.createElement('div');
    sticks2Container.className = 'sticks-box';
    createGroupedSticks(sticks2Container, num2, gameState.additionColor2, num1);

    const number2Box = document.createElement('div');
    number2Box.className = 'number-box';
    number2Box.id = 'add-num2';
    number2Box.innerHTML = '<span class="result-box">?</span>';

    group2Wrapper.appendChild(number2Box);
    group2Wrapper.appendChild(sticks2Container);

    // Opérateur =
    const equalsOperator = document.createElement('div');
    equalsOperator.className = 'op-symbol-vertical';
    equalsOperator.textContent = '=';

    // Résultat
    const resultWrapper = document.createElement('div');
    resultWrapper.className = 'addition-group result-group';
    resultWrapper.id = 'add-result';

    const resultBox = document.createElement('div');
    resultBox.className = 'number-box';
    resultBox.id = 'add-total';
    resultBox.innerHTML = '<span class="result-box result-final">?</span>';

    resultWrapper.appendChild(resultBox);

    // Assembler
    sticksContainer.appendChild(group1Wrapper);
    sticksContainer.appendChild(plusOperator);
    sticksContainer.appendChild(group2Wrapper);
    sticksContainer.appendChild(equalsOperator);
    sticksContainer.appendChild(resultWrapper);

    // Instruction et première question
    instruction.innerHTML = `Compte les bâtonnets <span class="big-number ${gameState.additionColor1}">?</span>`;
    showAdditionStep1Choices();
}

function showAdditionStep1Choices() {
    const answersContainer = document.getElementById('addition-answers');
    answersContainer.innerHTML = '';

    gameState.currentAnswer = gameState.additionNum1;

    const answers = generateAnswerChoices(gameState.additionNum1, 1, 10);
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkAdditionStep(answer, btn, 1);
        answersContainer.appendChild(btn);
    });
}

function showAdditionStep2Choices() {
    const answersContainer = document.getElementById('addition-answers');
    const instruction = document.getElementById('addition-instruction');
    answersContainer.innerHTML = '';

    gameState.currentAnswer = gameState.additionNum2;
    gameState.additionStep = 2;

    instruction.innerHTML = `Compte les bâtonnets <span class="big-number ${gameState.additionColor2}">?</span>`;

    const answers = generateAnswerChoices(gameState.additionNum2, 1, 10);
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkAdditionStep(answer, btn, 2);
        answersContainer.appendChild(btn);
    });
}

function showAdditionStep3Choices() {
    const answersContainer = document.getElementById('addition-answers');
    const instruction = document.getElementById('addition-instruction');
    answersContainer.innerHTML = '';

    const sum = gameState.additionNum1 + gameState.additionNum2;
    gameState.currentAnswer = sum;
    gameState.additionStep = 3;

    instruction.innerHTML = `<span class="big-number ${gameState.additionColor1}">${gameState.additionNum1}</span> + <span class="big-number ${gameState.additionColor2}">${gameState.additionNum2}</span> = <span class="big-number violet">?</span>`;

    const answers = generateAnswerChoices(sum, 2, 10);
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkAdditionStep(answer, btn, 3);
        answersContainer.appendChild(btn);
    });
}

function checkAdditionStep(answer, btn, step) {
    const feedback = document.getElementById('addition-feedback');
    const allButtons = document.querySelectorAll('#addition-answers .answer-btn');

    if (answer === gameState.currentAnswer) {
        btn.classList.add('correct');
        playSuccessSound();
        allButtons.forEach(b => b.disabled = true);

        if (step === 1) {
            // Révéler le premier nombre
            const num1Box = document.querySelector('#add-num1 .result-box');
            num1Box.textContent = answer;
            num1Box.classList.add(gameState.additionColor1);
            num1Box.style.borderStyle = 'solid';

            feedback.textContent = getSuccessMessage();
            feedback.className = 'feedback success';

            setTimeout(() => {
                feedback.innerHTML = '';
                showAdditionStep2Choices();
            }, 1000);

        } else if (step === 2) {
            // Révéler le deuxième nombre
            const num2Box = document.querySelector('#add-num2 .result-box');
            num2Box.textContent = answer;
            num2Box.classList.add(gameState.additionColor2);
            num2Box.style.borderStyle = 'solid';

            feedback.textContent = getSuccessMessage();
            feedback.className = 'feedback success';

            setTimeout(() => {
                feedback.innerHTML = '';
                showAdditionStep3Choices();
            }, 1000);

        } else if (step === 3) {
            // Révéler le résultat final
            const totalBox = document.querySelector('#add-total .result-box');
            totalBox.textContent = answer;
            totalBox.style.borderStyle = 'solid';
            totalBox.style.background = '#58D68D';
            totalBox.style.color = 'white';

            feedback.textContent = getSuccessMessage();
            feedback.className = 'feedback success';
            gameState.scores.addition++;
            updateScore('addition');

            gameState.roundsPlayed++;

            setTimeout(() => {
                if (gameState.roundsPlayed >= 5) {
                    showCelebration();
                } else {
                    startAdditionRound();
                }
            }, 4000);
        }
    } else {
        btn.classList.add('wrong');
        playErrorSound();
        feedback.textContent = getEncouragementMessage();
        feedback.className = 'feedback error';

        setTimeout(() => {
            btn.classList.remove('wrong');
            btn.disabled = true;
            feedback.textContent = 'Compte bien les bâtonnets !';
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
    gameState.subtractionTotal = total;
    gameState.subtractionToRemove = toRemove;

    // Choisir une couleur
    const color = STICK_COLORS[Math.floor(Math.random() * STICK_COLORS.length)];
    gameState.subtractionColor = color;

    // Instruction initiale - inviter l'enfant à placer ses bâtonnets
    instruction.innerHTML = `Place <span class="big-number ${color}">${total}</span> bâtonnets devant toi !`;

    // Créer tous les bâtonnets groupés
    const sticks = createGroupedSticks(container, total, color);

    // Délai pour que l'enfant place ses bâtonnets (3 sec par bâton)
    const countingDelay = total * 3000;

    // Après le délai, annoncer la soustraction
    setTimeout(() => {
        instruction.innerHTML = `<span class="big-number gray">${toRemove}</span> s'en ${toRemove > 1 ? 'vont' : 'va'}... Décale-les ! 👋`;

        // Sélectionner aléatoirement les bâtonnets à enlever
        const toRemoveIndexes = [];
        while (toRemoveIndexes.length < toRemove) {
            const idx = Math.floor(Math.random() * total);
            if (!toRemoveIndexes.includes(idx)) {
                toRemoveIndexes.push(idx);
            }
        }

        // Animer le départ lentement (un par un)
        toRemoveIndexes.forEach((idx, i) => {
            setTimeout(() => {
                sticks[idx].classList.add('leaving');
                // Jouer un petit son pour chaque bâtonnet qui part
                playTone(400 - i * 20, 0.1, 'sine', 0.1);
            }, i * 600); // 600ms entre chaque bâtonnet (plus lent)
        });

        // Après l'animation, griser les bâtonnets (ils restent décalés)
        setTimeout(() => {
            toRemoveIndexes.forEach(idx => {
                // Ajouter 'removed' SANS enlever 'leaving' pour garder la position
                sticks[idx].classList.add('removed');
            });

            // Afficher l'opération de manière ludique
            instruction.innerHTML = `
                <div class="operation-display">
                    <span class="big-number total ${color}">${total}</span>
                    <span class="op-symbol minus"></span>
                    <span class="big-number removed-num">${toRemove}</span>
                    <span class="op-symbol">=</span>
                    <div class="result-box">?</div>
                </div>
            `;

            // Créer les boutons de réponse
            const answers = generateAnswerChoices(remaining, 1, 10);
            answers.forEach(answer => {
                const btn = document.createElement('button');
                btn.className = 'answer-btn';
                btn.textContent = answer;
                btn.onclick = () => checkSubtractionAnswer(answer, btn);
                answersContainer.appendChild(btn);
            });
        }, toRemove * 600 + 1200); // Délai total ajusté

    }, countingDelay); // 3 secondes par bâton pour que l'enfant place les siens
}

function checkSubtractionAnswer(answer, btn) {
    const feedback = document.getElementById('subtraction-feedback');
    const instruction = document.getElementById('subtraction-instruction');
    const allButtons = document.querySelectorAll('#subtraction-answers .answer-btn');
    const resultBox = document.querySelector('#subtraction-screen .result-box');

    if (answer === gameState.currentAnswer) {
        // Bonne réponse
        btn.classList.add('correct');
        playSuccessSound();
        feedback.textContent = getSuccessMessage();
        feedback.className = 'feedback success';
        gameState.scores.subtraction++;
        updateScore('subtraction');

        // Mettre à jour la result-box avec la bonne réponse
        if (resultBox) {
            resultBox.textContent = answer;
            resultBox.style.borderStyle = 'solid';
            resultBox.style.background = '#58D68D';
            resultBox.style.color = 'white';
        }

        allButtons.forEach(b => b.disabled = true);

        gameState.roundsPlayed++;

        // Attendre 4 secondes pour que l'enfant voie l'opération complète
        setTimeout(() => {
            if (gameState.roundsPlayed >= 5) {
                showCelebration();
            } else {
                startSubtractionRound();
            }
        }, 4000);
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
