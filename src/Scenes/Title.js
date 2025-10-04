// Title.js - Main menu scene with game title and start functionality

class Title extends Phaser.Scene {
	constructor() {
		super("titleScene");
	}

	init() { }

	preload() { }

	// Creates the title screen with game name and start functionality
	create() {
		// Initialize audio system
		this.audioSystem = new AudioSystem(this);
		
		//add any button to start text
		// Menu config
		let menuConfig = {
			fontFamily: "PressStart2P", // Restore original font
			fontSize: "40px",
			backgroundColor: "#000000",
			color: "#FFFFFF",
			align: "center",
			padding: {
				top: 5,
				bottom: 5,
			},
			fixedWidth: 0,
		};
		this.add
			.text(
				centerX,
				h / 3,
				"MILLION CARD GAME\nDedicated to Lois <3",
				menuConfig
			)
			.setOrigin(0.5, 0.5);
		this.add
			.text(centerX, h / 3 + 100, "CLICK the CARD to START", menuConfig)
			.setOrigin(0.5, 0.5);

		// Tutorial button
		const tutorialButton = this.add.text(centerX, h / 3 + 160, "TUTORIAL", {
			fontFamily: "PressStart2P",
			fontSize: "24px",
			backgroundColor: "#2196F3",
			color: "#FFFFFF",
			align: "center",
			padding: {
				x: 15,
				y: 8,
			}
		}).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

		// Tutorial button interaction
		tutorialButton.on('pointerover', () => {
			tutorialButton.setStyle({ backgroundColor: '#1976D2' });
		});

		tutorialButton.on('pointerout', () => {
			tutorialButton.setStyle({ backgroundColor: '#2196F3' });
		});

		tutorialButton.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			this.scene.start("tutorialScene");
		});

		// Settings button - moved to top left
		const settingsButton = this.add.text(50, 50, "SETTINGS", {
			fontFamily: "PressStart2P",
			fontSize: "20px",
			backgroundColor: "#444444",
			color: "#FFFFFF",
			align: "center",
			padding: {
				x: 12,
				y: 6,
			}
		}).setOrigin(0, 0).setInteractive({ useHandCursor: true });

		// Settings button interaction
		settingsButton.on('pointerover', () => {
			settingsButton.setStyle({ backgroundColor: '#666666' });
		});

		settingsButton.on('pointerout', () => {
			settingsButton.setStyle({ backgroundColor: '#444444' });
		});

		settingsButton.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			this.scene.start("settingsScene", { callingScene: "titleScene" });
		});

		// Credits button - moved to bottom left
		const creditsButton = this.add.text(50, h - 50, "CREDITS", {
			fontFamily: "PressStart2P",
			fontSize: "20px",
			backgroundColor: "#8B4513",
			color: "#FFFFFF",
			align: "center",
			padding: {
				x: 12,
				y: 6,
			}
		}).setOrigin(0, 1).setInteractive({ useHandCursor: true });

		// Credits button interaction
		creditsButton.on('pointerover', () => {
			creditsButton.setStyle({ backgroundColor: '#A0522D' });
		});

		creditsButton.on('pointerout', () => {
			creditsButton.setStyle({ backgroundColor: '#8B4513' });
		});

		creditsButton.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			this.scene.start("creditsScene");
		});

		// Exit game button - added to bottom right
		const exitButton = this.add.text(w - 50, h - 50, "EXIT GAME", {
			fontFamily: "PressStart2P",
			fontSize: "20px",
			backgroundColor: "#D32F2F",
			color: "#FFFFFF",
			align: "center",
			padding: {
				x: 12,
				y: 6,
			}
		}).setOrigin(1, 1).setInteractive({ useHandCursor: true });

		// Exit button interaction
		exitButton.on('pointerover', () => {
			exitButton.setStyle({ backgroundColor: '#F44336' });
		});

		exitButton.on('pointerout', () => {
			exitButton.setStyle({ backgroundColor: '#D32F2F' });
		});

		exitButton.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			// Close the game
			if (window.electronAPI) {
				// If running in Electron, close the app
				window.electronAPI.closeApp();
			} else {
				// If running in browser, close the window
				window.close();
			}
		});

		this.card = this.add
			.sprite(centerX, (h / 4) * 3 + 10, "card_deck", 53)
			.setOrigin(0.5, 0.5)
			.setScale(2);

		// Make the card clickable
		this.card.setInteractive();

		// Add pointerover event listener for hovering
		this.card.on("pointerover", () => {
			// Scale the card slightly larger
			this.tweens.add({
				targets: this.card,
				scaleX: 2.1,
				scaleY: 2.1,
				duration: 200,
				ease: "Linear",
			});
		});

		// Add pointerout event listener for when hovering ends
		this.card.on("pointerout", () => {
			// Restore the card to its original scale
			this.tweens.add({
				targets: this.card,
				scaleX: 2,
				scaleY: 2,
				duration: 200,
				ease: "Linear",
			});
		});

		// Listen for pointerdown event on the card
		this.card.on("pointerdown", () => {
			// Play menu button sound
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			
			// Start the player selection scene
			this.scene.start("playerSelectionScene");
		});
	}

	update() { }
}
