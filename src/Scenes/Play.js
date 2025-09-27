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
		console.log("Created deck with", this.deck.length, "cards");
		// this.deck = this.cardSystem.shuffle(this.deck);
		this.cardSystem.dealCards();
		console.log("After dealing: deck has", this.deck.length, "cards");
		console.log("P1 hand:", this.p1Hand.map(card => `${card.card.rank}_${card.card.suit}`));
		console.log("P2 hand:", this.p2Hand.map(card => `${card.card.rank}_${card.card.suit}`));

		// Display initial hand and start new turn
		this.handManager.displayHand();
		this.startNewTurn();

		// Print deck
		console.log(this.deck);

		// Create validation box
		this.uiSystem.createValidationBox();

		// Add interactivity to buttons and deck
		this.uiSystem.addInteractivity();

		// Show initial pause screen for Player 1 to start the game properly
		this.showPauseScreen();

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

	// Wrapper methods for pause screen functionality (moved to UISystem)
	showPauseScreen() {
		this.uiSystem.showPauseScreen();
	}

	hidePauseScreen() {
		this.uiSystem.hidePauseScreen();
	}
}
