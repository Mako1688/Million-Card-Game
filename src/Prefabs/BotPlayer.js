class BotPlayer {
	constructor(scene, playerIndex) {
		this.scene = scene;
		this.playerIndex = playerIndex;
		this.playerNumber = playerIndex + 1;
		this.difficulty = 'medium';
		this.thinkingTime = 1500;
		this.isThinking = false;
		this.aggressiveness = 0.7;
		this.patience = 0.6;
		this.handOptimization = 0.8;
		this.turnAttempts = 0;
		this.maxTurnAttempts = 3;
		this.rankValues = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
	}

	async takeTurn() {
		if (this.isThinking || this.scene.currentPlayerIndex !== this.playerIndex) {
			return;
		}

		this.isThinking = true;
		this.turnAttempts = 0;

		this.showThinkingIndicator();
		const thinkTime = this.calculateThinkingTime();

		setTimeout(() => {
			this.executeTurn();
		}, thinkTime);
	}

	calculateThinkingTime() {
		const baseTime = this.difficulty === 'easy' ? 800 : this.difficulty === 'hard' ? 1200 : 1000;
		const randomFactor = 0.7 + Math.random() * 0.3;
		return baseTime * randomFactor;
	}

	// ─── MAIN TURN LOGIC ──────────────────────────────────────────────
	// The bot collects plays, then executes as many as it can in a single
	// turn before ending. Each phase loops until no more plays are found.

	executeTurn() {
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}

		const myHand = this.getMyHand();
		if (!myHand || myHand.length === 0) {
			this.endTurn();
			return;
		}

		// Reset turn state
		this.scene.placedCards = false;
		this.scene.drawnCard = false;

		// Ensure table is valid before making any moves
		if (!this.scene.tableManager.checkTableValidity()) {
			this.fallbackDraw();
			return;
		}

		let madeAPlay = false;

		// Phase 1: Play groups directly from hand (sets and runs)
		madeAPlay = this.playHandGroups() || madeAPlay;

		// Phase 2: Add individual cards to existing table groups
		madeAPlay = this.playTableAdditions() || madeAPlay;

		// Phase 3: Table reorganization (take card from table group, combine with hand cards)
		if (this.difficulty !== 'easy') {
			madeAPlay = this.playTableReorganizations() || madeAPlay;
		}

		// After reorganizations, try phases 1 and 2 again (new opportunities may exist)
		if (madeAPlay) {
			this.playHandGroups();
			this.playTableAdditions();
		}

		// If no plays were made at all, draw a card
		if (!madeAPlay) {
			this.fallbackDraw();
		} else {
			this.endTurn();
		}
	}

	// ─── PHASE 1: PLAY GROUPS FROM HAND ───────────────────────────────
	// Uses O(n) grouping instead of exponential combinations.

	playHandGroups() {
		let playedAny = false;
		let keepLooking = true;

		while (keepLooking) {
			keepLooking = false;
			const myHand = this.getMyHand();
			if (myHand.length < 3) break;

			const groups = this.findHandGroups(myHand);
			if (groups.length === 0) break;

			// Sort: largest groups first (more hand reduction)
			groups.sort((a, b) => b.cards.length - a.cards.length);

			// For easy difficulty, sometimes skip good plays
			if (this.difficulty === 'easy' && Math.random() < 0.3) {
				break;
			}

			// Try to play the best group
			for (const group of groups) {
				// Verify all cards still in hand (previous plays may have removed some)
				if (group.cards.every(c => myHand.includes(c))) {
					if (this.doPlayGroup(group.cards)) {
						playedAny = true;
						keepLooking = true; // check for more plays with remaining hand
						break;
					}
				}
			}
		}

		return playedAny;
	}

	findHandGroups(hand) {
		const groups = [];

		// Find SETS: group by rank, look for 3+ different suits
		const byRank = {};
		hand.forEach(card => {
			const rank = card.card.rank;
			if (!byRank[rank]) byRank[rank] = [];
			byRank[rank].push(card);
		});

		for (const rank in byRank) {
			const cards = byRank[rank];
			// Deduplicate by suit (with 2 decks we may have 2 of same rank+suit)
			const bySuit = {};
			cards.forEach(card => {
				if (!bySuit[card.card.suit]) bySuit[card.card.suit] = card;
			});
			const uniqueSuitCards = Object.values(bySuit);
			if (uniqueSuitCards.length >= 3) {
				if (this.difficulty === 'hard') {
					// Hard plays full set (4 if possible)
					groups.push({ cards: [...uniqueSuitCards], type: 'set' });
				} else {
					groups.push({ cards: uniqueSuitCards.slice(0, 3), type: 'set' });
				}
			}
		}

		// Find RUNS: group by suit, sort by rank, find consecutive sequences
		const bySuit = {};
		hand.forEach(card => {
			const suit = card.card.suit;
			if (!bySuit[suit]) bySuit[suit] = [];
			bySuit[suit].push(card);
		});

		for (const suit in bySuit) {
			const cards = bySuit[suit];
			// Sort by rank value
			cards.sort((a, b) => this.rankValues[a.card.rank] - this.rankValues[b.card.rank]);

			// Deduplicate by rank (2 decks may have duplicates)
			const uniqueCards = [];
			const seenRanks = new Set();
			cards.forEach(card => {
				if (!seenRanks.has(card.card.rank)) {
					seenRanks.add(card.card.rank);
					uniqueCards.push(card);
				}
			});

			// Find consecutive sequences of 3+
			const runs = this.findConsecutiveRuns(uniqueCards);
			runs.forEach(run => groups.push({ cards: run, type: 'run' }));

			// Check for high-ace runs (Q-K-A)
			const hasAce = uniqueCards.some(c => c.card.rank === 'A');
			const hasKing = uniqueCards.some(c => c.card.rank === 'K');
			if (hasAce && hasKing) {
				const highCards = uniqueCards.filter(c => {
					const v = this.rankValues[c.card.rank];
					return v >= 10 || c.card.rank === 'A';
				});
				if (highCards.length >= 3) {
					const sorted = [...highCards].sort((a, b) => {
						const va = a.card.rank === 'A' ? 14 : this.rankValues[a.card.rank];
						const vb = b.card.rank === 'A' ? 14 : this.rankValues[b.card.rank];
						return va - vb;
					});
					const highRuns = this.findConsecutiveRuns(sorted, true);
					highRuns.forEach(run => groups.push({ cards: run, type: 'run' }));
				}
			}
		}

		return groups;
	}

	findConsecutiveRuns(sortedCards, aceHigh = false) {
		const runs = [];
		if (sortedCards.length < 3) return runs;

		let currentRun = [sortedCards[0]];

		for (let i = 1; i < sortedCards.length; i++) {
			const prevVal = aceHigh && sortedCards[i - 1].card.rank === 'A' ? 14 : this.rankValues[sortedCards[i - 1].card.rank];
			const currVal = aceHigh && sortedCards[i].card.rank === 'A' ? 14 : this.rankValues[sortedCards[i].card.rank];

			if (currVal === prevVal + 1) {
				currentRun.push(sortedCards[i]);
			} else {
				if (currentRun.length >= 3) {
					runs.push([...currentRun]);
				}
				currentRun = [sortedCards[i]];
			}
		}
		if (currentRun.length >= 3) {
			runs.push([...currentRun]);
		}

		return runs;
	}

	// ─── PHASE 2: ADD CARDS TO EXISTING TABLE GROUPS ──────────────────

	playTableAdditions() {
		let playedAny = false;
		let keepLooking = true;

		while (keepLooking) {
			keepLooking = false;
			const myHand = this.getMyHand();
			if (myHand.length === 0) break;
			if (!this.scene.tableCards || this.scene.tableCards.length === 0) break;

			for (let ci = 0; ci < myHand.length; ci++) {
				const card = myHand[ci];
				let bestGroup = -1;
				let bestSize = 0;

				for (let gi = 0; gi < this.scene.tableCards.length; gi++) {
					const group = this.scene.tableCards[gi];
					if (!Array.isArray(group) || group.length === 0) continue;

					const testGroup = [...group, card];
					if (this.scene.cardSystem.checkValidGroup(testGroup)) {
						if (group.length > bestSize) {
							bestSize = group.length;
							bestGroup = gi;
						}
					}
				}

				if (bestGroup >= 0) {
					if (this.doAddToTable(card, bestGroup)) {
						playedAny = true;
						keepLooking = true;
						break; // restart scan since hand/table changed
					}
				}
			}
		}

		return playedAny;
	}

	// ─── PHASE 3: TABLE REORGANIZATION ────────────────────────────────
	// Take one card from a table group (leaving it valid), combine with
	// hand cards to form a new group that reduces hand size.

	playTableReorganizations() {
		let playedAny = false;
		const myHand = this.getMyHand();
		if (myHand.length === 0) return false;
		if (!this.scene.tableCards || this.scene.tableCards.length === 0) return false;

		const maxAttempts = this.difficulty === 'hard' ? 80 : 20;
		let attempts = 0;

		for (let gi = 0; gi < this.scene.tableCards.length && attempts < maxAttempts; gi++) {
			const group = this.scene.tableCards[gi];
			if (!Array.isArray(group) || group.length < 4) continue; // need 4+ so removal leaves 3

			for (let ci = 0; ci < group.length && attempts < maxAttempts; ci++) {
				attempts++;
				const cardToTake = group[ci];
				const remaining = group.filter((_, idx) => idx !== ci);

				if (remaining.length < 3 || !this.scene.cardSystem.checkValidGroup(remaining)) continue;

				// Can we form a new valid group using this card + hand cards?
				const newGroup = this.findGroupWith(cardToTake, this.getMyHand());
				if (newGroup && newGroup.length >= 3) {
					const handCardsUsed = newGroup.filter(c => this.getMyHand().includes(c)).length;
					if (handCardsUsed > 0) {
						if (this.doTableReorganization(gi, ci, remaining, newGroup)) {
							playedAny = true;
							break; // table state changed, stop scanning
						}
					}
				}
			}
			if (playedAny) break;
		}

		return playedAny;
	}

	// Given a target card and a hand, find a valid group containing the target + hand cards.
	findGroupWith(targetCard, hand) {
		const targetRank = targetCard.card.rank;
		const targetSuit = targetCard.card.suit;

		// Try SET: find hand cards with same rank, different suits
		const suitsSeen = new Set([targetSuit]);
		const setCards = [targetCard];
		for (const c of hand) {
			if (c.card.rank === targetRank && !suitsSeen.has(c.card.suit)) {
				suitsSeen.add(c.card.suit);
				setCards.push(c);
			}
		}
		if (setCards.length >= 3) {
			return setCards.slice(0, Math.min(4, setCards.length));
		}

		// Try RUN: find hand cards with same suit, consecutive ranks
		const sameSuit = hand.filter(c => c.card.suit === targetSuit);
		const allSameSuit = [targetCard, ...sameSuit];

		// Sort and deduplicate
		allSameSuit.sort((a, b) => this.rankValues[a.card.rank] - this.rankValues[b.card.rank]);
		const unique = [];
		const seenRanks = new Set();
		for (const c of allSameSuit) {
			if (!seenRanks.has(c.card.rank)) {
				seenRanks.add(c.card.rank);
				unique.push(c);
			}
		}

		// Find any run of 3+ that includes the target card
		const runs = this.findConsecutiveRuns(unique);
		for (const run of runs) {
			if (run.some(c => c === targetCard)) {
				return run;
			}
		}

		// Also check high-ace runs if target is A, Q, K
		if (targetRank === 'A' || targetRank === 'K' || targetRank === 'Q') {
			const highSorted = unique.map(c => ({
				ref: c,
				val: c.card.rank === 'A' ? 14 : this.rankValues[c.card.rank]
			})).sort((a, b) => a.val - b.val).map(x => x.ref);

			const highRuns = this.findConsecutiveRuns(highSorted, true);
			for (const run of highRuns) {
				if (run.some(c => c === targetCard)) return run;
			}
		}

		return null;
	}

	// ─── EXECUTION METHODS ────────────────────────────────────────────

	doPlayGroup(cards) {
		if (this.scene.drawnCard) return false;
		const myHand = this.getMyHand();

		if (!this.scene.cardSystem.checkValidGroup(cards)) return false;
		for (const card of cards) {
			if (!myHand.includes(card)) return false;
		}

		// Add to table
		this.scene.tableCards.push([...cards]);

		// Remove from hand
		cards.forEach(card => {
			const idx = myHand.findIndex(c => c === card);
			if (idx !== -1) {
				if (card.sprite && typeof card.sprite.destroy === 'function') {
					card.sprite.destroy();
					card.sprite = null;
				}
				myHand.splice(idx, 1);
			}
		});

		this.scene.placedCards = true;
		this.scene.turnValid = true;

		if (!this.scene.tableManager.checkTableValidity()) {
			// Rollback
			this.scene.tableCards.pop();
			cards.forEach(card => myHand.push(card));
			this.scene.placedCards = false;
			this.scene.turnValid = false;
			return false;
		}

		this.scene.gameLogic.refreshDisplays();
		return true;
	}

	doAddToTable(card, groupIndex) {
		if (this.scene.drawnCard) return false;
		const myHand = this.getMyHand();
		const targetGroup = this.scene.tableCards[groupIndex];

		if (!targetGroup || !myHand.includes(card)) return false;

		const testGroup = [...targetGroup, card];
		if (!this.scene.cardSystem.checkValidGroup(testGroup)) return false;

		const originalGroup = [...targetGroup];

		targetGroup.push(card);
		const cardIdx = myHand.findIndex(c => c === card);
		if (cardIdx !== -1) {
			if (card.sprite && typeof card.sprite.destroy === 'function') {
				card.sprite.destroy();
				card.sprite = null;
			}
			myHand.splice(cardIdx, 1);
		}

		this.scene.placedCards = true;
		this.scene.turnValid = true;

		if (!this.scene.tableManager.checkTableValidity()) {
			this.scene.tableCards[groupIndex] = originalGroup;
			myHand.push(card);
			this.scene.placedCards = false;
			this.scene.turnValid = false;
			return false;
		}

		this.scene.gameLogic.refreshDisplays();
		return true;
	}

	doTableReorganization(sourceGroupIndex, cardIndexInGroup, remainingGroup, newGroup) {
		if (this.scene.drawnCard) return false;
		const myHand = this.getMyHand();

		const originalTableState = this.scene.tableCards.map(g => [...g]);
		const originalHandState = [...myHand];

		// Save card properties for rollback
		const savedCardProps = new Map();
		const allAffectedCards = [...newGroup, this.scene.tableCards[sourceGroupIndex][cardIndexInGroup]];
		allAffectedCards.forEach(card => {
			if (!savedCardProps.has(card)) {
				savedCardProps.set(card, {
					mustReturnToTable: card.mustReturnToTable,
					originalPosition: card.originalPosition ? { ...card.originalPosition } : undefined
				});
			}
		});

		try {
			// Update source group to remaining
			this.scene.tableCards[sourceGroupIndex] = remainingGroup;

			// Create new group on table
			this.scene.tableCards.push([...newGroup]);

			// Remove hand cards used in new group from hand
			newGroup.forEach(card => {
				const idx = myHand.findIndex(c => c === card);
				if (idx !== -1) {
					if (!card.mustReturnToTable && card.sprite && typeof card.sprite.destroy === 'function') {
						card.sprite.destroy();
						card.sprite = null;
					}
					myHand.splice(idx, 1);
				}
				delete card.mustReturnToTable;
				card.originalPosition = { type: "table" };
			});

			if (!this.scene.tableManager.checkTableValidity()) {
				throw new Error("Invalid table after reorg");
			}

			this.scene.placedCards = true;
			this.scene.turnValid = true;
			this.scene.gameLogic.refreshDisplays();
			return true;

		} catch (e) {
			// Rollback
			this.scene.tableCards = originalTableState;
			myHand.length = 0;
			myHand.push(...originalHandState);
			this.scene.placedCards = false;
			this.scene.turnValid = false;
			savedCardProps.forEach((props, card) => {
				if (props.mustReturnToTable !== undefined) card.mustReturnToTable = props.mustReturnToTable;
				else delete card.mustReturnToTable;
				if (props.originalPosition) card.originalPosition = props.originalPosition;
			});
			return false;
		}
	}

	// ─── FALLBACK DRAW ────────────────────────────────────────────────

	fallbackDraw() {
		if (this.scene.placedCards || this.scene.drawnCard) {
			this.endTurn();
			return;
		}

		if (this.scene.deck.length === 0) {
			this.endTurn();
			return;
		}

		const canDraw = this.scene.cardSystem.canDrawCard();
		if (canDraw) {
			this.scene.cardSystem.drawCard();
		} else {
			// Direct draw fallback
			const myHand = this.getMyHand();
			const newCard = this.scene.deck.pop();
			newCard.originalPosition = { type: "hand", player: this.playerNumber };
			myHand.push(newCard);
			this.scene.drawn = true;
		}

		this.scene.drawnCard = true;

		setTimeout(() => {
			this.autoSortHand();
		}, 100);

		this.endTurn();
	}

	// ─── END TURN ─────────────────────────────────────────────────────

	endTurn() {
		this.hideThinkingIndicator();
		this.isThinking = false;
		this.scene.handSelected = [];

		if (this.scene.handManager) {
			this.scene.handManager.displayHand();
		}

		setTimeout(() => {
			this.scene.gameLogic.endTurn();
		}, 300);
	}

	// ─── UTILITY METHODS ──────────────────────────────────────────────

	getMyHand() {
		if (!this.scene.playerHands || !this.scene.playerHands[this.playerIndex]) {
			return [];
		}
		return this.scene.playerHands[this.playerIndex];
	}

	autoSortHand() {
		const myHand = this.getMyHand();
		if (!myHand || myHand.length === 0) return;

		myHand.sort((a, b) => {
			const rankA = this.rankValues[a.card.rank] || 0;
			const rankB = this.rankValues[b.card.rank] || 0;
			if (rankA !== rankB) return rankA - rankB;
			const suitOrder = { "diamond": 0, "club": 1, "heart": 2, "spade": 3 };
			return (suitOrder[a.card.suit] || 0) - (suitOrder[b.card.suit] || 0);
		});

		if (this.scene.currentPlayerIndex === this.playerIndex && this.scene.handManager) {
			this.scene.handManager.displayHand();
		}
	}

	setDifficulty(difficulty) {
		this.difficulty = difficulty;

		switch (difficulty) {
			case 'easy':
				this.aggressiveness = 0.4;
				this.patience = 0.3;
				this.handOptimization = 0.5;
				this.thinkingTime = 800;
				break;
			case 'medium':
				this.aggressiveness = 0.7;
				this.patience = 0.6;
				this.handOptimization = 0.8;
				this.thinkingTime = 1000;
				break;
			case 'hard':
				this.aggressiveness = 0.9;
				this.patience = 0.8;
				this.handOptimization = 0.95;
				this.thinkingTime = 1200;
				break;
		}
	}

	disablePlayerInteractions() {
		try {
			if (this.scene.endTurnButton) this.scene.endTurnButton.disableInteractive();
			if (this.scene.deckSprite) this.scene.deckSprite.disableInteractive();
			if (this.scene.restart) this.scene.restart.disableInteractive();
			if (this.scene.sortRankButton) this.scene.sortRankButton.disableInteractive();
			if (this.scene.sortSuitButton) this.scene.sortSuitButton.disableInteractive();
			if (this.scene.sortRank) this.scene.sortRank.disableInteractive();
			if (this.scene.sortSuit) this.scene.sortSuit.disableInteractive();
			if (this.scene.settingsButton) this.scene.settingsButton.disableInteractive();
			if (this.scene.validationBox) this.scene.validationBox.disableInteractive();

			if (this.scene.handSelected) {
				this.scene.handSelected.forEach(sprite => {
					if (sprite) sprite.disableInteractive();
				});
			}
			if (this.scene.tableSprites) {
				this.scene.tableSprites.forEach(sprite => {
					if (sprite) sprite.disableInteractive();
				});
			}
			if (this.scene.controllerSystem) {
				this.scene.controllerSystem.botTurnActive = true;
			}
		} catch (error) {
			console.warn('Bot: Error during interaction disabling:', error);
		}
	}

	enablePlayerInteractions() {
		try {
			if (this.scene.endTurnButton) this.scene.endTurnButton.setInteractive();
			if (this.scene.deckSprite) this.scene.deckSprite.setInteractive();
			if (this.scene.restart) this.scene.restart.setInteractive();
			if (this.scene.sortRankButton) this.scene.sortRankButton.setInteractive();
			if (this.scene.sortSuitButton) this.scene.sortSuitButton.setInteractive();
			if (this.scene.sortRank) this.scene.sortRank.setInteractive();
			if (this.scene.sortSuit) this.scene.sortSuit.setInteractive();
			if (this.scene.settingsButton) this.scene.settingsButton.setInteractive();
			if (this.scene.validationBox) this.scene.validationBox.setInteractive();

			if (this.scene.handSelected) {
				this.scene.handSelected.forEach(sprite => {
					if (sprite) sprite.setInteractive();
				});
			}
			if (this.scene.tableSprites) {
				this.scene.tableSprites.forEach(sprite => {
					if (sprite) sprite.setInteractive();
				});
			}
			if (this.scene.controllerSystem) {
				this.scene.controllerSystem.botTurnActive = false;
			}
		} catch (error) {
			console.warn('Bot: Error during interaction enabling:', error);
		}
	}

	showThinkingIndicator() {
		if (this.scene.thinkingText) {
			this.scene.thinkingText.destroy();
		}

		this.scene.thinkingText = this.scene.add.text(
			this.scene.scale.width / 2,
			50,
			`Player ${this.playerNumber} is thinking...`,
			{
				fontFamily: 'PressStart2P',
				fontSize: '16px',
				color: '#FFD700',
				stroke: '#000000',
				strokeThickness: 2
			}
		).setOrigin(0.5).setDepth(100);
	}

	hideThinkingIndicator() {
		if (this.scene.thinkingText) {
			this.scene.thinkingText.destroy();
			this.scene.thinkingText = null;
		}
	}

	destroy() {
		this.hideThinkingIndicator();
		this.isThinking = false;
	}
}
