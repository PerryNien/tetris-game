// Audio Manager Class
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.isMuted = true; // Default to muted
        this.isAudioInitialized = false;
        this.userInteracted = false;
        
        // Initialize audio context
        this.initAudioContext();
        
        // Generate audio buffers for different sounds
        this.sounds = {};
        this.generateSounds();
        
        // Background music
        this.bgMusic = null;
        this.createBackgroundMusic();
        
        // Setup user interaction listeners for mobile
        this.setupUserInteractionListeners();
    }
    
    initAudioContext() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.masterVolume;
            
            // Create separate gain nodes for music and sound effects
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = this.musicVolume;
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = this.sfxVolume;
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
        }
    }
    
    setupUserInteractionListeners() {
        // List of events that can unlock audio on mobile
        const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
        
        const unlock = () => {
            if (this.userInteracted) return;
            
            this.userInteracted = true;
            this.initializeAudio();
            
            // Remove event listeners after first interaction
            unlockEvents.forEach(event => {
                document.removeEventListener(event, unlock, true);
            });
        };
        
        // Add event listeners for user interaction
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlock, true);
        });
    }
    
    async initializeAudio() {
        if (!this.audioContext || this.isAudioInitialized) return;
        
        try {
            // Resume audio context if it's suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Play a silent sound to unlock audio on mobile
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.01);
            
            this.isAudioInitialized = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
        }
    }
    
    generateSounds() {
        if (!this.audioContext) return;
        
        // Generate different tones for game events
        this.sounds = {
            move: this.createTone(220, 0.1, 'sine'),
            rotate: this.createTone(330, 0.1, 'square'),
            drop: this.createTone(165, 0.2, 'triangle'),
            lineClear: this.createTone(440, 0.3, 'sawtooth'),
            tetris: this.createChord([440, 554, 659], 0.5, 'sine'),
            levelUp: this.createChord([523, 659, 784], 0.4, 'triangle'),
            gameOver: this.createGameOverSound(),
            pause: this.createTone(294, 0.2, 'square')
        };
    }
    
    createTone(frequency, duration, waveType = 'sine') {
        if (!this.audioContext) return null;
        
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            let value = 0;
            
            switch (waveType) {
                case 'sine':
                    value = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
                case 'triangle':
                    value = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'sawtooth':
                    value = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
                    break;
            }
            
            // Apply envelope
            const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 50));
            data[i] = value * envelope * 0.3;
        }
        
        return buffer;
    }
    
    createChord(frequencies, duration, waveType = 'sine') {
        if (!this.audioContext) return null;
        
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            let value = 0;
            
            frequencies.forEach(freq => {
                switch (waveType) {
                    case 'sine':
                        value += Math.sin(2 * Math.PI * freq * t);
                        break;
                    case 'triangle':
                        value += (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t));
                        break;
                }
            });
            
            value /= frequencies.length;
            
            // Apply envelope
            const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 30));
            data[i] = value * envelope * 0.2;
        }
        
        return buffer;
    }
    
    createGameOverSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.0;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / this.audioContext.sampleRate;
            
            // Descending frequency sweep
            const frequency = 440 * (1 - t * 0.8);
            const value = Math.sin(2 * Math.PI * frequency * t);
            
            // Apply envelope
            const envelope = Math.exp(-t * 1.5);
            data[i] = value * envelope * 0.3;
        }
        
        return buffer;
    }
    
    createBackgroundMusic() {
        if (!this.audioContext) return;
        
        // Create a simple background music loop
        this.bgMusic = {
            oscillators: [],
            gainNodes: [],
            isPlaying: false
        };
    }
    
    async playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName] || this.isMuted) return;
        
        // Ensure audio is initialized (important for mobile)
        if (!this.isAudioInitialized && this.userInteracted) {
            await this.initializeAudio();
        }
        
        // Resume audio context if it's suspended (required for some browsers)
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Failed to resume audio context:', error);
                return;
            }
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[soundName];
            source.connect(this.sfxGain);
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', soundName, error);
        }
    }
    
    async startBackgroundMusic() {
        if (!this.audioContext || this.bgMusic.isPlaying || this.isMuted) return;
        
        // Ensure audio is initialized (important for mobile)
        if (!this.isAudioInitialized && this.userInteracted) {
            await this.initializeAudio();
        }
        
        // Resume audio context if needed
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.warn('Failed to resume audio context for music:', error);
                return;
            }
        }
        
        // Simple chord progression for background music
        const notes = [
            { freq: 220, duration: 2 }, // A
            { freq: 246, duration: 2 }, // B
            { freq: 196, duration: 2 }, // G
            { freq: 220, duration: 2 }  // A
        ];
        
        let noteIndex = 0;
        
        const playNextNote = () => {
            if (!this.bgMusic.isPlaying) return;
            
            try {
                const note = notes[noteIndex];
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
                oscillator.type = 'triangle';
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration - 0.1);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.musicGain);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + note.duration);
                
                noteIndex = (noteIndex + 1) % notes.length;
                
                setTimeout(playNextNote, note.duration * 1000);
            } catch (error) {
                console.warn('Error playing background music note:', error);
            }
        };
        
        this.bgMusic.isPlaying = true;
        playNextNote();
    }
    
    stopBackgroundMusic() {
        this.bgMusic.isPlaying = false;
    }
    
    setMasterVolume(volume) {
        this.masterVolume = volume;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : volume;
        }
    }
    
    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.musicGain) {
            this.musicGain.gain.value = volume;
        }
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = volume;
        if (this.sfxGain) {
            this.sfxGain.gain.value = volume;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
        }
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
        
        return this.isMuted;
    }
    
    getAudioState() {
        return {
            isSupported: !!this.audioContext,
            isInitialized: this.isAudioInitialized,
            userInteracted: this.userInteracted,
            isMuted: this.isMuted,
            contextState: this.audioContext ? this.audioContext.state : 'unavailable'
        };
    }
}

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
        
        // Audio system
        this.audioManager = new AudioManager();
        
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
        this.lastTouchTime = 0;
        this.touchDelay = 100; // Minimum time between touch events
        
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
        this.setupAudioControls();
        
        // Start game loop
        this.gameRunning = true;
        this.gameLoop();
        
        this.updateDisplay();
        
        // Ensure mobile audio button shows correct initial state
        this.updateMobileAudioButton();
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Check if game is running first
            if (!this.gameRunning) return;
            
            // Handle pause, restart, and mute even when game is paused
            switch(e.key) {
                case 'p':
                case 'P':
                    this.togglePause();
                    e.preventDefault();
                    return;
                case 'r':
                case 'R':
                    this.restartGame();
                    e.preventDefault();
                    return;
                case 'm':
                case 'M':
                    this.toggleMute();
                    e.preventDefault();
                    return;
            }
            
            // Only handle game controls when not paused
            if (this.gamePaused) return;
            
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
        // Prevent default touch behaviors and improve touch responsiveness
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.control-btn') || e.target.closest('.restart-btn') || e.target.closest('.mute-btn')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.control-btn') || e.target.closest('.restart-btn') || e.target.closest('.mute-btn')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (e.target.closest('.control-btn') || e.target.closest('.restart-btn') || e.target.closest('.mute-btn')) {
                e.preventDefault();
            }
        }, { passive: false });

        // Touch button handlers
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        const rotateBtn = document.getElementById('rotateBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const enableAudioBtn = document.getElementById('enableAudioBtn');
        const restartMobileBtn = document.getElementById('restartMobileBtn');

        // Left button
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(-1, 0);
                this.startAutoMove('left');
            }
        }, { passive: false });

        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.stopAutoMove();
        }, { passive: false });

        // Right button
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(1, 0);
                this.startAutoMove('right');
            }
        }, { passive: false });

        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.stopAutoMove();
        }, { passive: false });

        // Down button (soft drop)
        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(0, 1);
                this.score += 1;
                this.updateDisplay();
                this.startAutoMove('down');
            }
        }, { passive: false });

        downBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.stopAutoMove();
        }, { passive: false });

        // Rotate button
        rotateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.rotatePiece();
            }
        }, { passive: false });

        // Pause button
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePause();
            this.updatePauseButton();
        }, { passive: false });

        // Also add click events for desktop testing
        leftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(-1, 0);
            }
        });

        rightBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(1, 0);
            }
        });

        downBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.movePiece(0, 1);
                this.score += 1;
                this.updateDisplay();
            }
        });

        rotateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.gameRunning && !this.gamePaused) {
                this.rotatePiece();
            }
        });

        pauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePause();
            this.updatePauseButton();
        });

        // Enable audio button for mobile (also works as mute toggle)
        if (enableAudioBtn) {
            // Use more reliable event handling for audio button
            enableAudioBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobileAudioButton();
            }, { passive: false });

            enableAudioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobileAudioButton();
            });
            
            // Also try touchstart as backup
            enableAudioBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
        }

        // Restart button for mobile
        if (restartMobileBtn) {
            restartMobileBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.restartGame();
            }, { passive: false });

            restartMobileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.restartGame();
            });
            
            // Also try touchstart as backup
            restartMobileBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
        }
    }

    setupAudioControls() {
        // Update audio status display
        this.updateAudioStatus();
        
        // Master volume control
        const masterVolumeSlider = document.getElementById('masterVolume');
        const masterVolumeValue = document.getElementById('masterVolumeValue');
        
        masterVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioManager.setMasterVolume(volume);
            masterVolumeValue.textContent = e.target.value + '%';
        });
        
        // Music volume control
        const musicVolumeSlider = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        
        musicVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioManager.setMusicVolume(volume);
            musicVolumeValue.textContent = e.target.value + '%';
        });
        
        // SFX volume control
        const sfxVolumeSlider = document.getElementById('sfxVolume');
        const sfxVolumeValue = document.getElementById('sfxVolumeValue');
        
        sfxVolumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioManager.setSfxVolume(volume);
            sfxVolumeValue.textContent = e.target.value + '%';
        });
        
        // Mute button
        const muteBtn = document.getElementById('muteBtn');
        muteBtn.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Game over restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.restartGame();
            });
            
            restartBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.restartGame();
            }, { passive: false });
            
            // Also try touchstart as backup
            restartBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
        }
        
        // Audio status click to enable
        const audioStatus = document.getElementById('audioStatus');
        audioStatus.addEventListener('click', () => {
            this.enableAudio();
        });
        
        // Update audio status periodically
        setInterval(() => {
            this.updateAudioStatus();
        }, 1000);
    }
    
    async enableAudio() {
        if (this.audioManager && !this.audioManager.isAudioInitialized) {
            this.audioManager.userInteracted = true;
            await this.audioManager.initializeAudio();
            
            // Also unmute audio when enabling for the first time
            if (this.audioManager.isMuted) {
                this.audioManager.toggleMute();
            }
            
            this.updateAudioStatus();
            
            // Start background music if not muted
            if (!this.audioManager.isMuted && this.gameRunning && !this.gamePaused) {
                this.audioManager.startBackgroundMusic();
            }
        } else if (this.audioManager && this.audioManager.isAudioInitialized && this.audioManager.isMuted) {
            // If audio is initialized but muted, unmute it
            this.toggleMute();
        }
    }

    handleMobileAudioButton() {
        if (!this.audioManager || !this.audioManager.audioContext) {
            return;
        }

        if (!this.audioManager.isAudioInitialized) {
            // Audio not initialized yet - enable it and unmute
            this.enableAudio().then(() => {
                // After enabling audio, also unmute it
                if (this.audioManager.isMuted) {
                    this.toggleMute();
                }
            });
        } else {
            // Audio is initialized - toggle mute
            this.toggleMute();
        }
        this.updateMobileAudioButton();
    }

    // Throttle touch events to prevent rapid firing
    canProcessTouch() {
        const now = Date.now();
        if (now - this.lastTouchTime < this.touchDelay) {
            return false;
        }
        this.lastTouchTime = now;
        return true;
    }
    
    updateAudioStatus() {
        const audioStatus = document.getElementById('audioStatus');
        const audioStatusText = document.getElementById('audioStatusText');
        
        if (!audioStatus || !audioStatusText) return;
        
        if (!this.audioManager || !this.audioManager.audioContext) {
            audioStatusText.textContent = '❌ Audio not supported';
            audioStatus.className = 'audio-status disabled';
        } else if (!this.audioManager.isAudioInitialized) {
            audioStatusText.textContent = '🔇 Tap to enable audio';
            audioStatus.className = 'audio-status disabled';
            audioStatus.style.cursor = 'pointer';
        } else if (this.audioManager.isMuted) {
            audioStatusText.textContent = '🔇 Audio muted';
            audioStatus.className = 'audio-status disabled';
            audioStatus.style.cursor = 'pointer';
        } else {
            audioStatusText.textContent = '✅ Audio enabled';
            audioStatus.className = 'audio-status enabled';
            audioStatus.style.cursor = 'default';
        }
        
        // Update mobile audio button
        this.updateMobileAudioButton();
    }

    updateMobileAudioButton() {
        const enableAudioBtn = document.getElementById('enableAudioBtn');
        if (!enableAudioBtn) return;
        
        if (!this.audioManager || !this.audioManager.audioContext) {
            enableAudioBtn.textContent = '🔇';
            enableAudioBtn.className = 'control-btn audio-btn muted';
            enableAudioBtn.style.display = 'none';
        } else if (!this.audioManager.isAudioInitialized) {
            // Show as muted initially since audio is not enabled
            enableAudioBtn.textContent = '🔇';
            enableAudioBtn.className = 'control-btn audio-btn muted';
            enableAudioBtn.style.display = 'flex';
        } else {
            // Audio is initialized - show current mute state
            if (this.audioManager.isMuted) {
                enableAudioBtn.textContent = '🔇';
                enableAudioBtn.className = 'control-btn audio-btn muted';
            } else {
                enableAudioBtn.textContent = '🔊';
                enableAudioBtn.className = 'control-btn audio-btn enabled';
            }
            enableAudioBtn.style.display = 'flex';
        }
    }

    toggleMute() {
        const isMuted = this.audioManager.toggleMute();
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
            muteBtn.classList.toggle('muted', isMuted);
        }
        
        // Also update mobile audio button
        this.updateMobileAudioButton();
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
        
        // Play move sound for horizontal movement
        if (dx !== 0) {
            this.audioManager.playSound('move');
        }
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
        } else {
            // Successful rotation, play sound
            this.audioManager.playSound('rotate');
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
        
        // Play drop sound
        this.audioManager.playSound('drop');
        
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
            
            // Play line clear sound
            if (linesCleared === 4) {
                this.audioManager.playSound('tetris'); // Tetris (4 lines)
            } else {
                this.audioManager.playSound('lineClear');
            }
            
            // Score calculation (traditional Tetris scoring)
            const points = [0, 40, 100, 300, 1200][linesCleared] * this.level;
            this.score += points;
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
                this.audioManager.playSound('levelUp');
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
        this.audioManager.playSound('pause');
        this.updatePauseButton();
        
        if (this.gamePaused) {
            this.audioManager.stopBackgroundMusic();
        } else {
            this.audioManager.startBackgroundMusic();
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playSound('gameOver');
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restartGame() {
        this.stopAutoMove(); // Clean up any running timers
        this.audioManager.stopBackgroundMusic();
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