// PlayerSelection.js - Scene for selecting number of players before starting the game

class PlayerSelection extends Phaser.Scene {
	constructor() {
		super("playerSelectionScene");
	}

	init() {
		this.selectedPlayerCount = 2; // Default to 2 players
		this.minPlayers = 1; // Allow single player now
		this.maxPlayers = 5;
		this.gameMode = 'multiplayer'; // 'singleplayer' or 'multiplayer'
		this.botDifficulty = 'medium'; // For single player mode
	}

	preload() { }

	create() {
		// Initialize audio system
		this.audioSystem = new AudioSystem(this);
		
		// Add background
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		// Create semi-transparent overlay
		const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.5).setOrigin(0, 0);

		// Title
		this.add.text(centerX, h / 6, "GAME SETUP", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		// Game mode selection
		this.add.text(centerX, h / 4, "GAME MODE", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Single Player button
		this.singlePlayerButton = this.add.text(centerX - 120, h / 4 + 50, "SINGLE PLAYER", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: this.gameMode === 'singleplayer' ? '#4CAF50' : '#666666',
			padding: { x: 10, y: 8 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Multiplayer button
		this.multiPlayerButton = this.add.text(centerX + 120, h / 4 + 50, "MULTIPLAYER", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: this.gameMode === 'multiplayer' ? '#4CAF50' : '#666666',
			padding: { x: 10, y: 8 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Player count section (for multiplayer)
		this.playerCountLabel = this.add.text(centerX, h / 2 - 50, "NUMBER OF PLAYERS", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Player count display
		this.playerCountText = this.add.text(centerX, centerY - 10, this.selectedPlayerCount.toString(), {
			fontFamily: 'PressStart2P',
			fontSize: '64px',
			color: '#FFD700', // Gold color
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);

		// Create decrease button
		this.decreaseButton = this.add.text(centerX - 150, centerY - 10, "-", {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#FF4444',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Create increase button
		this.increaseButton = this.add.text(centerX + 150, centerY - 10, "+", {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#44AA44',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Bot difficulty section (for single player)
		this.botDifficultyLabel = this.add.text(centerX, h / 2 - 50, "BOT DIFFICULTY", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5).setVisible(false);

		this.botDifficultyText = this.add.text(centerX, centerY - 10, this.botDifficulty.toUpperCase(), {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFD700',
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5).setVisible(false);

		// Bot difficulty decrease button
		this.botDecreaseButton = this.add.text(centerX - 150, centerY - 10, "◀", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#FF4444',
			padding: { x: 15, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

		// Bot difficulty increase button
		this.botIncreaseButton = this.add.text(centerX + 150, centerY - 10, "▶", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#44AA44',
			padding: { x: 15, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

		// Add deck information text
		this.deckInfoText = this.add.text(centerX, centerY + 70, this.getDeckInfoText(), {
			fontFamily: 'PressStart2P',
			fontSize: '18px',
			color: '#CCCCCC',
			stroke: '#000000',
			strokeThickness: 2,
			align: 'center'
		}).setOrigin(0.5);

		// Start game button
		this.startButton = this.add.text(centerX, centerY + 140, "START GAME", {
			fontFamily: 'PressStart2P',
			fontSize: '28px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#4CAF50',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Back button
		this.backButton = this.add.text(50, h - 50, "BACK", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#FF4444',
			padding: { x: 15, y: 8 }
		}).setOrigin(0, 1).setInteractive({ useHandCursor: true });

		this.addButtonInteractions();
		this.updateDisplay();
	}

	addButtonInteractions() {
		// Game mode buttons
		this.singlePlayerButton
			.on('pointerover', () => {
				if (this.gameMode !== 'singleplayer') {
					this.singlePlayerButton.setStyle({ backgroundColor: '#888888' });
				}
			})
			.on('pointerout', () => {
				this.singlePlayerButton.setStyle({ 
					backgroundColor: this.gameMode === 'singleplayer' ? '#4CAF50' : '#666666' 
				});
			})
			.on('pointerdown', () => {
				this.audioSystem.playButtonPress();
				this.gameMode = 'singleplayer';
				this.selectedPlayerCount = 1;
				this.updateDisplay();
			});

		this.multiPlayerButton
			.on('pointerover', () => {
				if (this.gameMode !== 'multiplayer') {
					this.multiPlayerButton.setStyle({ backgroundColor: '#888888' });
				}
			})
			.on('pointerout', () => {
				this.multiPlayerButton.setStyle({ 
					backgroundColor: this.gameMode === 'multiplayer' ? '#4CAF50' : '#666666' 
				});
			})
			.on('pointerdown', () => {
				this.audioSystem.playButtonPress();
				this.gameMode = 'multiplayer';
				this.selectedPlayerCount = 2;
				this.updateDisplay();
			});

		// Player count buttons (for multiplayer)
		this.decreaseButton
			.on('pointerover', () => {
				if (this.gameMode === 'multiplayer' && this.selectedPlayerCount > this.minPlayers) {
					this.decreaseButton.setStyle({ backgroundColor: '#DD2222' });
				}
			})
			.on('pointerout', () => {
				this.decreaseButton.setStyle({ backgroundColor: '#FF4444' });
			})
			.on('pointerdown', () => {
				if (this.gameMode === 'multiplayer' && this.selectedPlayerCount > 2) {
					this.audioSystem.playButtonPress();
					this.selectedPlayerCount--;
					this.updateDisplay();
				}
			});

		this.increaseButton
			.on('pointerover', () => {
				if (this.gameMode === 'multiplayer' && this.selectedPlayerCount < this.maxPlayers) {
					this.increaseButton.setStyle({ backgroundColor: '#228822' });
				}
			})
			.on('pointerout', () => {
				this.increaseButton.setStyle({ backgroundColor: '#44AA44' });
			})
			.on('pointerdown', () => {
				if (this.gameMode === 'multiplayer' && this.selectedPlayerCount < this.maxPlayers) {
					this.audioSystem.playButtonPress();
					this.selectedPlayerCount++;
					this.updateDisplay();
				}
			});

		// Bot difficulty buttons (for single player)
		this.botDecreaseButton
			.on('pointerover', () => {
				this.botDecreaseButton.setStyle({ backgroundColor: '#DD2222' });
			})
			.on('pointerout', () => {
				this.botDecreaseButton.setStyle({ backgroundColor: '#FF4444' });
			})
			.on('pointerdown', () => {
				this.audioSystem.playButtonPress();
				this.changeBotDifficulty(-1);
			});

		this.botIncreaseButton
			.on('pointerover', () => {
				this.botIncreaseButton.setStyle({ backgroundColor: '#228822' });
			})
			.on('pointerout', () => {
				this.botIncreaseButton.setStyle({ backgroundColor: '#44AA44' });
			})
			.on('pointerdown', () => {
				this.audioSystem.playButtonPress();
				this.changeBotDifficulty(1);
			});

		// Start button
		this.startButton
			.on('pointerover', () => {
				this.startButton.setStyle({ backgroundColor: '#45a049' });
			})
			.on('pointerout', () => {
				this.startButton.setStyle({ backgroundColor: '#4CAF50' });
			})
			.on('pointerdown', () => {
				this.audioSystem.playMenuButton();
				this.startGame();
			});

		// Back button
		this.backButton
			.on('pointerover', () => {
				this.backButton.setStyle({ backgroundColor: '#DD2222' });
			})
			.on('pointerout', () => {
				this.backButton.setStyle({ backgroundColor: '#FF4444' });
			})
			.on('pointerdown', () => {
				this.audioSystem.playMenuButton();
				this.scene.start("titleScene");
			});
	}

	updateDisplay() {
		// Update game mode button colors
		this.singlePlayerButton.setStyle({ 
			backgroundColor: this.gameMode === 'singleplayer' ? '#4CAF50' : '#666666' 
		});
		this.multiPlayerButton.setStyle({ 
			backgroundColor: this.gameMode === 'multiplayer' ? '#4CAF50' : '#666666' 
		});

		// Show/hide appropriate sections
		if (this.gameMode === 'singleplayer') {
			// Hide multiplayer elements
			this.playerCountLabel.setVisible(false);
			this.playerCountText.setVisible(false);
			this.decreaseButton.setVisible(false);
			this.increaseButton.setVisible(false);
			
			// Show bot difficulty elements
			this.botDifficultyLabel.setVisible(true);
			this.botDifficultyText.setVisible(true);
			this.botDecreaseButton.setVisible(true);
			this.botIncreaseButton.setVisible(true);
			
			this.selectedPlayerCount = 1; // Force to 1 for single player
		} else {
			// Show multiplayer elements
			this.playerCountLabel.setVisible(true);
			this.playerCountText.setVisible(true);
			this.decreaseButton.setVisible(true);
			this.increaseButton.setVisible(true);
			
			// Hide bot difficulty elements
			this.botDifficultyLabel.setVisible(false);
			this.botDifficultyText.setVisible(false);
			this.botDecreaseButton.setVisible(false);
			this.botIncreaseButton.setVisible(false);
			
			// Update player count display
			this.playerCountText.setText(this.selectedPlayerCount.toString());
			
			// Update button states
			this.decreaseButton.setAlpha(this.selectedPlayerCount > 2 ? 1 : 0.5);
			this.increaseButton.setAlpha(this.selectedPlayerCount < this.maxPlayers ? 1 : 0.5);
		}
		
		// Update bot difficulty display
		this.botDifficultyText.setText(this.botDifficulty.toUpperCase());
		
		// Update deck info text
		this.deckInfoText.setText(this.getDeckInfoText());
	}

	changeBotDifficulty(direction) {
		const difficulties = ['easy', 'medium', 'hard'];
		let currentIndex = difficulties.indexOf(this.botDifficulty);
		currentIndex += direction;
		
		if (currentIndex < 0) currentIndex = difficulties.length - 1;
		if (currentIndex >= difficulties.length) currentIndex = 0;
		
		this.botDifficulty = difficulties[currentIndex];
		this.updateDisplay();
	}

	getDeckInfoText() {
		let displayPlayerCount = this.selectedPlayerCount;
		if (this.gameMode === 'singleplayer') {
			displayPlayerCount = 2; // Human + Bot
		}
		
		const deckCount = displayPlayerCount >= 5 ? 3 : 2;
		const totalCards = deckCount * 52;
		const cardsPerPlayer = 7;
		const cardsDealt = displayPlayerCount * cardsPerPlayer;
		const remainingCards = totalCards - cardsDealt;
		
		let gameInfo = `${deckCount} Deck${deckCount > 1 ? 's' : ''} (${totalCards} cards)\n` +
		               `${cardsDealt} cards dealt, ${remainingCards} in draw pile`;
		
		if (this.gameMode === 'singleplayer') {
			gameInfo += `\nYou vs ${this.botDifficulty.toUpperCase()} Bot`;
		}
		
		return gameInfo;
	}

	startGame() {
		let actualPlayerCount = this.selectedPlayerCount;
		if (this.gameMode === 'singleplayer') {
			actualPlayerCount = 2; // Human + Bot
		}
		
		// Pass data to the play scene
		this.scene.start("playScene", { 
			playerCount: actualPlayerCount,
			deckCount: actualPlayerCount >= 5 ? 3 : 2,
			gameMode: this.gameMode,
			botDifficulty: this.botDifficulty,
			isSinglePlayer: this.gameMode === 'singleplayer'
		});
	}

	update() { }
}