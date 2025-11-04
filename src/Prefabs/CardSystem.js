class CardSystem {
	constructor(scene) {
		this.scene = scene;
	}

	createDeck(deckCount = 2) {
		let deck = [];
		for (let deckIndex = 0; deckIndex < deckCount; deckIndex++) {
			for (let suit of suits) {
				for (let rank of ranks) {
					deck.push(this.createCard(suit, rank));
				}
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

	dealCards(playerCount = 2) {
		for (let i = 0; i < 7; i++) {
			for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
				const hand = this.scene.playerHands[playerIndex];
				this.dealCardToPlayer(hand, playerIndex + 1);
			}
		}
		
		// Auto-sort bot hands after dealing
		if (this.scene.botPlayers) {
			this.scene.botPlayers.forEach(bot => {
				if (bot && bot.autoSortHand) {
					bot.autoSortHand();
				}
			});
		}
		
		if (this.scene.gameLogic) {
			this.scene.gameLogic.updateActualHandLengths();
		}
	}

	dealCardToPlayer(hand, playerNumber) {
		const card = this.scene.deck.pop();
		card.originalPosition = { type: "hand", player: playerNumber };
		hand.push(card);
	}

	drawCard() {
		if (this.canDrawCard()) {
			const newCard = this.scene.deck.pop();
			newCard.originalPosition = { type: "hand" };
			this.addCardToHand(newCard);
			this.scene.drawn = true;
			this.scene.drawnCard = true;
			
			this.scene.handManager.displayHand(newCard);
		} else {
			this.handleInvalidDraw();
		}
	}

	canDrawCard() {
		console.log('canDrawCard: Starting validation');
		
		// Only check deck availability and if a card was already drawn
		if (this.scene.deck.length === 0 || 
			this.scene.drawn || 
			this.scene.drawnCard) {
			console.log('canDrawCard: FALSE - basic checks failed', {
				deckLength: this.scene.deck.length,
				drawn: this.scene.drawn,
				drawnCard: this.scene.drawnCard
			});
			return false;
		}
		
		const currentHand = this.scene.handManager.getCurrentHand();
		
		// Check if player can draw based on the same logic as turn validation
		// Players can draw if their hand and table are in the original state
		const currentPlayerIndex = this.scene.currentPlayerIndex;
		const startingHandSize = this.scene.gameLogic.playerHandSizesAtTurnStart[currentPlayerIndex];
		const startingHandCards = this.scene.gameLogic.playerHandCardsAtTurnStart[currentPlayerIndex];
		
		console.log('canDrawCard: Hand state check', {
			currentHandSize: currentHand.length,
			startingHandSize: startingHandSize
		});
		
		// If hand size is different from start, can't draw
		if (currentHand.length !== startingHandSize) {
			console.log('canDrawCard: FALSE - hand size changed');
			return false;
		}
		
		// If hand composition is different from start, can't draw
		const currentHandCards = currentHand.map(card => `${card.card.rank}_${card.card.suit}`);
		const startingSet = new Set(startingHandCards);
		const currentSet = new Set(currentHandCards);
		
		console.log('canDrawCard: Hand composition check', {
			starting: [...startingSet],
			current: [...currentSet]
		});
		
		if (startingSet.size !== currentSet.size || 
			![...startingSet].every(card => currentSet.has(card))) {
			console.log('canDrawCard: FALSE - hand composition changed');
			return false;
		}
		
		// Check if table is valid
		if (!this.scene.tableManager.checkTableValidity()) {
			console.log('canDrawCard: FALSE - table invalid');
			return false;
		}
		
		// Check if all table cards from start of turn are still on table
		if (!this.scene.gameLogic.checkTableCardsIntegrity()) {
			console.log('canDrawCard: FALSE - table integrity failed');
			return false;
		}

		console.log('canDrawCard: TRUE - all checks passed');
		return true;
	}

	addCardToHand(newCard) {
		let currentPlayerIndex, currentPlayerNumber;
		
		if (this.scene.currentPlayerIndex !== undefined) {
			currentPlayerIndex = this.scene.currentPlayerIndex;
			currentPlayerNumber = currentPlayerIndex + 1;
		} else {
			currentPlayerIndex = this.scene.p1Turn ? 0 : 1;
			currentPlayerNumber = this.scene.p1Turn ? 1 : 2;
		}
		
		newCard.originalPosition = { type: "hand", player: currentPlayerNumber };
		this.scene.playerHands[currentPlayerIndex].push(newCard);
	}

	handleInvalidDraw() {
	}

	getCardFrameIndex(card) {
		return suits.indexOf(card.card.suit) * 13 + ranks.indexOf(card.card.rank);
	}

	getRankValue(rank) {
		if (rank === "A") return 1;
		if (rank === "J") return 11;
		if (rank === "Q") return 12;
		if (rank === "K") return 13;
		return parseInt(rank);
	}

	checkValidGroup(cards = []) {
		if (cards.length < 3) {
			return false;
		}

		const uniqueRanks = new Set(cards.map((card) => card.card.rank));
		const uniqueSuits = new Set(cards.map((card) => card.card.suit));

		if (uniqueRanks.size === 1 && uniqueSuits.size === cards.length) {
			return true;
		}

		if (uniqueSuits.size === 1) {
			const rankValues = cards
				.map((card) => this.getRankValue(card.card.rank))
				.sort((a, b) => a - b);

			for (let i = 1; i < rankValues.length; i++) {
				if (rankValues[i] !== rankValues[i - 1] + 1) {
					if (rankValues[0] === 1) {
						const highAceValues = cards
							.map((card) => {
								if (card.card.rank === "A") {
									return 14;
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
