class Play extends Phaser.Scene {
	constructor() {
		super("playScene");
	}

	init(data) { 
		this.playerCount = data.playerCount || 2;
		this.deckCount = data.deckCount || 2;
		this.gameMode = data.gameMode || 'multiplayer';
		this.botDifficulty = data.botDifficulty || 'medium';
		this.isSinglePlayer = data.isSinglePlayer || false;
	}

	preload() { }

	create() {
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		this.initializeSystems();
		this.setupGame();
		this.setupUI();
	}

	setupGame() {
		this.gameLogic.initializeVariables(this.playerCount);
		
		if (this.isSinglePlayer) {
			this.botPlayer = new BotPlayer(this, 1);
			this.botPlayer.setDifficulty(this.botDifficulty);
		}

		this.deck = this.cardSystem.createDeck(this.deckCount);
		this.deck = this.cardSystem.shuffle(this.deck);
		this.cardSystem.dealCards(this.playerCount);

		this.handManager.displayHand();
		this.startNewTurn();
	}

	setupUI() {
		this.uiSystem.createUIElements();
		this.uiSystem.createValidationBox();
		this.uiSystem.addInteractivity();
		this.showPauseScreen();
		this.animationSystem.initializeParticles();
	}

	initializeSystems() {
		this.cardSystem = new CardSystem(this);
		this.handManager = new HandManager(this);
		this.tableManager = new TableManager(this);
		this.uiSystem = new UISystem(this);
		this.animationSystem = new AnimationSystem(this);
		this.audioSystem = new AudioSystem(this);
		this.gameLogic = new GameLogic(this);
		this.controllerSystem = new ControllerSystem(this);
	}

	poofEffect(x, y) {
		this.animationSystem.poofEffect(x, y);
	}

	update(time, delta) {
		this.uiSystem.displayTurn();
		this.gameLogic.checkWinCondition();
		this.animationSystem.update(time, delta);
		this.controllerSystem.update(time, delta);
	}

	startNewTurn() {
		this.gameLogic.startNewTurn();
	}

	refreshDisplays() {
		this.gameLogic.refreshDisplays();
	}

	resetSelectedCards() {
		this.gameLogic.resetSelectedCards();
	}

	markTurnAsValid() {
		this.gameLogic.markTurnAsValid();
	}

	updateValidationBoxVisibility() {
		this.uiSystem.updateValidationBoxVisibility();
	}

	showPauseScreen() {
		this.uiSystem.showPauseScreen();
	}

	hidePauseScreen() {
		this.uiSystem.hidePauseScreen();
	}

	showInvalidTurnNotification() {
		this.uiSystem.showInvalidTurnNotification();
	}
}
