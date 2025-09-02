// ===================================================================================
//  1. DOM ELEMENT SELECTION
// ===================================================================================
const spinner = document.getElementById('spinner');
const spinButton = document.getElementById('spin-button');
const restartButton = document.getElementById('restart-button');

const player1Panel = document.getElementById('player1-panel');
const player2Panel = document.getElementById('player2-panel');
const player1ScoreEl = document.getElementById('player1-score');
const player2ScoreEl = document.getElementById('player2-score');
const player1WicketsEl = document.getElementById('player1-wickets');
const player2WicketsEl = document.getElementById('player2-wickets');

const gameStatusEl = document.getElementById('game-status');
const resultDisplayEl = document.getElementById('result-display');

const gameOverModal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');

const spinSound = document.getElementById('spin-sound');
const wicketSound = document.getElementById('wicket-sound');
const boundarySound = document.getElementById('boundary-sound');
const gameOverSound = document.getElementById('game-over-sound');

// ===================================================================================
//  2. GAME CONFIGURATION & STATE
// ===================================================================================

const outcomeMap = {
    '1': 36,      // Center of 0-72 degree slice
    '2': 117,     // Center of 72-162 degree slice
    '4': 189,     // Center of 162-216 degree slice
    '6': 234,     // Center of 216-252 degree slice
    'Caught': 270,  // Center of 252-288 degree slice
    'Bowled': 306,  // Center of 288-324 degree slice
    'Run Out': 342, // Center of 324-360 degree slice
};

const weightedOutcomes = [
    '1', '1', '1', '1',
    '2', '2', '2', '2', '2',
    '4', '4', '4',
    '6', '6',
    'Caught', 'Caught',
    'Bowled', 'Bowled',
    'Run Out', 'Run Out'
];

let player1Score, player2Score, player1Wickets, player2Wickets;
let currentPlayer, totalSpins, isSpinning;
let lastFinalAngle = 0; // BUG FIX: Variable to track total rotation

// ===================================================================================
//  3. CORE GAME FUNCTIONS
// ===================================================================================

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}

function initGame() {
    player1Score = 0;
    player2Score = 0;
    player1Wickets = 0;
    player2Wickets = 0;
    currentPlayer = 1;
    totalSpins = 0;
    isSpinning = false;
    lastFinalAngle = 0; // BUG FIX: Reset the angle on new game

    player1ScoreEl.textContent = '0';
    player2ScoreEl.textContent = '0';
    player1WicketsEl.textContent = '0';
    player2WicketsEl.textContent = '0';
    
    gameStatusEl.textContent = "Player 1's Turn";
    resultDisplayEl.textContent = "Click Spin to Start!";
    
    player1Panel.classList.add('active-player');
    player2Panel.classList.remove('active-player');

    gameOverModal.classList.remove('modal-visible');
    gameOverModal.classList.add('modal-hidden');
    spinButton.disabled = false;

    // BUG FIX: Instantly reset spinner visual state for a clean start
    spinner.style.transition = 'none';
    spinner.style.transform = `rotate(0deg)`;
    spinner.offsetHeight; // Force browser to apply the change
    spinner.style.transition = 'transform 7s cubic-bezier(0.25, 1, 0.5, 1)';
}

function handleSpin() {
    if (isSpinning) return; 

    isSpinning = true;
    spinButton.disabled = true;
    resultDisplayEl.textContent = "Spinning...";

    playSound(spinSound);

    const randomIndex = Math.floor(Math.random() * weightedOutcomes.length);
    const result = weightedOutcomes[randomIndex];

    const randomOffset = Math.random() * 15 - 7.5;
    const targetAngle = outcomeMap[result] || 0;
    
    // BUG FIX: Accumulate rotation instead of starting from 0
    lastFinalAngle += (360 * 10) + targetAngle + randomOffset;
    
    spinner.style.transform = `rotate(${lastFinalAngle}deg)`;

    setTimeout(() => {
        processResult(result);
    }, 7000); 
}

function processResult(result) {
    const isOut = isNaN(parseInt(result));
    const runs = parseInt(result);
    
    resultDisplayEl.textContent = `Result: ${result}${isOut ? '' : ' runs!'}`;

    if (isOut) {
        playSound(wicketSound);
    } else if (runs === 4 || runs === 6) {
        playSound(boundarySound);
    }

    if (currentPlayer === 1) {
        if (isOut) {
            player1Wickets++;
        } else {
            player1Score += runs;
        }
        player1ScoreEl.textContent = player1Score;
        player1WicketsEl.textContent = player1Wickets;
    } else {
        if (isOut) {
            player2Wickets++;
        } else {
            player2Score += runs;
        }
        player2ScoreEl.textContent = player2Score;
        player2WicketsEl.textContent = player2Wickets;
    }

    totalSpins++;
    
    if (player1Wickets >= 2 || player2Wickets >= 2 || totalSpins >= 12) {
        endGame();
    } else {
        switchPlayer();
        isSpinning = false;
        spinButton.disabled = false;
        
        // BUG FIX: This block resets the spinner's visual state for the next spin
        setTimeout(() => {
            spinner.style.transition = 'none'; // 1. Turn off animation
            const resetAngle = lastFinalAngle % 360; // 2. Calculate current visual position
            spinner.style.transform = `rotate(${resetAngle}deg)`; // 3. Snap to it instantly
            spinner.offsetHeight; // 4. Force the browser to apply the change
            spinner.style.transition = 'transform 7s cubic-bezier(0.25, 1, 0.5, 1)'; // 5. Turn animation back on
        }, 500);
    }
}

function switchPlayer() {
    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    gameStatusEl.textContent = `Player ${currentPlayer}'s Turn`;
    player1Panel.classList.toggle('active-player');
    player2Panel.classList.toggle('active-player');
}

function endGame() {
    isSpinning = true;
    spinButton.disabled = true;
    
    playSound(gameOverSound);

    let winnerText = '';

    if (player1Wickets >= 2) {
        winnerText = 'Player 1 is knocked out! Player 2 Wins!';
    } else if (player2Wickets >= 2) {
        winnerText = 'Player 2 is knocked out! Player 1 Wins!';
    } else if (player1Score > player2Score) {
        winnerText = `Player 1 Wins by ${player1Score - player2Score} runs!`;
    } else if (player2Score > player1Score) {
        winnerText = `Player 2 Wins by ${player2Score - player1Score} runs!`;
    } else {
        winnerText = "It's a Draw!";
    }

    modalText.textContent = winnerText;
    gameOverModal.classList.remove('modal-hidden');
    gameOverModal.classList.add('modal-visible');
}

// ===================================================================================
//  4. EVENT LISTENERS
// ===================================================================================

document.addEventListener('DOMContentLoaded', initGame);
spinButton.addEventListener('click', handleSpin);
restartButton.addEventListener('click', initGame);