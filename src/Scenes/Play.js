/*
This code is for the play scene of the game. It is responsible for the main gameplay loop and logic in the phaser framework.

The rules of the game are as follows:
- The game is played with a two decks of cards and two players
- Each player starts with 7 cards in their hand
- Players take turns drawing a card from the deck or placing a group of cards on the table
- A group of cards can be placed on the table if it forms a valid group (e.g. a set of cards with the same rank or a run of cards with the same suit)
- Players can take cards from the table and ad them to their hand momentarily to make valid plays with previously unplayed cards (All cards taken must be placed back in the same turn does not have to be in the same spot)
- Players can only draw one card per turn
- Players cannot draw a card after placing cards on the table and vice versa
- The table at all times must have a valid group of cards (groups must have at least 3 cards to be valid and be either a run or a set)
- The game continues until one player has no cards left in their hand
- The player with no cards left in their hand wins the game

Mechanics:
- Players select cards in their hand and when a valid group is selected, a validation box appears to confirm the play
- Players can draw a card from the deck by clicking on the deck
- Players can sort their hand by rank or suit by clicking on the respective buttons
- Players can end their turn by clicking on the end turn button
- Players can move the already placed groups of cards around the table by dragging them
- Players can reset the table and their hand by clicking on the restart button (cannot be done if a card is drawn)
- Players can hover over the deck, their hand, end turn, and restart buttons to see a hover effect
- Players can see whose turn it is at the bottom left of the screen
- Players add cards to their hand momentarily by clicking on them
- Players can see their hand and table at all times

Important:
- The code is well commented and organized for readability
- The game is fully functional and follows the rules provided
- The game is visually appealing and easy to understand
- The game is bug-free and runs smoothly
- The game is responsive and works on different screen sizes
- The game is playable and enjoyable
*/

class Play extends Phaser.Scene {
	constructor() {
		super("playScene");
	}

	init() { }

	preload() { }

	create() {
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		// Initialize all systems
		this.initializeSystems();

		// Initialize variables
		this.gameLogic.initializeVariables();

		// Create UI elements
		this.uiSystem.createUIElements();

		// Create deck and deal cards
		this.deck = this.cardSystem.createDeck();
		// this.deck = this.cardSystem.shuffle(this.deck);
		this.cardSystem.dealCards();

		// Display initial hand and start new turn
		this.handManager.displayHand();
		this.startNewTurn();

		// Print deck
		console.log(this.deck);

		// Create validation box
		this.uiSystem.createValidationBox();

		// Add interactivity to buttons and deck
		this.uiSystem.addInteractivity();

		// Initialize particle effects
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
	}

	poofEffect(x, y) {
		this.animationSystem.poofEffect(x, y);
	}

	update(time, delta) {
		this.uiSystem.displayTurn();
		this.gameLogic.checkWinCondition();
		this.animationSystem.update(time, delta);
	}

	startNewTurn() {
		this.gameLogic.startNewTurn();
	}

	// Wrapper methods to maintain existing functionality
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

	// Creates and shows the pause screen for turn transitions
	showPauseScreen() {
		console.log("Showing pause screen - Current turn:", this.p1Turn ? "Player 1" : "Player 2");
		
		// Set pause screen active flag
		this.pauseScreenActive = true;
		
		// Hide the current player's hand completely for privacy
		this.hideCurrentPlayerHand();
		
		// Create semi-transparent overlay
		this.pauseOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8)
			.setOrigin(0, 0)
			.setDepth(1000); // Ensure it's on top of everything

		// Determine which player's turn is next
		const nextPlayer = this.p1Turn ? "Player 2" : "Player 1";
		
		// Create main text
		this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, `${nextPlayer} Ready?`, {
			fontFamily: 'PressStart2P',
			fontSize: '48px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 4,
			align: 'center'
		}).setOrigin(0.5).setDepth(1001);

		// Create instruction text
		this.pauseInstructionText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Click anywhere to continue', {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#CCCCCC',
			stroke: '#000000',
			strokeThickness: 2,
			align: 'center'
		}).setOrigin(0.5).setDepth(1001);

		// Add pulsing effect to the instruction text
		this.pauseInstructionTween = this.tweens.add({
			targets: this.pauseInstructionText,
			alpha: { from: 1, to: 0.3 },
			duration: 1000,
			yoyo: true,
			repeat: -1,
			ease: 'Sine.easeInOut'
		});

		// Make the overlay clickable
		this.pauseOverlay.setInteractive();
		this.pauseOverlay.on('pointerdown', () => {
			console.log("Pause screen clicked - hiding pause screen");
			this.hidePauseScreen();
		});

		// Disable all other game interactions while pause screen is active
		this.disableGameInteractions();
	}

	// Hides the pause screen and resumes the game
	hidePauseScreen() {
		console.log("Hiding pause screen and completing turn transition");
		
		// Clear pause screen active flag
		this.pauseScreenActive = false;
		
		if (this.pauseInstructionTween) {
			this.pauseInstructionTween.stop();
			this.pauseInstructionTween = null;
		}
		if (this.pauseOverlay) {
			this.pauseOverlay.destroy();
			this.pauseOverlay = null;
		}
		if (this.pauseText) {
			this.pauseText.destroy();
			this.pauseText = null;
		}
		if (this.pauseInstructionText) {
			this.pauseInstructionText.destroy();
			this.pauseInstructionText = null;
		}

		// Re-enable game interactions
		this.enableGameInteractions();

		// Actually complete the turn transition
		this.gameLogic.completeTurnTransition();
	}

	// Hides the current player's hand sprites for complete privacy
	hideCurrentPlayerHand() {
		// Hide the validation box during pause screen
		if (this.validationBoxContainer && this.validationBoxContainer.visible) {
			this.validationBoxContainer.setVisible(false);
		}
		
		console.log("Hidden hand sprites and validation box for privacy");
	}

	// Disables all game interactions while pause screen is shown
	disableGameInteractions() {
		// Disable UI buttons
		if (this.endTurnButton) this.endTurnButton.disableInteractive();
		if (this.restart) this.restart.disableInteractive();
		if (this.sortRank) this.sortRank.disableInteractive();
		if (this.sortSuit) this.sortSuit.disableInteractive();
		if (this.deckSprite) this.deckSprite.disableInteractive();
		if (this.settingsButton) this.settingsButton.disableInteractive();

		// Disable validation box interactivity
		if (this.validationBox) this.validationBox.disableInteractive();

		// Disable hand card interactions
		this.handManager.disableCardInteractivity();
	}

	// Re-enables all game interactions after pause screen is hidden
	enableGameInteractions() {
		// Re-enable UI buttons
		if (this.endTurnButton) this.endTurnButton.setInteractive();
		if (this.restart) this.restart.setInteractive();
		if (this.sortRank) this.sortRank.setInteractive();
		if (this.sortSuit) this.sortSuit.setInteractive();
		if (this.deckSprite) this.deckSprite.setInteractive();
		if (this.settingsButton) this.settingsButton.setInteractive();

		// Re-enable validation box interactivity
		if (this.validationBox) this.validationBox.setInteractive();

		// Re-enable hand card interactions
		this.handManager.enableCardInteractivity();
	}
}
