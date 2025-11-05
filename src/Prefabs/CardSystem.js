class CardSystem {
	constructor(scene) {
		this.scene = scene;
	}

	createDeck(deckCount = 2) {
		const deck = [];
		for (let deckIndex = 0; deckIndex < deckCount; deckIndex++) {
			for (const suit of suits) {
				for (const rank of ranks) {
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
			const j = Math.floor(Math.random() * (i + 1));
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
		
		this.autoSortBotHands();
		this.updateHandLengths();
	}

	autoSortBotHands() {
		if (this.scene.botPlayers) {
			this.scene.botPlayers.forEach(bot => {
				if (bot?.autoSortHand) {
					bot.autoSortHand();
				}
			});
		}
	}

	updateHandLengths() {
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
		}
	}

	canDrawCard() {
		return this.hasCardsInDeck() && 
			   !this.alreadyDrewCard() && 
			   this.isValidDrawState() && 
			   this.isTableValid() && 
			   this.hasTableIntegrity();
	}

	hasCardsInDeck() {
		return this.scene.deck.length > 0;
	}

	alreadyDrewCard() {
		return this.scene.drawn || this.scene.drawnCard;
	}

	isValidDrawState() {
		const currentHand = this.scene.handManager.getCurrentHand();
		const currentPlayerIndex = this.scene.currentPlayerIndex;
		const startingHandSize = this.scene.gameLogic.playerHandSizesAtTurnStart[currentPlayerIndex];
		const startingHandCards = this.scene.gameLogic.playerHandCardsAtTurnStart[currentPlayerIndex];
		
		return this.isHandSizeUnchanged(currentHand, startingHandSize) &&
			   this.isHandCompositionUnchanged(currentHand, startingHandCards);
	}

	isHandSizeUnchanged(currentHand, startingHandSize) {
		return currentHand.length === startingHandSize;
	}

	isHandCompositionUnchanged(currentHand, startingHandCards) {
		const currentHandCards = currentHand.map(card => `${card.card.rank}_${card.card.suit}`);
		const startingSet = new Set(startingHandCards);
		const currentSet = new Set(currentHandCards);
		
		return startingSet.size === currentSet.size && 
			   [...startingSet].every(card => currentSet.has(card));
	}

	isTableValid() {
		return this.scene.tableManager.checkTableValidity();
	}

	hasTableIntegrity() {
		return this.scene.gameLogic.checkTableCardsIntegrity();
	}

	addCardToHand(newCard) {
		const { currentPlayerIndex, currentPlayerNumber } = this.getCurrentPlayerInfo();
		
		newCard.originalPosition = { type: "hand", player: currentPlayerNumber };
		this.scene.playerHands[currentPlayerIndex].push(newCard);
	}

	getCurrentPlayerInfo() {
		let currentPlayerIndex, currentPlayerNumber;
		
		if (this.scene.currentPlayerIndex !== undefined) {
			currentPlayerIndex = this.scene.currentPlayerIndex;
			currentPlayerNumber = currentPlayerIndex + 1;
		} else {
			currentPlayerIndex = this.scene.p1Turn ? 0 : 1;
			currentPlayerNumber = this.scene.p1Turn ? 1 : 2;
		}
		
		return { currentPlayerIndex, currentPlayerNumber };
	}

	handleInvalidDraw() {
		// Placeholder for future invalid draw handling
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
		if (cards.length < 3) return false;

		const uniqueRanks = new Set(cards.map((card) => card.card.rank));
		const uniqueSuits = new Set(cards.map((card) => card.card.suit));

		return this.isValidSet(uniqueRanks, uniqueSuits, cards.length) || 
			   this.isValidRun(uniqueSuits, cards);
	}

	isValidSet(uniqueRanks, uniqueSuits, cardCount) {
		return uniqueRanks.size === 1 && uniqueSuits.size === cardCount;
	}

	isValidRun(uniqueSuits, cards) {
		if (uniqueSuits.size !== 1) return false;

		const rankValues = cards
			.map((card) => this.getRankValue(card.card.rank))
			.sort((a, b) => a - b);

		return this.isConsecutiveSequence(rankValues) || 
			   this.isConsecutiveWithHighAce(cards, rankValues);
	}

	isConsecutiveSequence(rankValues) {
		for (let i = 1; i < rankValues.length; i++) {
			if (rankValues[i] !== rankValues[i - 1] + 1) {
				return false;
			}
		}
		return true;
	}

	isConsecutiveWithHighAce(cards, rankValues) {
		if (rankValues[0] !== 1) return false; // Must have Ace as low

		const highAceValues = cards
			.map((card) => card.card.rank === "A" ? 14 : this.getRankValue(card.card.rank))
			.sort((a, b) => a - b);

		return this.isConsecutiveSequence(highAceValues);
	}
}
