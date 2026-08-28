import "./style/styles.scss";

document.addEventListener("DOMContentLoaded", () => {
    // Screens
    const startScreen = document.getElementById("startScreen");
    const settingsScreen = document.getElementById("settingsScreen");
    const gameScreen = document.getElementById("gameScreen");
    const gameOverScreen = document.getElementById("gameOverScreen");

    // Buttons
    const btnPlay = document.getElementById("btnPlay");
    const btnSettingsStart = document.getElementById("btnSettingsStart");
    const btnExitGame = document.getElementById("btnExitGame");
    const btnPlayAgainGaming = document.getElementById("btnPlayAgainGaming");
    const btnPlayAgainCodeVibes = document.getElementById("btnPlayAgainCodeVibes");

    // Summary Elements
    const summaryTheme = document.getElementById("summaryTheme");
    const summaryPlayer = document.getElementById("summaryPlayer");
    const summarySize = document.getElementById("summarySize");

    // Radio Groups
    const themeRadios = document.querySelectorAll('input[name="theme"]') as NodeListOf<HTMLInputElement>;
    const playerRadios = document.querySelectorAll('input[name="player"]') as NodeListOf<HTMLInputElement>;
    const boardSizeRadios = document.querySelectorAll('input[name="boardSize"]') as NodeListOf<HTMLInputElement>;

    // Game Elements
    const gameGrid = document.getElementById("gameGrid");
    const scoreBlueEl = document.getElementById("scoreBlue");
    const scoreOrangeEl = document.getElementById("scoreOrange");
    const currentPlayerDot = document.getElementById("currentPlayerDot");
    const blueScorePill = document.querySelector(".blue-score-pill");
    const orangeScorePill = document.querySelector(".orange-score-pill");

    // Game State
    let scoreBlue = 0;
    let scoreOrange = 0;
    let currentPlayer: 'blue' | 'orange' = 'blue';
    let flippedCards: HTMLElement[] = [];
    let matchedPairs = 0;
    let totalPairs = 0;
    let isLocked = false;

    // Navigation: Start Screen -> Settings
    if (btnPlay) {
        btnPlay.addEventListener("click", () => {
            startScreen?.classList.add("is-hidden");
            settingsScreen?.classList.remove("is-hidden");
        });
    }

    // Helper: Update summary bar
    const updateSummary = () => {
        const selectedTheme = document.querySelector('input[name="theme"]:checked') as HTMLInputElement;
        const selectedPlayer = document.querySelector('input[name="player"]:checked') as HTMLInputElement;
        const selectedSize = document.querySelector('input[name="boardSize"]:checked') as HTMLInputElement;

        if (summaryTheme && selectedTheme) {
            summaryTheme.textContent = selectedTheme.nextElementSibling?.nextElementSibling?.textContent || "Theme";
        }
        
        if (summaryPlayer && selectedPlayer) {
            summaryPlayer.textContent = selectedPlayer.nextElementSibling?.nextElementSibling?.textContent || "Player";
        }
        
        if (summarySize && selectedSize) {
            summarySize.textContent = `${selectedSize.value} cards`;
        }
    };

    themeRadios.forEach(radio => radio.addEventListener("change", updateSummary));
    playerRadios.forEach(radio => radio.addEventListener("change", updateSummary));
    boardSizeRadios.forEach(radio => radio.addEventListener("change", updateSummary));
    updateSummary();

    // --- GAME LOGIC ---

    const initGame = () => {
        const selectedSize = document.querySelector('input[name="boardSize"]:checked') as HTMLInputElement;
        const selectedPlayer = document.querySelector('input[name="player"]:checked') as HTMLInputElement;
        const selectedTheme = document.querySelector('input[name="theme"]:checked') as HTMLInputElement;
        const theme = selectedTheme.value;
        
        const cardCount = parseInt(selectedSize.value); // 16, 24, 36
        totalPairs = cardCount / 2;
        
        // Reset state
        scoreBlue = 0;
        scoreOrange = 0;
        if (scoreBlueEl) scoreBlueEl.textContent = '0';
        if (scoreOrangeEl) scoreOrangeEl.textContent = '0';
        currentPlayer = selectedPlayer.value as 'blue' | 'orange';
        updateTurnUI();
        
        matchedPairs = 0;
        flippedCards = [];
        isLocked = false;
        
        if (!gameGrid) return;
        gameGrid.innerHTML = '';
        
        // Apply theme classes
        if (theme === 'gaming') {
            gameScreen?.classList.add('theme-gaming');
            gameOverScreen?.classList.add('theme-gaming');
        } else {
            gameScreen?.classList.remove('theme-gaming');
            gameOverScreen?.classList.remove('theme-gaming');
        }
        
        // Set grid columns based on size
        if (cardCount === 16) gameGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        if (cardCount === 24) gameGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
        if (cardCount === 36) gameGrid.style.gridTemplateColumns = 'repeat(6, 1fr)';
        
        // Generate deck
        const images = [];
        const folder = theme === 'gaming' ? 'game' : 'green';
        const maxImages = theme === 'gaming' ? 15 : 18;
        
        for (let i = 1; i <= totalPairs; i++) {
            const imgId = ((i - 1) % maxImages) + 1;
            // Use URL to correctly resolve paths in Vite, especially with base paths
            const prefix = theme === 'gaming' ? 'game-card-front-' : 'card-front-';
            const imgSrc = new URL(`./img/${folder}/${prefix}${imgId}.png`, import.meta.url).href;
            images.push(imgSrc);
            images.push(imgSrc); // pair
        }
        
        // Shuffle
        images.sort(() => Math.random() - 0.5);
        
        const backImgSrc = theme === 'gaming' 
            ? new URL('./img/game/game-card-back.png', import.meta.url).href
            : new URL('./img/green/card-back.png', import.meta.url).href;
        
        // Create DOM
        images.forEach((src, idx) => {
            const card = document.createElement("div");
            card.className = "card";
            card.dataset.image = src;
            
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${backImgSrc}" alt="Card back">
                    </div>
                    <div class="card-back">
                        <img src="${src}" alt="Card front">
                    </div>
                </div>
            `;
            
            card.addEventListener("click", () => handleCardClick(card));
            gameGrid.appendChild(card);
        });
    };

    const handleCardClick = (card: HTMLElement) => {
        if (isLocked) return;
        if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
        
        card.classList.add("flipped");
        flippedCards.push(card);
        
        if (flippedCards.length === 2) {
            checkMatch();
        }
    };

    const checkMatch = () => {
        isLocked = true;
        const [card1, card2] = flippedCards;
        const match = card1.dataset.image === card2.dataset.image;
        
        if (match) {
            card1.classList.add("matched");
            card2.classList.add("matched");
            
            // Add score
            if (currentPlayer === 'blue') {
                scoreBlue++;
                if (scoreBlueEl) scoreBlueEl.textContent = scoreBlue.toString();
            } else {
                scoreOrange++;
                if (scoreOrangeEl) scoreOrangeEl.textContent = scoreOrange.toString();
            }
            
            matchedPairs++;
            if (matchedPairs === totalPairs) {
                setTimeout(() => {
                    // Update Gaming Theme view (old logic)
                    const finalScoreBlue = document.getElementById("finalScoreBlue");
                    const finalScoreOrange = document.getElementById("finalScoreOrange");
                    if (finalScoreBlue) finalScoreBlue.textContent = scoreBlue.toString();
                    if (finalScoreOrange) finalScoreOrange.textContent = scoreOrange.toString();
                    
                    // Update Code Vibes View
                    const subtitle = document.getElementById("winnerSubtitle");
                    const title = document.getElementById("winnerTitle");
                    const iconContainer = document.getElementById("winnerIconContainer");
                    const confetti = document.getElementById("confettiContainer");
                    
                    if (subtitle && title && iconContainer && confetti) {
                        // Reset classes
                        title.className = "winner-title";
                        confetti.classList.remove("is-hidden");
                        
                        if (scoreBlue === scoreOrange) {
                            subtitle.textContent = "It's a";
                            title.textContent = "DRAW";
                            title.classList.add("color-draw");
                            confetti.classList.add("is-hidden");
                            iconContainer.innerHTML = `<svg class="icon-draw" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a2 2 0 0 1-2-2 2 2 0 0 1 2-2 2 2 0 0 1 2 2 2 2 0 0 1-2 2Z"/><path d="M12 17V3"/><path d="M5 6h14"/><path d="m5 6-3 7s1 2 3 2 3-2 3-2L5 6Z"/><path d="m19 6-3 7s1 2 3 2 3-2 3-2L19 6Z"/></svg>`;
                        } else if (scoreBlue > scoreOrange) {
                            subtitle.textContent = "The winner is";
                            title.textContent = "BLUE PLAYER";
                            title.classList.add("color-blue");
                            iconContainer.innerHTML = `<svg class="icon-blue" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="m19 22-2-4H7l-2 4h14Z"/><path d="M10 18h4v-3.5L16 9H8l2 5.5V18Z"/></svg>`;
                        } else {
                            subtitle.textContent = "The winner is";
                            title.textContent = "ORANGE PLAYER";
                            title.classList.add("color-orange");
                            iconContainer.innerHTML = `<svg class="icon-orange" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="m19 22-2-4H7l-2 4h14Z"/><path d="M10 18h4v-3.5L16 9H8l2 5.5V18Z"/></svg>`;
                        }
                    }

                    gameScreen?.classList.add("is-hidden");
                    gameOverScreen?.classList.remove("is-hidden");
                }, 500);
            }
            
            flippedCards = [];
            isLocked = false;
        } else {
            setTimeout(() => {
                card1.classList.remove("flipped");
                card2.classList.remove("flipped");
                flippedCards = [];
                switchTurn();
                isLocked = false;
            }, 1000);
        }
    };

    const switchTurn = () => {
        currentPlayer = currentPlayer === 'blue' ? 'orange' : 'blue';
        updateTurnUI();
    };

    const updateTurnUI = () => {
        if (currentPlayerDot) {
            currentPlayerDot.className = `current-player-dot ${currentPlayer}-dot`;
        }
        if (currentPlayer === 'blue') {
            blueScorePill?.classList.add('active');
            orangeScorePill?.classList.remove('active');
        } else {
            blueScorePill?.classList.remove('active');
            orangeScorePill?.classList.add('active');
        }
    };

    // Navigation: Settings -> Game
    if (btnSettingsStart) {
        btnSettingsStart.addEventListener("click", () => {
            settingsScreen?.classList.add("is-hidden");
            gameScreen?.classList.remove("is-hidden");
            initGame();
        });
    }

    // Navigation: Exit Game
    if (btnExitGame) {
        btnExitGame.addEventListener("click", () => {
            gameScreen?.classList.add("is-hidden");
            startScreen?.classList.remove("is-hidden");
        });
    }

    // Navigation: Play Again (Back to Start)
    if (btnPlayAgainGaming) {
        btnPlayAgainGaming.addEventListener("click", () => {
            gameOverScreen?.classList.add("is-hidden");
            startScreen?.classList.remove("is-hidden");
        });
    }
    
    if (btnPlayAgainCodeVibes) {
        btnPlayAgainCodeVibes.addEventListener("click", () => {
            gameOverScreen?.classList.add("is-hidden");
            startScreen?.classList.remove("is-hidden");
        });
    }
});