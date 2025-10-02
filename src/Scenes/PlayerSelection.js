// PlayerSelection.js - Scene for selecting number of players before starting the game

class PlayerSelection extends Phaser.Scene {
	constructor() {
		super("playerSelectionScene");
	}

	init() {
		this.selectedPlayerCount = 2; // Default to 2 players
		this.minPlayers = 2;
		this.maxPlayers = 5;
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
		this.add.text(centerX, h / 4, "SELECT NUMBER OF PLAYERS", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		// Player count display
		this.playerCountText = this.add.text(centerX, centerY - 50, this.selectedPlayerCount.toString(), {
			fontFamily: 'PressStart2P',
			fontSize: '64px',
			color: '#FFD700', // Gold color
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);

		// Create decrease button
		this.decreaseButton = this.add.text(centerX - 150, centerY - 50, "-", {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#FF4444',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Create increase button
		this.increaseButton = this.add.text(centerX + 150, centerY - 50, "+", {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#44AA44',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Add deck information text
		this.deckInfoText = this.add.text(centerX, centerY + 50, this.getDeckInfoText(), {
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
		this.backButton = this.add.text(centerX, centerY + 200, "BACK", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#666666',
			padding: { x: 15, y: 8 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		this.addButtonInteractions();
	}

	addButtonInteractions() {
		// Decrease button
		this.decreaseButton
			.on('pointerover', () => {
				if (this.selectedPlayerCount > this.minPlayers) {
					this.decreaseButton.setStyle({ backgroundColor: '#DD2222' });
				}
			})
			.on('pointerout', () => {
				this.decreaseButton.setStyle({ backgroundColor: '#FF4444' });
			})
			.on('pointerdown', () => {
				if (this.selectedPlayerCount > this.minPlayers) {
					this.audioSystem.playButtonPress();
					this.selectedPlayerCount--;
					this.updateDisplay();
				}
			});

		// Increase button
		this.increaseButton
			.on('pointerover', () => {
				if (this.selectedPlayerCount < this.maxPlayers) {
					this.increaseButton.setStyle({ backgroundColor: '#228822' });
				}
			})
			.on('pointerout', () => {
				this.increaseButton.setStyle({ backgroundColor: '#44AA44' });
			})
			.on('pointerdown', () => {
				if (this.selectedPlayerCount < this.maxPlayers) {
					this.audioSystem.playButtonPress();
					this.selectedPlayerCount++;
					this.updateDisplay();
				}
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
				this.backButton.setStyle({ backgroundColor: '#444444' });
			})
			.on('pointerout', () => {
				this.backButton.setStyle({ backgroundColor: '#666666' });
			})
			.on('pointerdown', () => {
				this.audioSystem.playMenuButton();
				this.scene.start("titleScene");
			});
	}

	updateDisplay() {
		// Update player count text
		this.playerCountText.setText(this.selectedPlayerCount.toString());
		
		// Update deck info text
		this.deckInfoText.setText(this.getDeckInfoText());

		// Update button states
		this.decreaseButton.setAlpha(this.selectedPlayerCount > this.minPlayers ? 1 : 0.5);
		this.increaseButton.setAlpha(this.selectedPlayerCount < this.maxPlayers ? 1 : 0.5);
	}

	getDeckInfoText() {
		const deckCount = this.selectedPlayerCount >= 5 ? 3 : 2;
		const totalCards = deckCount * 52;
		const cardsPerPlayer = 7;
		const cardsDealt = this.selectedPlayerCount * cardsPerPlayer;
		const remainingCards = totalCards - cardsDealt;
		
		return `${deckCount} Deck${deckCount > 1 ? 's' : ''} (${totalCards} cards)\n` +
		       `${cardsDealt} cards dealt, ${remainingCards} in draw pile`;
	}

	startGame() {
		// Pass player count to the play scene
		this.scene.start("playScene", { 
			playerCount: this.selectedPlayerCount,
			deckCount: this.selectedPlayerCount >= 5 ? 3 : 2
		});
	}

	update() { }
}