class Credits extends Phaser.Scene {
	constructor() {
		super("creditsScene");
	}

	init() { }

	preload() { }

	create() {
		this.audioSystem = new AudioSystem(this);
		this.controllerSystem = new ControllerSystem(this);
		
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);
		this.createOverlay();
		this.createCreditsContent();
		this.createBackButton();
	}

	createOverlay() {
		this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0, 0);
	}

	createCreditsContent() {
		this.createTitle();
		this.createGameTitle();
		this.createMarcoCredits();
		this.createLoisCredits();
		this.createDedication();
	}

	createTitle() {
		this.add.text(centerX, h / 8, "CREDITS", {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFD700',
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);
	}

	createGameTitle() {
		this.add.text(centerX, h / 6 + 50, "MILLION CARD GAME", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);
	}

	createMarcoCredits() {
		this.add.text(centerX, h / 3, "MARCO OGAZ-VEGA", {
			fontFamily: 'PressStart2P',
			fontSize: '28px',
			color: '#FF6B6B',
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		const marcoRoles = ["Main Programmer", "Game Design", "Art Assistant", "Sound Design"];
		marcoRoles.forEach((role, index) => {
			this.add.text(centerX, h / 3 + 40 + (index * 25), role, {
				fontFamily: 'PressStart2P',
				fontSize: '16px',
				color: '#FFFFFF',
				stroke: '#000000',
				strokeThickness: 2
			}).setOrigin(0.5);
		});
	}

	createLoisCredits() {
		this.add.text(centerX, h / 2 + 50, "LOIS MILLION ZERAI", {
			fontFamily: 'PressStart2P',
			fontSize: '28px',
			color: '#4CAF50',
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		const loisRoles = ["Lead Artist", "Game Design", "Game Inspiration"];
		loisRoles.forEach((role, index) => {
			this.add.text(centerX, h / 2 + 90 + (index * 25), role, {
				fontFamily: 'PressStart2P',
				fontSize: '16px',
				color: '#FFFFFF',
				stroke: '#000000',
				strokeThickness: 2
			}).setOrigin(0.5);
		});
	}

	createDedication() {
		this.add.text(centerX, h / 4 * 3, "Made with Love <3", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFB6C1',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);
	}

	createBackButton() {
		const backButton = this.add.text(centerX, h - 80, "BACK TO MENU", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#2196F3',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

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
