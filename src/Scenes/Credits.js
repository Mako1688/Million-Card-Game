// Credits.js - Displays game credits and acknowledgments

class Credits extends Phaser.Scene {
	constructor() {
		super("creditsScene");
	}

	init() { }

	preload() { }

	// Creates the credits display
	create() {
		// Initialize audio system
		this.audioSystem = new AudioSystem(this);
		// Initialize controller system
		this.controllerSystem = new ControllerSystem(this);
		
		// Add background
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		// Create semi-transparent overlay
		const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0, 0);

		// Title
		this.add.text(centerX, h / 8, "CREDITS", {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFD700', // Gold color
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);

		// Game title
		this.add.text(centerX, h / 6 + 50, "MILLION CARD GAME", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Marco Ogaz-Vega credits
		this.add.text(centerX, h / 3, "MARCO OGAZ-VEGA", {
			fontFamily: 'PressStart2P',
			fontSize: '28px',
			color: '#FF6B6B', // Green color
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		this.add.text(centerX, h / 3 + 40, "Main Programmer", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		this.add.text(centerX, h / 3 + 65, "Game Design", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		this.add.text(centerX, h / 3 + 90, "Art Assistant", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		this.add.text(centerX, h / 3 + 115, "Sound Design", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Lois Million Zerai credits
		this.add.text(centerX, h / 2 + 50, "LOIS MILLION ZERAI", {
			fontFamily: 'PressStart2P',
			fontSize: '28px',
			color: '#4CAF50', // Green color
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		this.add.text(centerX, h / 2 + 90, "Lead Artist", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		this.add.text(centerX, h / 2 + 115, "Game Design", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		this.add.text(centerX, h / 2 + 140, "Game Inspiration", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Dedication
		this.add.text(centerX, h / 4 * 3, "Made with Love <3", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFB6C1', // Light pink
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);

		// Back button
		const backButton = this.add.text(centerX, h - 80, "BACK TO MENU", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#2196F3',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Back button interaction
		backButton.on('pointerover', () => {
			backButton.setStyle({ backgroundColor: '#1976D2' });
			this.audioSystem.playMenuButton();
		});

		backButton.on('pointerout', () => {
			backButton.setStyle({ backgroundColor: '#2196F3' });
		});

		backButton.on('pointerdown', () => {
			this.audioSystem.playMenuButton();
			this.scene.start("titleScene");
		});
	}

	update() { 
		if (this.controllerSystem) {
			this.controllerSystem.update(this.time.now, this.game.loop.delta);
		}
	}
}
