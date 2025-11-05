class Title extends Phaser.Scene {
	constructor() {
		super("titleScene");
	}

	init() { }

	preload() { }

	create() {
		this.audioSystem = new AudioSystem(this);
		this.controllerSystem = new ControllerSystem(this);
		
		this.createTitleText();
		this.createNavigationButtons();
		this.createMainCard();
	}

	createTitleText() {
		const menuConfig = {
			fontFamily: "PressStart2P",
			fontSize: "40px",
			backgroundColor: "#000000",
			color: "#FFFFFF",
			align: "center",
			padding: { top: 5, bottom: 5 },
			fixedWidth: 0
		};

		this.add.text(centerX, h / 3, "MILLION CARD GAME\nDedicated to Lois <3", menuConfig)
			.setOrigin(0.5, 0.5);
		
		this.add.text(centerX, h / 3 + 100, "CLICK the CARD to START", menuConfig)
			.setOrigin(0.5, 0.5);
	}

	createNavigationButtons() {
		this.createTutorialButton();
		this.createSettingsButton();
		this.createCreditsButton();
		this.createExitButton();
	}

	createTutorialButton() {
		const tutorialButton = this.add.text(centerX, h / 3 + 160, "TUTORIAL", {
			fontFamily: "PressStart2P",
			fontSize: "24px",
			backgroundColor: "#2196F3",
			color: "#FFFFFF",
			align: "center",
			padding: { x: 15, y: 8 }
		}).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

		this.addButtonBehavior(tutorialButton, '#1976D2', '#2196F3', () => {
			this.scene.start("tutorialScene");
		});
	}

	createSettingsButton() {
		const settingsButton = this.add.text(50, 50, "SETTINGS", {
			fontFamily: "PressStart2P",
			fontSize: "20px",
			backgroundColor: "#444444",
			color: "#FFFFFF",
			align: "center",
			padding: { x: 12, y: 6 }
		}).setOrigin(0, 0).setInteractive({ useHandCursor: true });

		this.addButtonBehavior(settingsButton, '#666666', '#444444', () => {
			this.scene.start("settingsScene", { callingScene: "titleScene" });
		});
	}

	createCreditsButton() {
		const creditsButton = this.add.text(50, h - 50, "CREDITS", {
			fontFamily: "PressStart2P",
			fontSize: "20px",
			backgroundColor: "#8B4513",
			color: "#FFFFFF",
			align: "center",
			padding: { x: 12, y: 6 }
		}).setOrigin(0, 1).setInteractive({ useHandCursor: true });

		this.addButtonBehavior(creditsButton, '#A0522D', '#8B4513', () => {
			this.scene.start("creditsScene");
		});
	}

	createExitButton() {
		const exitButton = this.add.text(w - 50, h - 50, "EXIT GAME", {
			fontFamily: "PressStart2P",
			fontSize: "20px",
			backgroundColor: "#D32F2F",
			color: "#FFFFFF",
			align: "center",
			padding: { x: 12, y: 6 }
		}).setOrigin(1, 1).setInteractive({ useHandCursor: true });

		this.addButtonBehavior(exitButton, '#F44336', '#D32F2F', () => {
			this.handleGameExit();
		});
	}

	addButtonBehavior(button, hoverColor, normalColor, clickAction) {
		button.on('pointerover', () => {
			button.setStyle({ backgroundColor: hoverColor });
		});

		button.on('pointerout', () => {
			button.setStyle({ backgroundColor: normalColor });
		});

		button.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			clickAction();
		});
	}

	handleGameExit() {
		if (window.electronAPI) {
			window.electronAPI.closeApp();
		} else {
			window.close();
		}
	}

	createMainCard() {
		this.card = this.add.sprite(centerX, (h / 4) * 3 + 10, "card_deck", 53)
			.setOrigin(0.5, 0.5)
			.setScale(2)
			.setInteractive();

		this.addCardInteractions();
	}

	addCardInteractions() {
		this.card.on("pointerover", () => {
			this.tweens.add({
				targets: this.card,
				scaleX: 2.1,
				scaleY: 2.1,
				duration: 200,
				ease: "Linear"
			});
		});

		this.card.on("pointerout", () => {
			this.tweens.add({
				targets: this.card,
				scaleX: 2,
				scaleY: 2,
				duration: 200,
				ease: "Linear"
			});
		});

		this.card.on("pointerdown", () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			this.scene.start("playerSelectionScene");
		});
	}

	update(time, delta) { 
		if (this.controllerSystem) {
			this.controllerSystem.update(time, delta);
		}
	}
}
