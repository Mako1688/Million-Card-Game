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
		if (this.scene.deck.length === 0 || 
			this.scene.drawn || 
			this.scene.drawnCard || 
			this.scene.placedCards) {
			return false;
		}
		const currentHand = this.scene.handManager.getCurrentHand();
		
		const hasTableCards = currentHand.some(card => 
			card.mustReturnToTable ||
			(card.originalPosition && card.originalPosition.type === "table") ||
			(this.scene.gameLogic.cardsOnTableAtTurnStart && 
			 this.scene.gameLogic.cardsOnTableAtTurnStart.includes(card))
		);

		if (hasTableCards) {
			return false;
		}

		if (!this.scene.tableManager.checkTableValidity()) {
			return false;
		}

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
