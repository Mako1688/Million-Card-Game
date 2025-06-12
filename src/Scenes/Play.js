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
		console.log("play scene started");

		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		// Initialize variables
		this.initializeVariables();

		// Create UI elements
		this.createUIElements();

		// Create deck and deal cards
		this.deck = this.createDeck();
		// this.deck = this.shuffle(this.deck);
		console.log(this.deck);
		this.dealCards();

		// Display initial hand and start new turn
		this.displayHand();
		this.startNewTurn();

		// Print deck
		console.log(this.deck);

		// Create validation box
		this.createValidationBox();

		// Add interactivity to buttons and deck
		this.addInteractivity();

		this.poofEmitter = this.add.particles(0, 0, 'poof', {
			speed: { min: 100, max: 500 },
			angle: { min: 0, max: 360 },
			scale: { start: 3, end: 0 },
			alpha: { start: 1, end: 0 },
			lifespan: 500,
			quantity: 100,
			blendMode: 'ADD',
			tint: [0xffffff, 0xffe066, 0xff6666, 0x66ccff],
			emitting: false // Only emit when triggered
		});
		this.poofEmitter.setDepth(10);
	}

	poofEffect(x, y) {
		console.log(`Poof effect at (${x}, ${y})`);
		if (this.poofEmitter) {
			this.poofEmitter.emitParticleAt(x, y, 32);
		}
	}

	initializeVariables() {
		this.handSelected = [];
		this.borderUISize = -25;
		this.turnValid = false;
		this.p1Turn = true;
		this.p2Turn = false;
		this.drawn = false;
		this.drawnCard = false;
		this.placedCards = false;
		this.resetPressed = false;
		this.p1Hand = [];
		this.p2Hand = [];
		this.cardsSelected = [];
		this.tableCards = [];
		//tracks time for wave effect on cards
		this.waveTime = 0;
		this.WAVE_AMPLITUDE = 10;
		this.WAVE_FREQUENCY = 1.5;
	}

	createUIElements() {
		const w = this.scale.width;
		const h = this.scale.height;
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;
		const borderPadding = 10;

		// Create all sprites here
		this.endTurnButton = this.createButton(
			w - borderPadding,
			h - borderPadding * 6,
			"end_turn",
			3,
			1,
			1
		);
		this.restart = this.createButton(
			w - borderPadding,
			borderPadding,
			"restart",
			3,
			1,
			0
		);
		this.deckSprite = this.createDeckSprite(
			w - borderPadding,
			centerY - borderPadding * 5,
			2,
			5
		);

		// Add sort buttons
		this.sortRank = this.createButton(
			this.endTurnButton.x,
			this.endTurnButton.y - this.endTurnButton.height - 50,
			"sort_rank",
			3,
			1,
			1
		);
		this.sortSuit = this.createButton(
			this.sortRank.x,
			this.sortRank.y - this.sortRank.height - 50,
			"sort_suit",
			3,
			1,
			1
		);

		// Menu config
		let menuConfig = {
			fontFamily: "PressStart2P",
			fontSize: "25px",
			backgroundColor: "#000000",
			color: "#FFFFFF",
			align: "center",
			padding: {
				top: 5,
				bottom: 5,
			},
			fixedWidth: 0,
		};

		// Add text for displaying the current player's turn
		this.turnText = this.add
			.text(
				25 + borderPadding * 4,
				h - borderPadding * 15,
				"Turn:\nP1",
				menuConfig
			)
			.setOrigin(0.5, 0.5);
	}

	createButton(x, y, texture, scale, originX, originY) {
		return this.add
			.sprite(x, y, texture, 0)
			.setOrigin(originX, originY)
			.setScale(scale);
	}

	createDeckSprite(x, y, scale, depth) {
		const deckSprite = this.add
			.sprite(x, y, "card_deck", 53)
			.setOrigin(1, 0.5)
			.setScale(scale)
			.setDepth(depth);
		for (let i = 1; i <= 4; i++) {
			this.add
				.sprite(deckSprite.x - 4 * i, deckSprite.y + 4 * i, "card_deck", 53)
				.setOrigin(1, 0.5)
				.setScale(scale)
				.setDepth(depth - i);
		}
		return deckSprite;
	}

	createValidationBox() {
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;
		this.validationBox = this.add
			.rectangle(centerX, centerY + 100, 200, 100, 0x00ff00)
			.setOrigin(0.5)
			.setInteractive()
			.setVisible(false);
		this.validationBox.on("pointerdown", () => {
			this.handleValidPlay();
			this.turnValid = true;
		});
	}

	addInteractivity() {
		this.addButtonInteractivity(
			this.endTurnButton,
			this.endTurn,
			this.displayHand,
			this.displayTable
		);
		this.addButtonInteractivity(this.restart, this.resetHandToTable);
		this.addDeckInteractivity(this.deckSprite);
		this.addButtonInteractivity(
			this.sortRank,
			this.sortRankHand,
			this.displayHand,
			this.displayTable
		);
		this.addButtonInteractivity(
			this.sortSuit,
			this.sortSuitHand,
			this.displayHand,
			this.displayTable
		);
	}

	addButtonInteractivity(button, onClick, ...callbacks) {
		button.setInteractive();
		button.on("pointerover", () => {
			console.log(`${button.texture.key} hover`);
			button.setFrame(2);
		});
		button.on("pointerout", () => {
			console.log(`${button.texture.key} not hover`);
			button.setFrame(0);
		});
		button.on("pointerdown", () => {
			console.log(`${button.texture.key} press`);
			onClick.call(this);
			button.setFrame(1);
			callbacks.forEach((callback) => callback.call(this));
		});
	}

	addDeckInteractivity(deckSprite) {
		deckSprite.setInteractive();
		deckSprite.on("pointerover", () => {
			console.log(this.deck);
			console.log("deckSprite hovered");
			this.tweens.add({
				targets: deckSprite,
				scaleX: 2.1,
				scaleY: 2.1,
				duration: 200,
				ease: "Linear",
			});
		});
		deckSprite.on("pointerout", () => {
			console.log("deckSprite not hovered");
			this.tweens.add({
				targets: deckSprite,
				scaleX: 2,
				scaleY: 2,
				duration: 200,
				ease: "Linear",
			});
		});
		deckSprite.on("pointerdown", () => {
			console.log("deckSprite clicked!");
			this.drawCard();
			this.turnValid = true;
			this.displayHand();
			this.displayTable();
		});
	}

	update(time, delta) {
		this.displayTurn();
		this.checkWinCondition();

		this.waveTime += delta / 1000; // Convert ms to seconds
		this.applyHandWaveEffect();
		this.applyTableWaveEffect();
	}

	applyHandWaveEffect() {
		if (this.handSelected) {
			this.handSelected.forEach((cardSprite, i) => {
				if (cardSprite && !cardSprite.input?.dragState) {
					const baseY = cardSprite.baseY ?? (this.scale.height - this.borderUISize * 2);
					const interactionOffsetY = cardSprite.interactionOffsetY ?? 0;
					const waveOffset = Math.sin(
						this.waveTime * this.WAVE_FREQUENCY + i * 0.5
					) * this.WAVE_AMPLITUDE;
					cardSprite.y = baseY + interactionOffsetY + waveOffset;
				}
			});
		}
	}

	applyTableWaveEffect() {
		if (!this.tableCards) return;
		this.tableCards.forEach((group, groupIndex) => {
			group.forEach((card, cardIndex) => {
				const sprite = card.sprite;
				// Skip wave if any card in group is being dragged
				if (sprite && !card.isDragging) {
					const baseY = sprite.baseY ?? sprite.y;
					const interactionOffsetY = sprite.interactionOffsetY ?? 0;
					const waveOffset = Math.sin(
						this.waveTime * this.WAVE_FREQUENCY + groupIndex + cardIndex * 0.5
					) * this.WAVE_AMPLITUDE * 0.7;
					sprite.y = baseY + interactionOffsetY + waveOffset;
				}
			});
		});
	}

	checkWinCondition() {
		if (!this.resetPressed) {
			if (this.p1Hand.length === 0) {
				this.handleWin(true);
			} else if (this.p2Hand.length === 0) {
				this.handleWin(false);
			}
		}
	}

	handleWin(p1Win) {
		console.log(p1Win ? "Player 1 wins" : "Player 2 wins");
		this.scene.start("winScene", { p1Win });
	}

	createDeck() {
		let deck = [];
		for (let suit of suits) {
			for (let rank of ranks) {
				deck.push(this.createCard(suit, rank));
				deck.push(this.createCard(suit, rank));
			}
		}
		return deck;
	}

	createCard(suit, rank) {
		return { card: { suit, rank }, table: false };
	}

	shuffle(deck) {
		for (let i = deck.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[deck[i], deck[j]] = [deck[j], deck[i]];
		}
		return deck;
	}

	dealCards() {
		for (let i = 0; i < 7; i++) {
			this.dealCardToPlayer(this.p1Hand);
			this.dealCardToPlayer(this.p2Hand);
		}
	}

	dealCardToPlayer(hand) {
		const card = this.deck.pop();
		card.originalPosition = { type: "hand" };
		hand.push(card);
	}

	displayHand(newCard = null) {
		const currentHand = this.getCurrentHand();
		this.clearExistingHandSprites();
		const spacing = this.calculateCardSpacing(currentHand.length);
		const startX = this.calculateStartX(currentHand.length, spacing);
		this.handSelected = this.createHandSprites(currentHand, startX, spacing);

		// Poof effect for the new card, if provided
		if (newCard && newCard.sprite) {
			this.poofEffect(newCard.sprite.x, newCard.sprite.y - 100);
		}
	}

	getCurrentHand() {
		return this.p1Turn ? this.p1Hand : this.p2Hand;
	}

	clearExistingHandSprites() {
		this.handSelected.forEach((card) => {
			card.destroy();
		});
	}

	calculateCardSpacing(handLength) {
		const minX = 200;
		const maxX = 1450;
		const cardWidth = 75;
		const totalHandWidth = handLength * cardWidth;

		return totalHandWidth > maxX - minX
			? (maxX - minX) / handLength
			: cardWidth;
	}

	calculateStartX(handLength, spacing) {
		return (this.scale.width - (handLength - 1) * spacing) / 2;
	}

	createHandSprites(currentHand, startX, spacing) {
		const handSprites = [];
		for (let i = 0; i < currentHand.length; i++) {
			const xPosition = startX + i * spacing;
			const frameIndex = this.getCardFrameIndex(currentHand[i]);
			const cardSprite = this.createCardSprite(xPosition, frameIndex);

			cardSprite.baseY = this.scale.height - this.borderUISize * 2;
			cardSprite.interactionOffsetY = 0;

			this.addCardInteractivity(cardSprite, currentHand[i], i);
			handSprites.push(cardSprite);

			// Set initial position when displaying the hand
			currentHand[i].sprite = cardSprite;
		}
		return handSprites;
	}

	getCardFrameIndex(card) {
		return suits.indexOf(card.card.suit) * 13 + ranks.indexOf(card.card.rank);
	}

	createCardSprite(xPosition, frameIndex) {
		return this.add
			.sprite(
				xPosition,
				this.scale.height - this.borderUISize * 2,
				"card_deck",
				frameIndex
			)
			.setOrigin(0.5, 1)
			.setScale(2)
			.setInteractive()
		// .setData('baseY', this.scale.height - this.borderUISize * 2)
		// .setData('interactionOffsetY', 0);
	}

	addCardInteractivity(cardSprite, card, index) {
		cardSprite.on("pointerover", () => this.handlePointerOver(cardSprite, card));
		cardSprite.on("pointerout", () => this.handlePointerOut(cardSprite, card));
		cardSprite.on("pointerdown", () =>
			this.handlePointerDown(card, index, cardSprite)
		);
	}

	handlePointerOver(cardSprite) {
		this.tweens.add({
			targets: cardSprite,
			interactionOffsetY: -50,
			duration: 180,
			ease: "Cubic.easeOut"
		});
	}

	handlePointerOut(cardSprite, card) {
		const target = card.selected ? -50 : 0;
		this.tweens.add({
			targets: cardSprite,
			interactionOffsetY: target,
			duration: 180,
			ease: "Cubic.easeOut"
		});
	}

	handlePointerDown(card, index, cardSprite) {
		console.log("Card selected: ", card.card);
		this.selectCard(index, this.p1Turn ? "p1Hand" : "p2Hand", cardSprite);
		const target = card.selected ? -50 : 0;
		this.tweens.add({
			targets: cardSprite,
			interactionOffsetY: target,
			duration: 180,
			ease: "Cubic.easeOut"
		});
	}

	//Snoopert fry pic lmao

	drawCard() {
		if (this.canDrawCard()) {
			const newCard = this.deck.pop();
			this.addCardToHand(newCard);
			this.drawnCard = true;
			this.turnValid = true;
			this.disableCardInteractivity();
			this.displayHand(newCard);
		} else {
			this.handleInvalidDraw();
		}
	}

	canDrawCard() {
		const hasPlacedInitialHandCard = this.tableCards.some((group) =>
			group.some((card) => card.originalPosition.type === "hand")
		);
		return this.deck.length > 0 && !this.drawnCard && !hasPlacedInitialHandCard;
	}

	addCardToHand(newCard) {
		newCard.originalPosition = { type: "hand" };
		if (this.p1Turn) {
			this.p1Hand.push(newCard);
		} else {
			this.p2Hand.push(newCard);
		}
	}

	handleInvalidDraw() {
		if (this.drawnCard) {
			console.log("You can only draw once per turn.");
		} else {
			console.log(
				"You cannot draw cards after placing cards from your initial hand."
			);
		}
	}

	disableCardInteractivity() {
		this.handSelected.forEach((cardSprite) => {
			cardSprite.disableInteractive();
		});
		if (this.tableSprites) {
			this.tableSprites.forEach((groupContainer) => {
				groupContainer.list.forEach((cardSprite) => {
					cardSprite.disableInteractive();
				});
			});
		}
	}

	// Function to enable card interactivity
	enableCardInteractivity() {
		this.handSelected.forEach((cardSprite) => {
			cardSprite.setInteractive();
		});
		if (this.tableSprites) {
			this.tableSprites.forEach((groupContainer) => {
				groupContainer.list.forEach((cardSprite) => {
					cardSprite.setInteractive();
				});
			});
		}
	}

	checkValidGroup(cards = []) {
		if (cards.length < 3) {
			return false;
		}

		const ranks = cards.map((card) => card.card.rank);
		const suits = cards.map((card) => card.card.suit);
		const uniqueRanks = new Set(ranks);
		const uniqueSuits = new Set(suits);

		// Check for a set (all cards have the same rank)
		if (uniqueRanks.size === 1 && uniqueSuits.size === cards.length) {
			return true;
		}

		// Check for a run (all cards have the same suit and form a sequence)
		if (uniqueSuits.size === 1) {
			// Treat Ace as low (1) for the initial check
			const rankValues = cards.map((card) => this.getRankValue(card.card.rank));

			// Sort and check for consecutive values
			rankValues.sort((a, b) => a - b);

			let isValidRun = true;
			for (let i = 1; i < rankValues.length; i++) {
				if (rankValues[i] !== rankValues[i - 1] + 1) {
					isValidRun = false;
					break;
				}
			}

			// If the initial check fails, retry with Ace as high (14)
			if (!isValidRun && ranks.includes("A")) {
				const highAceValues = cards.map((card) =>
					card.card.rank === "A" ? 14 : this.getRankValue(card.card.rank)
				);

				highAceValues.sort((a, b) => a - b);

				isValidRun = true;
				for (let i = 1; i < highAceValues.length; i++) {
					if (highAceValues[i] !== highAceValues[i - 1] + 1) {
						isValidRun = false;
						break;
					}
				}
			}

			return isValidRun;
		}

		return false;
	}

	// Helper function to get the value of a rank, considering Aces high or low
	getRankValue(rank) {
		if (rank === "A") {
			return 1; // Ace can be either 1 (low) or 14 (high)
		}
		if (rank === "2") {
			return 2;
		}
		if (rank === "3") {
			return 3;
		}
		if (rank === "4") {
			return 4;
		}
		if (rank === "5") {
			return 5;
		}
		if (rank === "6") {
			return 6;
		}
		if (rank === "7") {
			return 7;
		}
		if (rank === "8") {
			return 8;
		}
		if (rank === "9") {
			return 9;
		}
		if (rank === "10") {
			return 10;
		}
		if (rank === "J") {
			return 11;
		}
		if (rank === "Q") {
			return 12;
		}
		if (rank === "K") {
			return 13;
		}
	}

	displayTable() {
		console.log(this.tableCards);
		this.clearPreviousTableSprites();
		this.tableSprites = [];
		const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();
		let currentX = minX;
		let currentY = minY;
		this.tableCards.forEach((group, groupIndex) => {
			if (currentX + group.length * colWidth > maxX) {
				currentX = minX;
				currentY += rowHeight;
			}
			this.displayTableGroup(group, groupIndex, currentX, currentY);
			currentX += group.length * colWidth + colWidth + colWidth; // increment for the next group
		});
	}

	clearPreviousTableSprites() {
		if (this.tableSprites) {
			this.tableSprites.forEach((group) => {
				group.forEach((cardSprite) => {
					cardSprite.destroy();
				});
			});
		}
	}

	getTableDimensions() {
		return {
			minX: 80,
			minY: 112,
			maxX: this.deckSprite.x - 20,
			rowHeight: 150, // height of each row
			colWidth: 50, // width of each card
		};
	}

	displayTableGroup(group, groupIndex, currentX, currentY) {
		this.sortGroup(group);
		const colWidth = 50; // width of each card

		let initialDragPosition = { x: 0, y: 0 };
		let totalDragDistance = 0;

		// Clear previous sprites for this group
		group.forEach((card) => {
			if (card.sprite) {
				card.sprite.destroy();
			}
		});

		group.forEach((card, cardIndex) => {
			const frameIndex = this.getCardFrameIndex(card);
			const cardSprite = this.createCardSpriteForTable(
				card,
				frameIndex,
				currentX,
				currentY,
				cardIndex,
				colWidth
			);
			this.addCardDragInteractivity(
				cardSprite,
				card,
				group,
				groupIndex,
				initialDragPosition,
				totalDragDistance
			);
			card.sprite = cardSprite;
		});

		// Ensure the display order is correct
		this.sortGroup(group);
		group.forEach((card, index) => {
			card.sprite.setDepth(index);
		});
	}

	createCardSpriteForTable(
		card,
		frameIndex,
		currentX,
		currentY,
		cardIndex,
		colWidth
	) {
		const sprite = this.add
			.sprite(
				card.newPosition ? card.newPosition.x : currentX + cardIndex * colWidth,
				card.newPosition ? card.newPosition.y : currentY,
				"card_deck",
				frameIndex
			)
			.setOrigin(0.5)
			.setScale(2)
			.setInteractive();

		sprite.baseY = card.newPosition ? card.newPosition.y : currentY;
		sprite.interactionOffsetY = 0;

		return sprite;
	}

	addCardDragInteractivity(cardSprite, card, group, groupIndex) {
		this.input.setDraggable(cardSprite);

		cardSprite.on("pointerdown", (pointer) => {
			card.initialDragPosition = { x: pointer.x, y: pointer.y };
			card.totalDragDistance = 0;
			// Mark all cards in group as dragging
			group.forEach((groupCard) => groupCard.isDragging = true);
		});

		cardSprite.on("drag", (pointer, dragX, dragY) => {
			const deltaX = dragX - card.initialDragPosition.x;
			const deltaY = dragY - card.initialDragPosition.y;

			// Accumulate total drag distance
			card.totalDragDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			const groupBounds = this.calculateGroupBounds(group);
			const newGroupX = groupBounds.x + deltaX;
			const newGroupY = groupBounds.y + deltaY;
			const clampedGroupX = Phaser.Math.Clamp(
				newGroupX,
				20,
				this.scale.width - groupBounds.width - 20
			);
			const clampedGroupY = Phaser.Math.Clamp(
				newGroupY,
				112,
				this.scale.height - this.borderUISize - groupBounds.height - 100
			);

			const clampedDeltaX = clampedGroupX - groupBounds.x;
			const clampedDeltaY = clampedGroupY - groupBounds.y;

			group.forEach((groupCard) => {
				const sprite = groupCard.sprite;
				sprite.x += clampedDeltaX;
				sprite.y += clampedDeltaY;
				groupCard.newPosition = { x: sprite.x, y: sprite.y };
			});

			card.initialDragPosition = { x: dragX, y: dragY };
		});

		cardSprite.on("dragend", (pointer, dragX, dragY) => {
			// Unmark dragging for all cards in group
			group.forEach((groupCard) => groupCard.isDragging = false);
			// After drag, update baseY for wave effect to new y
			group.forEach((groupCard) => {
				if (groupCard.sprite) {
					groupCard.sprite.baseY = groupCard.sprite.y;
				}
			});
			// Only treat as click if the drag distance was very small
			if (card.totalDragDistance < 20) {
				this.handleCardClickOnTable(card, group, groupIndex);
			} else {
				this.updateGroupCardPositions(group);
				this.updateAndSortGroup(group);
			}
		});
	}

	calculateGroupBounds(group) {
		const minX = Math.min(...group.map((card) => card.sprite.x));
		const minY = Math.min(...group.map((card) => card.sprite.y));
		const maxX = Math.max(...group.map((card) => card.sprite.x));
		const maxY = Math.max(...group.map((card) => card.sprite.y));
		return {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY,
		};
	}

	handleCardClickOnTable(card, group, groupIndex) {
		if (this.drawnCard) {
			console.log("You cannot select cards after drawing. End your turn.");
			return;
		}
		if (this.cardsSelected.length > 0) {
			const result = this.addToGroup(this.cardsSelected, groupIndex);
			if (result) {
				const currentHand = this.p1Turn ? this.p1Hand : this.p2Hand;
				this.cardsSelected.forEach((card) => {
					const indexInHand = currentHand.indexOf(card);
					if (indexInHand !== -1) {
						currentHand.splice(indexInHand, 1);
					}
				});
				this.cardsSelected = [];
				this.displayHand();
				this.validationBox.setVisible(false);
			}
		} else {
			this.addToHand(card, groupIndex);
		}
	}

	updateGroupCardPositions(group) {
		group.forEach((groupCard) => {
			groupCard.newPosition = {
				x: groupCard.sprite.x,
				y: groupCard.sprite.y,
			};
		});
	}

	handleValidPlay() {
		const currentHand = this.getCurrentHand();
		this.moveSelectedCardsToTable(currentHand);
		this.refreshDisplays();
		this.markTurnAsValid();
	}

	moveSelectedCardsToTable(currentHand) {
		this.tableCards.push([...this.cardsSelected]);
		const newGroup = this.tableCards[this.tableCards.length - 1];

		// Use the new helper to find a non-overlapping spot
		const { x, y } = this.findAvailableGroupPosition(newGroup.length);
		const cardWidth = 50;
		this.setGroupCardPositions(newGroup, x, y, cardWidth);

		this.cardsSelected.forEach((card) => {
			card.table = true;
			this.poofEffect(card.sprite.x, card.sprite.y); // Poof at hand position
			this.removeCardFromHand(currentHand, card);
		});
	}

	removeCardFromHand(hand, card) {
		const indexInHand = hand.indexOf(card);
		if (indexInHand !== -1) {
			hand.splice(indexInHand, 1);
		}
	}

	refreshDisplays() {
		this.displayTable();
		this.resetSelectedCards();
		this.displayHand();
	}

	resetSelectedCards() {
		this.cardsSelected.forEach((card) => (card.selected = false));
		this.cardsSelected = [];
		this.validationBox.setVisible(false);
	}

	markTurnAsValid() {
		this.placedCards = true;
	}

	selectCard(index, hand, cardSprite) {
		if (this.drawnCard) {
			console.log("You cannot select cards after drawing. End your turn.");
			return;
		}

		const card = this[hand][index];
		card.selected
			? this.deselectCard(card, cardSprite)
			: this.selectCardForPlay(card, cardSprite);

		this.updateValidationBoxVisibility();
	}

	deselectCard(card, cardSprite) {
		card.selected = false;
		this.cardsSelected = this.cardsSelected.filter(
			(selectedCard) => selectedCard !== card
		);
		this.stopWaveTint(cardSprite);
		this.moveCardToOriginalPosition(cardSprite);
	}

	selectCardForPlay(card, cardSprite) {
		card.selected = true;
		this.cardsSelected.push(card);
		this.startWaveTint(cardSprite, 0x00ff00);
	}

	clearCardTint(cardSprite) {
		cardSprite.clearTint();
	}

	moveCardToOriginalPosition(cardSprite) {
		this.tweens.add({
			targets: cardSprite,
			y: cardSprite.y + 50,
			duration: 200,
			ease: "Linear",
		});
	}

	tintCard(cardSprite) {
		cardSprite.setTint(0x00ff00);
	}

	startWaveTint(cardSprite, color, duration = 600, repeat = -1) {
		// Remove any existing tint tween
		if (cardSprite.tintTween) {
			cardSprite.tintTween.stop();
			cardSprite.tintTween = null;
		}
		// Animate the tint in a wave (pulse) pattern
		cardSprite.tintTween = this.tweens.addCounter({
			from: 0,
			to: 100,
			duration: duration,
			yoyo: true,
			repeat: repeat,
			onUpdate: tween => {
				// Calculate a wave between white and the target color
				const t = tween.getValue() / 100;
				const r = Phaser.Display.Color.Interpolate.ColorWithColor(
					Phaser.Display.Color.ValueToColor(0xffffff),
					Phaser.Display.Color.ValueToColor(color),
					1,
					t
				);
				cardSprite.setTint(Phaser.Display.Color.GetColor(r.r, r.g, r.b));
			}
		});
	}

	stopWaveTint(cardSprite) {
		if (cardSprite.tintTween) {
			cardSprite.tintTween.stop();
			cardSprite.tintTween = null;
		}
		cardSprite.clearTint();
	}

	updateValidationBoxVisibility() {
		if (this.cardsSelected.length >= 3) {
			const isValidGroup = this.checkValidGroup(this.cardsSelected);
			console.log(`Is valid group: ${isValidGroup}`);
			this.validationBox.setVisible(isValidGroup);
			if (isValidGroup) {
				this.positionValidationBox();
			}
		} else {
			this.validationBox.setVisible(false);
		}
	}

	positionValidationBox() {
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;
		this.validationBox.setPosition(centerX, centerY + 100);
	}

	endTurn() {
		if (this.checkTurnValidity()) {
			this.updateOriginalPositions();
			this.switchTurn();
			this.resetTurnFlags();
			this.enableCardInteractivity();
			this.startNewTurn();
		} else {
			console.log("You must complete a valid action before ending your turn.");
		}
	}

	updateOriginalPositions() {
		this.tableCards.forEach((group, groupIndex) => {
			group.forEach((card) => {
				card.originalPosition = { type: "table", groupIndex: groupIndex };
			});
		});
	}

	switchTurn() {
		this.p1Turn = !this.p1Turn;
	}

	resetTurnFlags() {
		this.turnValid = false;
		this.drawnCard = false;
		this.placedCards = false;
		this.validationBox.setVisible(false);
	}

	// Function to sort hand by rank
	sortRankHand() {
		if (this.p1Turn) {
			this.p1Hand.sort(
				(a, b) => suits.indexOf(a.card.suit) - suits.indexOf(b.card.suit)
			);
			this.p1Hand.sort(
				(a, b) => ranks.indexOf(a.card.rank) - ranks.indexOf(b.card.rank)
			);
		} else {
			this.p2Hand.sort(
				(a, b) => suits.indexOf(a.card.suit) - suits.indexOf(b.card.suit)
			);
			this.p2Hand.sort(
				(a, b) => ranks.indexOf(a.card.rank) - ranks.indexOf(b.card.rank)
			);
		}
	}

	// Function to sort hand by suit
	sortSuitHand() {
		if (this.p1Turn) {
			this.p1Hand.sort(
				(a, b) => ranks.indexOf(a.card.rank) - ranks.indexOf(b.card.rank)
			);
			this.p1Hand.sort(
				(a, b) => suits.indexOf(a.card.suit) - suits.indexOf(b.card.suit)
			);
		} else {
			this.p2Hand.sort(
				(a, b) => ranks.indexOf(a.card.rank) - ranks.indexOf(b.card.rank)
			);
			this.p2Hand.sort(
				(a, b) => suits.indexOf(a.card.suit) - suits.indexOf(b.card.suit)
			);
		}
	}

	displayTurn() {
		// Update text based on the current player's turn
		let turnText = this.p1Turn ? "Turn:\nP1" : "Turn:\nP2";
		this.turnText.setText(turnText);
	}

	checkTableValidity() {
		let allValid = true;
		this.tableCards.forEach((group) => {
			const isValid = this.checkValidGroup(group);
			group.forEach((card) => {
				if (card.sprite) {
					if (!isValid) {
						this.startWaveTint(card.sprite, 0xff0000); // Red wave
					} else {
						this.stopWaveTint(card.sprite);
					}
				}
			});
			if (!isValid) allValid = false;
		});
		this.turnValid = allValid && this.checkAllGroupsValid();
	}

	addToGroup(cards, groupIndex) {
		const group = this.tableCards[groupIndex];
		const isValid = this.checkValidGroup([...group, ...cards]);
		if (isValid) {
			this.updateGroupWithNewCards(group, cards);
			this.updateAndSortGroup(group);
			this.placedCards = true;
			this.displayTable();
			this.checkTableValidity();
			return true;
		}
		return false;
	}

	updateGroupWithNewCards(group, cards) {
		const currentX = group[0].sprite.x;
		const currentY = group[0].sprite.y;
		const cardWidth = 50; // Assuming card width is 50

		this.destroyGroupSprites(group);
		group.push(...cards);
		this.sortGroup(group);
		this.setGroupCardPositions(group, currentX, currentY, cardWidth);
		this.updateAndSortGroup(group);
	}

	destroyGroupSprites(group) {
		group.forEach((card) => {
			card.sprite.destroy();
		});
	}

	setGroupCardPositions(group, currentX, currentY, cardWidth) {
		group.forEach((card, index) => {
			card.newPosition = { x: currentX + index * cardWidth, y: currentY };
			if (card.sprite) {
				card.sprite.x = card.newPosition.x;
				card.sprite.y = card.newPosition.y;
			}
			const frameIndex = this.getCardFrameIndex(card);
			if (!card.sprite) {
				card.sprite = this.createCardSpriteForTable(
					card,
					frameIndex,
					card.newPosition.x,
					card.newPosition.y
				);
				this.input.setDraggable(card.sprite);
				this.poofEffect(card.newPosition.x, card.newPosition.y); // Poof at table position
			}
		});
	}

	addToHand(card, groupIndex) {
		const currentHand = this.getCurrentHand();
		const group = this.tableCards[groupIndex];
		const cardIndex = group.indexOf(card);

		if (cardIndex !== -1) {
			group.splice(cardIndex, 1);
			card.table = false;
			card.selected = false;
			currentHand.push(card);
			this.turnValid = false;

			if (group.length === 0) {
				this.tableCards.splice(groupIndex, 1);
			} else {
				this.updateAndSortGroup(group);
			}

			if (card.sprite) {
				card.sprite.destroy();
				delete card.sprite;
			}

			this.displayTable();
			this.displayHand(card);
			this.checkTableValidity();
		}
	}

	resetHandToTable() {
		// Temporarily disable win condition check
		this.resetPressed = true;

		console.log("Resetting hand to table...");
		console.log("Current hand before reset:", this.getCurrentHand());
		console.log("Table cards before reset:", this.tableCards);

		const currentHand = this.getCurrentHand();
		const cardsToReset = this.collectCardsToReset(currentHand);

		this.destroyTableSprites();
		this.removeCardsFromHand(currentHand, cardsToReset);
		this.removeCardsFromGroups(cardsToReset);
		this.resetCardsToInitialState(cardsToReset, currentHand);

		this.tableCards = this.tableCards.filter((group) => group.length > 0);
		this.clearSelectedCards();
		this.resetTableCardPositions();

		this.refreshDisplays();

		console.log("Current hand after reset:", this.getCurrentHand());
		console.log("Table cards after reset:", this.tableCards);

		// Re-enable win condition check
		this.resetPressed = false;
	}

	resetCardsToInitialState(cardsToReset, currentHand) {
		console.log("Resetting cards to initial state...");
		cardsToReset.forEach((card) => {
			console.log("Resetting card:", card);
			if (card.originalPosition && card.originalPosition.type === "table") {
				const originalGroup = this.tableCards[card.originalPosition.groupIndex];
				if (originalGroup) {
					originalGroup.push(card);
				} else {
					this.tableCards[card.originalPosition.groupIndex] = [card];
				}
				card.sprite = this.createCardSpriteForTable(
					card,
					this.getCardFrameIndex(card),
					card.originalPosition.position.x,
					card.originalPosition.position.y,
					0,
					50
				);
				this.input.setDraggable(card.sprite);
			} else if (
				card.originalPosition &&
				card.originalPosition.type === "hand"
			) {
				currentHand.push(card);
				// Do not create a new sprite here, as the position will be recalculated when displaying the hand
			}
		});
	}

	collectCardsToReset(currentHand) {
		const cardsToReset = [];

		currentHand.forEach((card) => {
			if (card.originalPosition) {
				cardsToReset.push(card);
			}
		});

		this.tableCards.forEach((group) => {
			group.forEach((card) => {
				if (card.originalPosition) {
					cardsToReset.push(card);
				}
			});
		});

		return cardsToReset;
	}

	destroyTableSprites() {
		this.tableCards.forEach((group) => {
			group.forEach((card) => {
				if (card.sprite) {
					card.sprite.destroy();
					delete card.sprite; // Remove reference to the destroyed sprite
				}
			});
		});
	}

	removeCardsFromHand(currentHand, cardsToReset) {
		for (let i = currentHand.length - 1; i >= 0; i--) {
			if (cardsToReset.includes(currentHand[i])) {
				currentHand.splice(i, 1);
			}
		}
	}

	removeCardsFromGroups(cardsToReset) {
		this.tableCards.forEach((group) => {
			for (let i = group.length - 1; i >= 0; i--) {
				if (cardsToReset.includes(group[i])) {
					group.splice(i, 1);
				}
			}
		});
	}

	clearSelectedCards() {
		this.cardsSelected.forEach((cardObject) => {
			if (cardObject.sprite) {
				cardObject.sprite.clearTint(); // Remove tint
			}
		});
		this.cardsSelected = [];
		this.placedCards = false;
	}

	resetTableCardPositions() {
		const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();
		let currentX = minX;
		let currentY = minY;

		this.tableCards.forEach((group) => {
			if (currentX + group.length * colWidth > maxX) {
				currentX = minX;
				currentY += rowHeight;
			}

			group.forEach((card, cardIndex) => {
				card.newPosition = { x: currentX + cardIndex * colWidth, y: currentY };
			});

			currentX += group.length * colWidth + colWidth + colWidth; // increment for the next group
		});
	}

	startNewTurn() {
		this.p1Hand.forEach((card) => {
			if (card.sprite) {
				card.originalPosition = { type: "hand" };
			}
		});
		this.p2Hand.forEach((card) => {
			if (card.sprite) {
				card.originalPosition = { type: "hand" };
			}
		});
		this.tableCards.forEach((group, groupIndex) => {
			group.forEach((card) => {
				if (card.sprite) {
					card.originalPosition = {
						type: "table",
						groupIndex: groupIndex,
						position: { x: card.sprite.x, y: card.sprite.y },
					};
				}
			});
		});

		// Display the hand and table at the start of the turn
		this.displayHand();
		this.displayTable();
	}

	checkAllGroupsValid() {
		let allGroupsValid = true;
		this.tableCards.forEach((group) => {
			if (group.length < 3 || !this.checkValidGroup(group)) {
				allGroupsValid = false;
			}
		});
		return allGroupsValid;
	}

	checkTurnValidity() {
		if (this.drawnCard) {
			console.log("Turn is valid because a card has been drawn.");
			return true;
		}

		if (this.placedCards) {
			const allGroupsValid = this.checkAllGroupsValid();
			const placedFromInitialHand = this.tableCards.some((group) =>
				group.some((card) => card.originalPosition.type === "hand")
			);

			if (allGroupsValid && placedFromInitialHand) {
				console.log(
					"Turn is valid because cards have been placed from the initial hand and all groups are valid."
				);
				return true;
			}
		}

		console.log("Turn is not valid.");
		return false;
	}

	updateAndSortGroup(group) {
		this.sortGroup(group);
		const currentX = group[0].sprite.x;
		const currentY = group[0].sprite.y;
		const cardWidth = 50;
		this.setGroupCardPositions(group, currentX, currentY, cardWidth);
	}

	sortGroup(group) {
		// Sort the group by rank considering Ace as both high and low
		group.sort((a, b) => {
			let rankA = a.card.rank;
			let rankB = b.card.rank;

			// Handle Ace as both high and low
			if (rankA === "A" && rankB !== "2") rankA = "1";
			if (rankB === "A" && rankA !== "2") rankB = "1";

			// Compare ranks
			return this.getRankValue(rankA) - this.getRankValue(rankB);
		});

		// Sort by alternating colors
		this.sortByAlternatingColors(group);

		// Update positions based on sorting
		const colWidth = 50;
		const initialX = group[0].sprite ? group[0].sprite.x : 0;
		const initialY = group[0].sprite ? group[0].sprite.y : 0;

		group.forEach((card, index) => {
			if (card.sprite) {
				card.sprite.x = initialX + index * colWidth;
				card.sprite.setDepth(index);
			}
		});
	}

	sortByAlternatingColors(group) {
		// Sort the group by rank first
		group.sort(
			(a, b) => this.getRankValue(a.card.rank) - this.getRankValue(b.card.rank)
		);

		const redCards = group.filter(
			(card) => card.card.suit === "heart" || card.card.suit === "diamond"
		);
		const blackCards = group.filter(
			(card) => card.card.suit === "spade" || card.card.suit === "club"
		);

		const sortedGroup = [];
		let useRed = redCards.length >= blackCards.length; // Start with the color group that has more cards

		while (redCards.length > 0 || blackCards.length > 0) {
			if (useRed && redCards.length > 0) {
				sortedGroup.push(redCards.shift());
			} else if (!useRed && blackCards.length > 0) {
				sortedGroup.push(blackCards.shift());
			}
			useRed = !useRed; // Alternate color for the next card
		}

		// Reassign sorted cards to the original group array
		for (let i = 0; i < group.length; i++) {
			group[i] = sortedGroup[i];
		}
	}

	findAvailableGroupPosition(groupLength) {
		const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();
		let currentX = minX;
		let currentY = minY;
		let placed = false;

		// Gather bounding boxes of all existing groups
		const groupBounds = this.tableCards.map(group => {
			return {
				x: group[0]?.sprite?.x ?? 0,
				y: group[0]?.sprite?.y ?? 0,
				width: group.length * colWidth,
				height: rowHeight
			};
		});

		while (!placed) {
			// Proposed bounding box for the new group
			const newBounds = {
				x: currentX,
				y: currentY,
				width: groupLength * colWidth,
				height: rowHeight
			};

			// Check for overlap with any existing group
			const overlaps = groupBounds.some(bounds =>
				bounds.x < newBounds.x + newBounds.width &&
				bounds.x + bounds.width > newBounds.x &&
				bounds.y < newBounds.y + newBounds.height &&
				bounds.y + bounds.height > newBounds.y
			);

			if (!overlaps) {
				return { x: currentX, y: currentY };
			}

			// Move to next row if not enough space in this row
			currentX += colWidth * groupLength + colWidth * 2;
			if (currentX + groupLength * colWidth > maxX) {
				currentX = minX;
				currentY += rowHeight;
			}
		}
	}
}
