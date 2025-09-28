// Tetris Game Implementation
class TetrisGame {
    constructor() {
        // Game constants
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropCounter = 0;
        this.dropInterval = 1000; // milliseconds
        this.lastTime = 0;
        
        // Touch controls
        this.autoMoveTimer = null;
        this.autoMoveInterval = null;
        
        // Tetris pieces (tetrominoes)
        this.pieces = {
            I: {
                shape: [
                    [1, 1, 1, 1]
                ],
                color: '#00f5ff'
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1]
                ],
                color: '#ffff00'
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1]
                ],
                color: '#a000f0'
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0]
                ],
                color: '#00ff00'
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1]
                ],
                color: '#ff0000'
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1]
                ],
                color: '#0000ff'
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1]
                ],
                color: '#ff8000'
            }
        };
        
        this.pieceTypes = Object.keys(this.pieces);
        
        this.init();
    }
    
    init() {
        // Initialize empty board
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
        
        // Generate first pieces
        this.nextPiece = this.generateRandomPiece();
        this.spawnNewPiece();
        
        // Setup event listeners
        this.setupControls();
        
        // Start game loop
        this.gameRunning = true;
        this.gameLoop();
        
        this.updateDisplay();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    this.score += 1; // Soft drop bonus
                    this.updateDisplay();
                    break;
                case 'ArrowUp':
                case ' ':
                    this.rotatePiece();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    this.restartGame();
                    break;
            }
            e.preventDefault();
        });

        // Touch controls for mobile
        this.setupTouchControls();
        this.setupSwipeGestures();
    }

    setupSwipeGestures() {
        let startX, startY;
        const gameCanvas = this.canvas;
        
        gameCanvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            e.preventDefault();
        }, { passive: false });

        gameCanvas.addEventListener('touchend', (e) => {
            if (!startX || !startY || !this.gameRunning || this.gamePaused) return;
            
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            const minSwipeDistance = 30; // Minimum distance for a swipe
            
            // Check if it's a tap (no significant movement)
            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
                // Tap to rotate
                this.rotatePiece();
            } else {
                // Determine swipe direction
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (deltaX > minSwipeDistance) {
                        this.movePiece(1, 0); // Swipe right
                    } else if (deltaX < -minSwipeDistance) {
                        this.movePiece(-1, 0); // Swipe left
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > minSwipeDistance) {
                        // Swipe down - soft drop
                        this.movePiece(0, 1);
                        this.score += 1;
                        this.updateDisplay();
                    }
                }
            }
            
            startX = startY = null;
            e.preventDefault();
        }, { passive: false });

        // Prevent scrolling while swiping on canvas
        gameCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    setupTouchControls() {
        // Prevent default touch behaviors
        document.addEventListener('touchstart', (e) => {
            if (e.target.classList.contains('control-btn')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.target.classList.contains('control-btn')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Touch button handlers
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        const rotateBtn = document.getElementById('rotateBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        // Left button
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(-1, 0);
                this.startAutoMove('left');
            }
        });

        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopAutoMove();
        });

        // Right button
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(1, 0);
                this.startAutoMove('right');
            }
        });

        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopAutoMove();
        });

        // Down button (soft drop)
        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(0, 1);
                this.score += 1;
                this.updateDisplay();
                this.startAutoMove('down');
            }
        });

        downBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopAutoMove();
        });

        // Rotate button
        rotateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.rotatePiece();
            }
        });

        // Pause button
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.togglePause();
            this.updatePauseButton();
        });

        // Also add click events for desktop testing
        leftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(-1, 0);
            }
        });

        rightBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(1, 0);
            }
        });

        downBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(0, 1);
                this.score += 1;
                this.updateDisplay();
            }
        });

        rotateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.gameRunning && !this.gamePaused) {
                this.rotatePiece();
            }
        });

        pauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePause();
            this.updatePauseButton();
        });
    }

    startAutoMove(direction) {
        this.stopAutoMove(); // Clear any existing auto move
        
        this.autoMoveTimer = setTimeout(() => {
            this.autoMoveInterval = setInterval(() => {
                if (!this.gameRunning || this.gamePaused) {
                    this.stopAutoMove();
                    return;
                }
                
                switch(direction) {
                    case 'left':
                        this.movePiece(-1, 0);
                        break;
                    case 'right':
                        this.movePiece(1, 0);
                        break;
                    case 'down':
                        this.movePiece(0, 1);
                        this.score += 1;
                        this.updateDisplay();
                        break;
                }
            }, 150); // Repeat every 150ms while held
        }, 300); // Start auto-repeat after 300ms delay
    }

    stopAutoMove() {
        if (this.autoMoveTimer) {
            clearTimeout(this.autoMoveTimer);
            this.autoMoveTimer = null;
        }
        if (this.autoMoveInterval) {
            clearInterval(this.autoMoveInterval);
            this.autoMoveInterval = null;
        }
    }

    updatePauseButton() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.gamePaused ? '▶' : '⏸';
        }
    }
    
    generateRandomPiece() {
        const type = this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
        const template = this.pieces[type];
        return {
            shape: template.shape.map(row => [...row]),
            color: template.color,
            x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(template.shape[0].length / 2),
            y: 0
        };
    }
    
    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generateRandomPiece();
        
        // Check for game over
        if (this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
            return;
        }
        
        this.drawNextPiece();
    }
    
    movePiece(dx, dy) {
        if (this.checkCollision(this.currentPiece, this.currentPiece.x + dx, this.currentPiece.y + dy)) {
            if (dy > 0) { // Moving down and hit something
                this.lockPiece();
                return;
            }
            return; // Can't move
        }
        
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
    }
    
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        // Wall kick - try to adjust position if rotation causes collision
        let kicked = false;
        for (let kick of [0, -1, 1, -2, 2]) {
            if (!this.checkCollision(this.currentPiece, this.currentPiece.x + kick, this.currentPiece.y)) {
                this.currentPiece.x += kick;
                kicked = true;
                break;
            }
        }
        
        if (!kicked) {
            // Rotation not possible, revert
            this.currentPiece.shape = originalShape;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    checkCollision(piece, newX, newY) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    // Check boundaries
                    if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
                        boardY >= this.BOARD_HEIGHT) {
                        return true;
                    }
                    
                    // Check collision with existing pieces
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        // Place piece on board
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        this.clearLines();
        
        // Spawn next piece
        this.spawnNewPiece();
        
        this.updateDisplay();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                // Line is full, remove it
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // Score calculation (traditional Tetris scoring)
            const points = [0, 40, 100, 300, 1200][linesCleared] * this.level;
            this.score += points;
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            }
        }
    }
    
    gameLoop(time = 0) {
        if (!this.gameRunning) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.gamePaused) {
            this.dropCounter += deltaTime;
            
            if (this.dropCounter >= this.dropInterval) {
                this.movePiece(0, 1);
                this.dropCounter = 0;
            }
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw locked pieces
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
        
        // Draw pause overlay
        if (this.gamePaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '30px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // Add 3D effect
        this.ctx.fillStyle = this.lightenColor(color, 20);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, 3);
        this.ctx.fillRect(pixelX + 1, pixelY + 1, 3, this.BLOCK_SIZE - 2);
        
        this.ctx.fillStyle = this.darkenColor(color, 20);
        this.ctx.fillRect(pixelX + this.BLOCK_SIZE - 4, pixelY + 4, 3, this.BLOCK_SIZE - 4);
        this.ctx.fillRect(pixelX + 4, pixelY + this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4, 3);
    }
    
    drawPiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, piece.color);
                }
            }
        }
    }
    
    drawNextPiece() {
        // Clear next piece canvas
        this.nextCtx.fillStyle = '#000000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const piece = this.nextPiece;
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - piece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - piece.shape.length * blockSize) / 2;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const pixelX = offsetX + x * blockSize;
                    const pixelY = offsetY + y * blockSize;
                    
                    this.nextCtx.fillStyle = piece.color;
                    this.nextCtx.fillRect(pixelX + 1, pixelY + 1, blockSize - 2, blockSize - 2);
                }
            }
        }
    }
    
    lightenColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        
        const r = parseInt(col.substr(0, 2), 16);
        const g = parseInt(col.substr(2, 2), 16);
        const b = parseInt(col.substr(4, 2), 16);
        
        const newR = Math.min(255, r + amount);
        const newG = Math.min(255, g + amount);
        const newB = Math.min(255, b + amount);
        
        return (usePound ? '#' : '') + 
               ((newR < 16 ? '0' : '') + newR.toString(16)) +
               ((newG < 16 ? '0' : '') + newG.toString(16)) +
               ((newB < 16 ? '0' : '') + newB.toString(16));
    }
    
    darkenColor(color, amount) {
        return this.lightenColor(color, -amount);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        this.updatePauseButton();
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restartGame() {
        this.stopAutoMove(); // Clean up any running timers
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.gamePaused = false;
        document.getElementById('gameOver').style.display = 'none';
        this.updatePauseButton();
        this.init();
    }
}

// Global game instance
let game;

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new TetrisGame();
});

// Global restart function for the button
function restartGame() {
    if (game) {
        game.restartGame();
    }
}