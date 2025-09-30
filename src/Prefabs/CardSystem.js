// CardSystem.js - Handles card creation, deck management, and card operations

class CardSystem {
	constructor(scene) {
		this.scene = scene;
	}

	// Creates a new deck with two of each card (suit + rank combination)
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

	// Creates a card object with suit, rank, and table status
	createCard(suit, rank) {
		return { card: { suit, rank }, table: false };
	}

	// Shuffles the deck using Fisher-Yates algorithm
	shuffle(deck) {
		for (let i = deck.length - 1; i > 0; i--) {
			let j = Math.floor(Math.random() * (i + 1));
			[deck[i], deck[j]] = [deck[j], deck[i]];
		}
		return deck;
	}

	// Deals 7 cards to each player at the start of the game
	dealCards() {
		for (let i = 0; i < 7; i++) {
			this.dealCardToPlayer(this.scene.p1Hand, 1);
			this.dealCardToPlayer(this.scene.p2Hand, 2);
		}
		
		// Update tracked hand lengths after dealing
		if (this.scene.gameLogic) {
			this.scene.gameLogic.updateActualHandLengths();
		}
	}

	// Deals a single card to a specific player's hand
	dealCardToPlayer(hand, playerNumber) {
		const card = this.scene.deck.pop();
		card.originalPosition = { type: "hand", player: playerNumber };
		hand.push(card);
	}

	// Draws a card from the deck and adds it to the current player's hand
	drawCard() {
		if (this.canDrawCard()) {
			const newCard = this.scene.deck.pop();
			newCard.originalPosition = { type: "hand" };
			this.addCardToHand(newCard);
			this.scene.drawn = true;
			this.scene.drawnCard = true;
			
			// Don't update tracked hand lengths here - only when turn ends
			// This allows for proper reset functionality
			
			// Refresh the hand display with the new card to trigger poof effect
			this.scene.handManager.displayHand(newCard);
		} else {
			this.handleInvalidDraw();
		}
	}

	// Checks if the current player can draw a card based on game rules
	canDrawCard() {
		// Basic checks
		if (this.scene.deck.length === 0 || 
			this.scene.drawn || 
			this.scene.drawnCard || 
			this.scene.placedCards) {
			return false;
		}

		// Check if current hand contains any cards that need to return to table
		const currentHand = this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
		
		// Multi-layer check for table cards in hand
		const hasTableCards = currentHand.some(card => 
			// Primary check: cards flagged as must return to table
			card.mustReturnToTable ||
			// Secondary check: cards that originally came from table
			(card.originalPosition && card.originalPosition.type === "table") ||
			// Tertiary check: cards that were on table at start of turn
			(this.scene.gameLogic.cardsOnTableAtTurnStart && 
			 this.scene.gameLogic.cardsOnTableAtTurnStart.includes(card))
		);

		if (hasTableCards) {
			return false;
		}

		// Check if all groups on the table are valid
		if (!this.scene.tableManager.checkTableValidity()) {
			return false;
		}

		return true;
	}

	// Adds a card to the current player's hand
	addCardToHand(newCard) {
		if (this.scene.p1Turn) {
			newCard.originalPosition = { type: "hand", player: 1 };
			this.scene.p1Hand.push(newCard);
		} else {
			newCard.originalPosition = { type: "hand", player: 2 };
			this.scene.p2Hand.push(newCard);
		}
	}

	// Handles invalid draw attempts and provides feedback
	handleInvalidDraw() {
		if (this.scene.deck.length === 0) {
			console.log("Cannot draw: deck is empty");
		} else if (this.scene.drawnCard) {
			console.log("Cannot draw: card already drawn this turn");
		} else if (this.scene.placedCards) {
			console.log("Cannot draw: cards already placed this turn");
		} else {
			// Check specific reasons why drawing is not allowed
			const currentHand = this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
			const hasTableCards = currentHand.some(card => 
				card.mustReturnToTable ||
				(card.originalPosition && card.originalPosition.type === "table") ||
				(this.scene.gameLogic.cardsOnTableAtTurnStart && 
				 this.scene.gameLogic.cardsOnTableAtTurnStart.includes(card))
			);
			
			if (hasTableCards) {
				console.log("Cannot draw: hand contains cards taken from the table that must be returned");
			} else if (!this.scene.tableManager.checkTableValidity()) {
				console.log("Cannot draw: table contains invalid groups");
			} else {
				console.log("Cannot draw: unknown reason");
			}
		}
	}

	getCardFrameIndex(card) {
		return suits.indexOf(card.card.suit) * 13 + ranks.indexOf(card.card.rank);
	}

	// Helper function to get the numeric value of a rank (Ace = 1, 2-10 = face value, J-K = 11-13)
	getRankValue(rank) {
		if (rank === "A") return 1;
		if (rank === "J") return 11;
		if (rank === "Q") return 12;
		if (rank === "K") return 13;
		return parseInt(rank);
	}

	// Validates if a group of cards forms a valid set or run
	checkValidGroup(cards = []) {
		if (cards.length < 3) {
			return false;
		}

		const uniqueRanks = new Set(cards.map((card) => card.card.rank));
		const uniqueSuits = new Set(cards.map((card) => card.card.suit));

		// Check if it's a set (all cards have the same rank but different suits)
		if (uniqueRanks.size === 1 && uniqueSuits.size === cards.length) {
			return true;
		}

		// Check if it's a run (consecutive ranks with the same suit)
		if (uniqueSuits.size === 1) {
			const rankValues = cards
				.map((card) => this.getRankValue(card.card.rank))
				.sort((a, b) => a - b);

			// Check for consecutive ranks (Ace as low)
			for (let i = 1; i < rankValues.length; i++) {
				if (rankValues[i] !== rankValues[i - 1] + 1) {
					// If not consecutive, check if it's a high-ace run
					if (rankValues[0] === 1) {
						// Check if the cards form a high-ace run (A-K-Q-J-10...)
						const highAceValues = cards
							.map((card) => {
								if (card.card.rank === "A") {
									return 14; // Ace high
								}
								return this.getRankValue(card.card.rank);
							})
							.sort((a, b) => a - b);

						for (let i = 1; i < highAceValues.length; i++) {
							if (highAceValues[i] !== highAceValues[i - 1] + 1) {
								return false;
							}
						}
						return true;
					}
					return false;
				}
			}
			return true;
		}

		return false;
	}
}
