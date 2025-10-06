// Win.js - Displays the winner and handles game completion

class Win extends Phaser.Scene {
	constructor() {
		super("winScene");
	}

	// Receives data about which player won
	init(data) {
		this.winningPlayer = data.winningPlayer || (data.p1Win ? 1 : 2);
		this.p1Win = data.p1Win; // Maintain backwards compatibility
		this.isSinglePlayer = data.isSinglePlayer || false;
	}

	preload() { }

	// Creates the win screen display
	create() {
		// Initialize audio system
		this.audioSystem = new AudioSystem(this);
		// Initialize controller system
		this.controllerSystem = new ControllerSystem(this);
		
		// Add background
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		// Determine winner text
		let winnerText = `Player ${this.winningPlayer} Wins!`;
		let congratsText = "Congratulations!";
		
		// In single player mode, use more descriptive text
		if (this.isSinglePlayer) {
			if (this.winningPlayer === 1) {
				winnerText = "You Win!";
				congratsText = "Well played!";
			} else {
				winnerText = "Bot Wins!";
				congratsText = "Better luck next time!";
			}
		}
		
		// Display winner text
		this.add.text(centerX, centerY - 100, winnerText, {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFD700', // Gold color for winner
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);

		// Add congratulations text
		this.add.text(centerX, centerY - 40, congratsText, {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Create play again button
		const playAgainButton = this.add.text(centerX, centerY + 60, "Play Again", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#4CAF50',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5);

		// Make button interactive
		playAgainButton.setInteractive({ useHandCursor: true })
			.on('pointerover', () => {
				playAgainButton.setStyle({ backgroundColor: '#45a049' });
			})
			.on('pointerout', () => {
				playAgainButton.setStyle({ backgroundColor: '#4CAF50' });
			})
			.on('pointerdown', () => {
				if (this.audioSystem) {
					this.audioSystem.playMenuButton();
				}
				this.scene.start("playerSelectionScene");
			});

		// Add return to title button
		const titleButton = this.add.text(centerX, centerY + 140, "Main Menu", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#2196F3',
			padding: { x: 15, y: 8 }
		}).setOrigin(0.5);

		// Make title button interactive
		titleButton.setInteractive({ useHandCursor: true })
			.on('pointerover', () => {
				titleButton.setStyle({ backgroundColor: '#1976D2' });
			})
			.on('pointerout', () => {
				titleButton.setStyle({ backgroundColor: '#2196F3' });
			})
			.on('pointerdown', () => {
				if (this.audioSystem) {
					this.audioSystem.playMenuButton();
				}
				this.scene.start("titleScene");
			});
	}

	update() { 
		if (this.controllerSystem) {
			this.controllerSystem.update(this.time.now, this.game.loop.delta);
		}
	}
}
