const gameContainer = document.querySelector('.game-container');
const gameBoard = document.getElementById('game-board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const resultModal = document.getElementById('result-modal');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const difficultyModal = document.getElementById('difficulty-modal');
const landingModal = document.getElementById('landing-modal');
const mainPlayBtn = document.getElementById('main-play-btn');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const starsContainer = document.getElementById('stars-container');

const emojis = ['🚀', '🛸', '🛰️', '🪐', '☄️', '🌌', '🌍', '👽'];

let cards = [];
let flippedCards = [];
let moves = 0;
let matches = 0;
let timer = null;
let seconds = 0;
let isLocked = true;
let gameStarted = false;
let timeLimit = null;
let movesLimit = null;
let currentDifficulty = 'easy';
let unflipTimeout = null;

function setDifficulty(level) {
    currentDifficulty = level;
    if (level === 'easy') {
        timeLimit = null;
        movesLimit = null;
    } else if (level === 'medium') {
        timeLimit = 45;
        movesLimit = null;
    } else if (level === 'hard') {
        timeLimit = 30;
        movesLimit = 20;
    }
    difficultyModal.classList.add('hidden');
    initGame();
}

function initGame() {
    clearInterval(timer);
    gameBoard.innerHTML = '';
    cards = [];
    flippedCards = [];
    moves = 0;
    matches = 0;
    seconds = 0;
    isLocked = false;
    gameStarted = false;
    
    movesEl.textContent = movesLimit ? `0 / ${movesLimit}` : '0';
    timeEl.textContent = timeLimit ? formatTime(timeLimit) : '0:00';
    resultModal.classList.add('hidden');
    difficultyModal.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    const cardValues = [...emojis, ...emojis];
    cardValues.sort(() => Math.random() - 0.5);

    cardValues.forEach((value, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = value;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-face card-front">${value}</div>
            <div class="card-face card-back"></div>
        `;

        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (gameStarted) return;
    gameStarted = true;
    timer = setInterval(() => {
        seconds++;
        if (timeLimit) {
            let timeLeft = timeLimit - seconds;
            if (timeLeft <= 0) {
                timeEl.textContent = '0:00';
                showGameOver('time');
                return;
            }
            timeEl.textContent = formatTime(timeLeft);
        } else {
            timeEl.textContent = formatTime(seconds);
        }
    }, 1000);
}

function flipCard() {
    // If two cards are currently showing and waiting to flip back...
    if (isLocked && flippedCards.length === 2) {
        // Do nothing if we click the exact same cards that are currently shown
        if (this === flippedCards[0] || this === flippedCards[1]) return;
        
        // Fast play: immediately turn them back up so the user can keep clicking quickly
        clearTimeout(unflipTimeout);
        flippedCards[0].classList.remove('flipped');
        flippedCards[1].classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
    } else if (isLocked) {
        return; // Locked for menus, game over, etc
    }

    if (this === flippedCards[0]) return;

    startTimer();

    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        moves++;
        movesEl.textContent = movesLimit ? `${moves} / ${movesLimit}` : moves;
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.value === card2.dataset.value;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
        checkLimits();
    }
}

function checkLimits() {
    if (movesLimit && moves >= movesLimit && matches !== emojis.length) {
        setTimeout(() => showGameOver('moves'), 500);
    }
}

function disableCards() {
    flippedCards[0].removeEventListener('click', flipCard);
    flippedCards[1].removeEventListener('click', flipCard);
    
    flippedCards[0].classList.add('matched');
    flippedCards[1].classList.add('matched');
    
    matches++;
    flippedCards = [];

    if (matches === emojis.length) {
        setTimeout(showVictory, 500);
    } else {
        checkLimits();
    }
}

function unflipCards() {
    isLocked = true;
    unflipTimeout = setTimeout(() => {
        flippedCards[0].classList.remove('flipped');
        flippedCards[1].classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
    }, 1000);
}

function calculateStars() {
    let stars = 1; // Default is 1 star if just finish
    
    if (currentDifficulty === 'easy') {
        if (seconds <= 40 && moves <= 14) stars = 3;
        else if (seconds <= 70 && moves <= 20) stars = 2;
    } else if (currentDifficulty === 'medium') {
        if (seconds <= 25 && moves <= 14) stars = 3;
        else if (seconds <= 35 && moves <= 20) stars = 2;
    } else if (currentDifficulty === 'hard') {
        // hard modes requires lower moves
        if (seconds <= 20 && moves <= 12) stars = 3;
        else if (seconds <= 25 && moves <= 16) stars = 2;
    }
    
    return stars;
}

function renderStars(earnedStars) {
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 3; i++) {
        const star = document.createElement('span');
        star.classList.add('star');
        star.innerHTML = '★';
        starsContainer.appendChild(star);
        
        setTimeout(() => {
            star.classList.add('show');
            if (i <= earnedStars) {
                star.classList.add('earned');
            }
        }, i * 200);
    }
}

function showVictory() {
    clearInterval(timer);
    resultTitle.textContent = 'Stellar Victory! 🚀';
    
    let timeText = timeLimit ? formatTime(seconds) : timeEl.textContent;
    resultMessage.textContent = `Completed in ${moves} moves and ${timeText}.`;
    
    const stars = calculateStars();
    renderStars(stars);
    
    resultModal.classList.remove('hidden');
}

function showGameOver(reason) {
    clearInterval(timer);
    isLocked = true;
    resultTitle.textContent = 'Mission Failed! 💥';
    starsContainer.innerHTML = '';
    if (reason === 'time') {
        resultMessage.textContent = 'You ran out of time!';
    } else {
        resultMessage.textContent = 'You ran out of moves!';
    }
    resultModal.classList.remove('hidden');
}

function showDifficultyMenu() {
    clearInterval(timer);
    gameBoard.innerHTML = '';
    movesEl.textContent = '0';
    timeEl.textContent = '0:00';
    resultModal.classList.add('hidden');
    landingModal.classList.add('hidden');
    difficultyModal.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    isLocked = true;
}

function showLandingMenu() {
    clearInterval(timer);
    gameBoard.innerHTML = '';
    movesEl.textContent = '0';
    timeEl.textContent = '0:00';
    resultModal.classList.add('hidden');
    difficultyModal.classList.add('hidden');
    landingModal.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    isLocked = true;
}

mainPlayBtn.addEventListener('click', showDifficultyMenu);
btnEasy.addEventListener('click', () => setDifficulty('easy'));
btnMedium.addEventListener('click', () => setDifficulty('medium'));
btnHard.addEventListener('click', () => setDifficulty('hard'));
restartBtn.addEventListener('click', showLandingMenu);
playAgainBtn.addEventListener('click', showDifficultyMenu);

isLocked = true;

// Add falling/floating emojis for the dynamic background
function createFloatingEmojis() {
    const container = document.getElementById('floating-emojis');
    if (!container) return;
    
    // Expand the emoji list slightly for more variety
    const emojiList = [...emojis, '⭐', '🌟', '✨', '🌍'];
    
    // Create ~25 floating emojis
    for (let i = 0; i < 25; i++) {
        const emoji = document.createElement('div');
        emoji.classList.add('floating-emoji');
        emoji.innerText = emojiList[Math.floor(Math.random() * emojiList.length)];
        
        // Randomize positions, animation duration, delay and size
        const left = Math.random() * 100;
        const duration = 15 + Math.random() * 25; // 15s to 40s
        const delay = Math.random() * -30; // Start at different times so screen isn't empty initially
        const size = 1.5 + Math.random() * 2.5; // 1.5rem to 4rem
        
        emoji.style.left = `${left}vw`;
        emoji.style.animationDuration = `${duration}s`;
        emoji.style.animationDelay = `${delay}s`;
        emoji.style.fontSize = `${size}rem`;
        
        // Add a parallax-like effect based on size (smaller goes slower and is more blurred)
        if (size < 2.5) {
            emoji.style.filter = 'blur(2px) drop-shadow(0 0 5px rgba(255,255,255,0.1))';
            emoji.style.zIndex = -1;
        } else {
            emoji.style.filter = 'drop-shadow(0 0 10px rgba(255,255,255,0.3))';
            emoji.style.zIndex = 1;
        }
        
        container.appendChild(emoji);
    }
}

// Call on load
createFloatingEmojis();
