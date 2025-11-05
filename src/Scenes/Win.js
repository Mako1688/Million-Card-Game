class Win extends Phaser.Scene {
	constructor() {
		super("winScene");
	}

	init(data) {
		this.winningPlayer = data.winningPlayer || (data.p1Win ? 1 : 2);
		this.p1Win = data.p1Win;
		this.isSinglePlayer = data.isSinglePlayer || false;
	}

	preload() { }

	create() {
		this.audioSystem = new AudioSystem(this);
		this.controllerSystem = new ControllerSystem(this);
		
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);
		
		this.createWinnerDisplay();
		this.createActionButtons();
	}

	createWinnerDisplay() {
		const { winnerText, congratsText } = this.getWinnerTexts();
		
		this.add.text(centerX, centerY - 100, winnerText, {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFD700',
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);

		this.add.text(centerX, centerY - 40, congratsText, {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2
		}).setOrigin(0.5);
	}

	getWinnerTexts() {
		if (this.isSinglePlayer) {
			return this.winningPlayer === 1 
				? { winnerText: "You Win!", congratsText: "Well played!" }
				: { winnerText: "Bot Wins!", congratsText: "Better luck next time!" };
		}
		return { 
			winnerText: `Player ${this.winningPlayer} Wins!`, 
			congratsText: "Congratulations!" 
		};
	}

	createActionButtons() {
		this.createPlayAgainButton();
		this.createMainMenuButton();
	}

	createPlayAgainButton() {
		const playAgainButton = this.add.text(centerX, centerY + 60, "Play Again", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3,
			backgroundColor: '#4CAF50',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		this.addButtonBehavior(playAgainButton, '#45a049', '#4CAF50', () => {
			this.scene.start("playerSelectionScene");
		});
	}

	createMainMenuButton() {
		const titleButton = this.add.text(centerX, centerY + 140, "Main Menu", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#2196F3',
			padding: { x: 15, y: 8 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		this.addButtonBehavior(titleButton, '#1976D2', '#2196F3', () => {
			this.scene.start("titleScene");
		});
	}

	addButtonBehavior(button, hoverColor, normalColor, action) {
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
			action();
		});
	}

	update() { 
		if (this.controllerSystem) {
			this.controllerSystem.update(this.time.now, this.game.loop.delta);
		}
	}
}
