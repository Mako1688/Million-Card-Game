// GameLogic.js - Handles turn management, win conditions, and game flow

class GameLogic {
	constructor(scene) {
		this.scene = scene;
		this.isProcessingMove = false;
	}

	initializeVariables(playerCount = 2) {
		this.initializePlayerData(playerCount);
		this.initializeTurnData();
		this.initializeGameState();
		this.initializeValidationData(playerCount);
	}

	initializePlayerData(playerCount) {
		this.scene.playerCount = playerCount;
		this.scene.currentPlayerIndex = 0;
		this.scene.playerHands = [];
		this.scene.playerActualHandLengths = new Array(playerCount).fill(0);
		
		for (let i = 0; i < playerCount; i++) {
			this.scene.playerHands[i] = [];
			this.scene[`p${i + 1}Hand`] = this.scene.playerHands[i];
		}
		
		this.scene.p1ActualHandLength = 0;
		this.scene.p2ActualHandLength = 0;
	}

	initializeTurnData() {
		this.scene.p1Turn = true;
		this.scene.p2Turn = false;
		this.scene.turnValid = false;
		this.scene.drawn = false;
		this.scene.drawnCard = false;
		this.scene.placedCards = false;
		this.scene.resetPressed = false;
	}

	initializeGameState() {
		this.scene.handSelected = [];
		this.scene.borderUISize = -25;
		this.scene.cardsSelected = [];
		this.scene.tableCards = [];
		this.scene.invalidTurnActive = false;
	}

	initializeValidationData(playerCount) {
		this.playerHandSizesAtTurnStart = new Array(playerCount).fill(0);
		this.playerHandCardsAtTurnStart = new Array(playerCount).fill(null).map(() => []);
		this.tableCardsAtTurnStart = [];
		this.p1HandSizeAtTurnStart = 0;
		this.p2HandSizeAtTurnStart = 0;
		this.p1HandCardsAtTurnStart = [];
		this.p2HandCardsAtTurnStart = [];
	}

	updateOriginalPositions() {
		this.updatePlayerHandPositions();
		this.updateTableCardPositions();
	}

	updatePlayerHandPositions() {
		for (let playerIndex = 0; playerIndex < this.scene.playerCount; playerIndex++) {
			const hand = this.scene.playerHands[playerIndex];
			hand.forEach((card, index) => {
				card.originalPosition = { type: "hand", player: playerIndex + 1, index };
			});
		}
	}

	updateTableCardPositions() {
		this.scene.tableCards.forEach((group, groupIndex) => {
			group.forEach((card, cardIndex) => {
				card.originalPosition = { type: "table", groupIndex, cardIndex };
			});
		});
	}

	startNewTurn() {
		this.resetTurnFlags();
		this.captureInitialState();
		this.flagTableCardsForTurn();
		this.clearHandSelectionTints();
	}

	resetTurnFlags() {
		this.scene.drawn = false;
		this.scene.drawnCard = false;
		this.scene.placedCards = false;
		this.scene.resetPressed = false;
		this.scene.cardsSelected = [];
		this.scene.turnValid = false;
	}

	captureInitialState() {
		this.captureHandStates();
		this.captureTableState();
		this.maintainBackwardsCompatibility();
	}

	captureHandStates() {
		for (let i = 0; i < this.scene.playerCount; i++) {
			this.playerHandSizesAtTurnStart[i] = this.scene.playerHands[i].length;
			this.playerHandCardsAtTurnStart[i] = this.scene.playerHands[i]
				.map(card => `${card.card.rank}_${card.card.suit}`);
		}
	}

	captureTableState() {
		this.tableCardsAtTurnStart = [];
		this.scene.tableCards.forEach(group => {
			const groupCards = group.map(card => `${card.card.rank}_${card.card.suit}`);
			this.tableCardsAtTurnStart.push(groupCards);
		});
	}

	maintainBackwardsCompatibility() {
		this.p1HandSizeAtTurnStart = this.scene.playerHands[0].length;
		this.p2HandSizeAtTurnStart = this.scene.playerHands[1]?.length || 0;
		this.p1HandCardsAtTurnStart = this.scene.playerHands[0]
			.map(card => `${card.card.rank}_${card.card.suit}`);
		this.p2HandCardsAtTurnStart = this.scene.playerHands[1]
			?.map(card => `${card.card.rank}_${card.card.suit}`) || [];
	}
	
	flagTableCardsForTurn() {
		this.scene.tableCards.forEach(group => {
			group.forEach(card => {
				card.mustReturnToTable = true;
			});
		});
	}

	checkWinCondition() {
		if (this.shouldSkipWinCheck()) return;
		
		for (let i = 0; i < this.scene.playerCount; i++) {
			if (this.isPlayerWinner(i)) {
				this.handleWin(i + 1);
				return;
			}
		}
	}

	shouldSkipWinCheck() {
		if (this.scene.resetPressed) return true;
		
		const totalActualHandLength = this.scene.playerActualHandLengths
			.reduce((sum, length) => sum + length, 0);
		return totalActualHandLength === 0;
	}

	isPlayerWinner(playerIndex) {
		const playerHand = this.scene.playerHands[playerIndex];
		const actualEmpty = playerHand.length === 0;
		const trackedEmpty = this.scene.playerActualHandLengths[playerIndex] === 0;
		
		return actualEmpty && trackedEmpty;
	}

	handleWin(winningPlayer) {
		this.scene.scene.start("winScene", { 
			winningPlayer: winningPlayer,
			p1Win: winningPlayer === 1,
			isSinglePlayer: this.scene.isSinglePlayer || false
		});
	}

	handleValidPlay() {
		const currentHand = this.scene.handManager.getCurrentHand();
		this.scene.tableManager.moveSelectedCardsToTable(currentHand);
		this.scene.refreshDisplays();
		this.scene.resetSelectedCards();
		this.scene.markTurnAsValid();
	}

	refreshDisplays() {
		this.scene.handManager.displayHand();
		this.scene.tableManager.displayTable();
	}

	resetSelectedCards() {
		this.scene.cardsSelected = [];
		this.scene.uiSystem.updateValidationBoxVisibility();
	}

	markTurnAsValid() {
		this.scene.turnValid = true;
	}

	endTurn() {
		const validationResult = this.validateTurnEnd();
		
		if (validationResult.isValid) {
			this.completeTurnEnd();
		} else {
			// Check if this is a bot's turn - bots need fallback recovery
			const currentBot = this.getCurrentBot();
			if (currentBot) {
				console.warn('Bot turn failed validation:', validationResult);
				this.handleInvalidBotTurn(currentBot, validationResult);
			} else {
				this.scene.showInvalidTurnNotification();
			}
		}
	}

	// Returns the bot object if the current player is a bot, null otherwise
	getCurrentBot() {
		const idx = this.scene.currentPlayerIndex;
		if (this.scene.isSinglePlayer && idx === 1 && this.scene.botPlayer) {
			return this.scene.botPlayer;
		}
		if (this.scene.botPlayers && this.scene.botPlayers[idx]) {
			return this.scene.botPlayers[idx];
		}
		return null;
	}

	// Fallback recovery when a bot produces an invalid turn
	handleInvalidBotTurn(bot, validationResult) {
		console.warn('Bot invalid turn - attempting recovery. Details:', validationResult);
		
		const myHand = bot.getMyHand();
		
		// Step 1: Return any stranded table cards from bot's hand back to the table
		if (validationResult.tableCardsInHands || !validationResult.tableIntegrity) {
			this.returnStrandedTableCardsForBot(bot);
		}
		
		// Step 2: Fix any invalid table groups by restoring to turn-start state
		if (!validationResult.tableIntegrity || !validationResult.tableValid) {
			this.restoreTableToTurnStart();
		}
		
		// Step 3: Reset turn flags so draw is possible
		this.scene.placedCards = false;
		this.scene.turnValid = false;
		this.scene.drawnCard = false;
		this.scene.drawn = false;
		
		// Step 4: Restore hand tracking to match current state
		const currentPlayerIndex = this.scene.currentPlayerIndex;
		this.playerHandSizesAtTurnStart[currentPlayerIndex] = myHand.length;
		this.playerHandCardsAtTurnStart[currentPlayerIndex] = myHand.map(
			card => `${card.card.rank}_${card.card.suit}`
		);
		
		// Step 5: Try to draw a card as fallback action
		if (this.scene.cardSystem.hasCardsInDeck()) {
			const newCard = this.scene.deck.pop();
			newCard.originalPosition = { type: "hand", player: bot.playerNumber };
			myHand.push(newCard);
			this.scene.drawnCard = true;
			this.scene.drawn = true;
			console.log('Bot fallback: drew a card');
		} else {
			// No cards to draw - just pass the turn
			console.log('Bot fallback: no cards to draw, passing turn');
		}
		
		// Step 6: Force update displays
		if (this.scene.handManager) {
			this.scene.handManager.displayHand();
		}
		this.scene.tableManager.displayTable();
		
		// Step 7: Now complete the turn (skip validation this time)
		this.completeTurnEnd();
	}

	// Returns any table cards stuck in a bot's hand back to their original table groups
	returnStrandedTableCardsForBot(bot) {
		const myHand = bot.getMyHand();
		const cardsToReturn = [];
		
		for (let i = myHand.length - 1; i >= 0; i--) {
			const card = myHand[i];
			if (card.mustReturnToTable || 
				(card.originalPosition && card.originalPosition.type === "table")) {
				cardsToReturn.push(card);
				myHand.splice(i, 1);
			}
		}
		
		// Try to return cards to their original groups
		cardsToReturn.forEach(card => {
			delete card.mustReturnToTable;
			if (card.originalPosition && card.originalPosition.groupIndex !== undefined) {
				const groupIdx = card.originalPosition.groupIndex;
				if (this.scene.tableCards[groupIdx]) {
					this.scene.tableCards[groupIdx].push(card);
				} else {
					// Original group gone - create a holding group
					this.scene.tableCards.push([card]);
				}
			} else {
				// No known original group - find a group that this card fits
				let placed = false;
				for (let g = 0; g < this.scene.tableCards.length; g++) {
					const testGroup = [...this.scene.tableCards[g], card];
					if (this.scene.cardSystem.checkValidGroup(testGroup)) {
						this.scene.tableCards[g].push(card);
						placed = true;
						break;
					}
				}
				if (!placed) {
					// Last resort: put in its own group (will be cleaned up by table restore)
					this.scene.tableCards.push([card]);
				}
			}
		});
	}

	// Restores the table to its state at the beginning of the turn
	restoreTableToTurnStart() {
		if (!this.tableCardsAtTurnStart || this.tableCardsAtTurnStart.length === 0) {
			return;
		}
		
		// Build a pool of all current table cards by reference
		const cardPool = [];
		this.scene.tableCards.forEach(group => {
			group.forEach(card => cardPool.push(card));
		});
		
		// Reconstruct table groups matching the turn-start snapshot
		const newTableCards = [];
		for (const startGroup of this.tableCardsAtTurnStart) {
			const rebuiltGroup = [];
			for (const cardId of startGroup) {
				// Find a matching card in the pool
				const idx = cardPool.findIndex(c => `${c.card.rank}_${c.card.suit}` === cardId);
				if (idx !== -1) {
					const card = cardPool.splice(idx, 1)[0];
					delete card.mustReturnToTable;
					rebuiltGroup.push(card);
				}
			}
			if (rebuiltGroup.length > 0) {
				newTableCards.push(rebuiltGroup);
			}
		}
		
		// Any leftover cards that were on the table but not matched go into new groups
		if (cardPool.length > 0) {
			// These are new cards that were added during the turn - add as separate groups
			// only if they form valid groups, otherwise absorb into existing groups
			newTableCards.push(...cardPool.map(card => {
				delete card.mustReturnToTable;
				return [card];
			}));
		}
		
		this.scene.tableCards = newTableCards;
	}

	validateTurnEnd() {
		const tableCardsInHands = this.checkForTableCardsInHands();
		const tableIntegrity = this.checkTableCardsIntegrity();
		const validTurnAction = this.checkValidTurnAction();
		const tableValid = this.scene.tableManager.checkTableValidity();
		
		const isValid = !tableCardsInHands && tableIntegrity && tableValid && validTurnAction;
		
		return { isValid, tableCardsInHands, tableIntegrity, validTurnAction, tableValid };
	}

	completeTurnEnd() {
		this.clearHandSelectionTints();
		this.clearTableCardFlags();
		this.p1HandCardsAtTurnStart = [];
		this.p2HandCardsAtTurnStart = [];
		this.updateOriginalPositions();
		this.updateActualHandLengths();
		this.scene.showPauseScreen();
	}
	
	checkForTableCardsInHands() {
		const allHandCards = [];
		for (let i = 0; i < this.scene.playerCount; i++) {
			allHandCards.push(...this.scene.playerHands[i]);
		}
		
		const flaggedCards = allHandCards.filter(card => card.mustReturnToTable);
		const tableOriginCards = allHandCards.filter(card => 
			card.originalPosition && card.originalPosition.type === "table"
		);
		
		const allProblematicCards = [...flaggedCards, ...tableOriginCards];
		const uniqueProblematicCards = Array.from(new Set(allProblematicCards));
		
		return uniqueProblematicCards.length > 0;
	}
	
	checkTableCardsIntegrity() {
		if (!this.tableCardsAtTurnStart) return true;
		
		const currentTableCards = this.getAllCurrentTableCards();
		return this.areAllStartingCardsPresent(currentTableCards);
	}

	getAllCurrentTableCards() {
		const currentTableCards = [];
		this.scene.tableCards.forEach(group => {
			group.forEach(card => {
				currentTableCards.push(`${card.card.rank}_${card.card.suit}`);
			});
		});
		return currentTableCards;
	}

	areAllStartingCardsPresent(currentTableCards) {
		// Build count-aware lookup of current table cards to handle duplicates from 2 decks
		const currentCounts = this.buildCardCounts(currentTableCards);
		for (const startingGroup of this.tableCardsAtTurnStart) {
			for (const cardId of startingGroup) {
				if (!currentCounts[cardId] || currentCounts[cardId] <= 0) {
					return false;
				}
				currentCounts[cardId]--;
			}
		}
		return true;
	}
	
	clearTableCardFlags() {
		this.clearHandCardFlags();
		this.clearTableCardFlagsFromTable();
	}

	clearHandCardFlags() {
		const allHandCards = [];
		for (let i = 0; i < this.scene.playerCount; i++) {
			allHandCards.push(...this.scene.playerHands[i]);
		}
		allHandCards.forEach(card => {
			delete card.mustReturnToTable;
		});
	}

	clearTableCardFlagsFromTable() {
		this.scene.tableCards.forEach(group => {
			group.forEach(card => {
				delete card.mustReturnToTable;
			});
		});
	}

	// Updates original position tracking for all cards when a turn ends
	updateOriginalPositions() {
		// Update original positions for all players' hands
		for (let playerIndex = 0; playerIndex < this.scene.playerCount; playerIndex++) {
			const hand = this.scene.playerHands[playerIndex];
			hand.forEach((card, index) => {
				card.originalPosition = { type: "hand", player: playerIndex + 1, index };
			});
		}
		
		// Update original positions for table cards
		this.scene.tableCards.forEach((group, groupIndex) => {
			group.forEach((card, cardIndex) => {
				card.originalPosition = { type: "table", groupIndex, cardIndex };
			});
		});
	}

	// Updates tracked hand lengths to match actual current hand sizes
	updateActualHandLengths() {
		// Update the tracked hand lengths to reflect the current actual state
		for (let i = 0; i < this.scene.playerCount; i++) {
			this.scene.playerActualHandLengths[i] = this.scene.playerHands[i].length;
		}
		
		// Maintain backwards compatibility
		this.scene.p1ActualHandLength = this.scene.playerHands[0].length;
		this.scene.p2ActualHandLength = this.scene.playerHands[1] ? this.scene.playerHands[1].length : 0;
	}

	// Stops all flashing animations on cards
	stopAllFlashingAnimations() {
		// Stop flashing on all hand cards
		const allHandCards = [...this.scene.p1Hand, ...this.scene.p2Hand];
		allHandCards.forEach(card => {
			if (card.sprite) {
				this.scene.handManager.clearCardTint(card.sprite);
			}
		});

		// Stop flashing on all table cards
		this.scene.tableCards.forEach(group => {
			group.forEach(card => {
				if (card.sprite) {
					this.scene.tableManager.stopGroupFlash(card);
				}
			});
		});
	}

	// Clears selection tints from all hand cards
	clearHandSelectionTints() {
		// Clear selection tints from all hand cards that are currently displayed
		if (this.scene.handSelected) {
			this.scene.handSelected.forEach(cardSprite => {
				if (cardSprite) {
					this.scene.handManager.clearCardTint(cardSprite);
					cardSprite.isSelected = false;
				}
			});
		}
	}

	// Completes the turn transition after the pause screen is dismissed
	completeTurnTransition() {
		this.switchTurn();
		this.resetTurnFlags();
		this.startNewTurn();
		this.refreshDisplays();
		this.scene.uiSystem.updateValidationBoxVisibility();
		
		// Check if it's now a bot's turn and handle accordingly
		const isCurrentPlayerBot = (this.scene.isSinglePlayer && this.scene.currentPlayerIndex === 1 && this.scene.botPlayer) ||
								   (this.scene.botPlayers && this.scene.botPlayers[this.scene.currentPlayerIndex]);
		
		if (isCurrentPlayerBot) {
			// Immediately disable player interactions to prevent interference
			const currentBot = this.scene.botPlayer || this.scene.botPlayers[this.scene.currentPlayerIndex];
			if (currentBot) {
				currentBot.disablePlayerInteractions();
				
				// Give a small delay for visual clarity
				setTimeout(() => {
					currentBot.takeTurn();
				}, 500);
			}
		}
	}

	// Switches the active player turn
	switchTurn() {
		// Update current player index
		this.scene.currentPlayerIndex = (this.scene.currentPlayerIndex + 1) % this.scene.playerCount;
		
		// Maintain backwards compatibility for 2-player games
		if (this.scene.playerCount === 2) {
			this.scene.p1Turn = !this.scene.p1Turn;
			this.scene.p2Turn = !this.scene.p2Turn;
		} else {
			// For multi-player games, set turn flags based on current player
			this.scene.p1Turn = this.scene.currentPlayerIndex === 0;
			this.scene.p2Turn = this.scene.currentPlayerIndex === 1;
		}
		
		// Update table group validity states for the new turn
		this.scene.tableManager.updateInvalidGroupStates();
	}

	// Resets all turn-related flags and variables
	resetTurnFlags() {
		this.scene.drawn = false;
		this.scene.drawnCard = false;
		this.scene.placedCards = false;
		this.scene.resetPressed = false;
		this.scene.cardsSelected = [];
		this.scene.turnValid = false;
	}

	// Resets all cards to their original positions at the start of the turn
	resetHandToTable() {
		if (this.scene.drawnCard) {
			return; // Cannot reset after drawing a card
		}

		this.scene.resetPressed = true;
		this.isProcessingMove = true; // Prevent flashing during reset

		// Stop all flashing animations before reset
		this.stopAllFlashingAnimations();

		// Reset all turn-related flags to beginning of turn state
		this.scene.drawn = false;
		this.scene.drawnCard = false;
		this.scene.placedCards = false;
		this.scene.cardsSelected = [];
		this.scene.turnValid = false;

		// First, identify which groups existed at the start of the turn
		// A group existed at start if it contains cards with originalPosition.type === "table"
		const originalGroups = [];
		const groupCustomPositions = [];
		
		this.scene.tableCards.forEach((group, groupIndex) => {
			if (group.length > 0) {
				const hasOriginalTableCards = group.some(card => 
					card.originalPosition && card.originalPosition.type === "table"
				);
				
				if (hasOriginalTableCards) {
					// This group existed at the start of the turn
					originalGroups[groupIndex] = true;
					
					// Store custom position if it exists
					const firstCard = group[0];
					if (firstCard.customPosition || (firstCard.sprite && firstCard.sprite.x && firstCard.sprite.y)) {
						groupCustomPositions[groupIndex] = {
							x: firstCard.customPosition?.x || firstCard.sprite?.x,
							y: firstCard.customPosition?.y || firstCard.sprite?.y,
							hasCustomPosition: !!firstCard.customPosition
						};
					}
				}
			}
		});

		// Collect all cards and their destinations
		const allCards = [
			...this.scene.p1Hand.map(card => ({ card, currentLocation: 'hand' })),
			...this.scene.p2Hand.map(card => ({ card, currentLocation: 'hand' })),
			...this.scene.tableCards.flat().map(card => ({ card, currentLocation: 'table' }))
		];

		// Clear current state
		this.scene.p1Hand = [];
		this.scene.p2Hand = [];
		this.scene.tableCards = [];

		// Group cards by their original positions
		const cardsByOriginalGroup = {};
		
		allCards.forEach(({ card, currentLocation }) => {
			if (card.originalPosition) {
				if (card.originalPosition.type === "hand") {
					// Card originally belonged to a hand
					const playerNum = card.originalPosition.player;
					if (playerNum === 1) {
						this.scene.p1Hand.push(card);
					} else {
						this.scene.p2Hand.push(card);
					}
					card.table = false;
				} else if (card.originalPosition.type === "table") {
					// Card originally belonged to a table group
					const groupIndex = card.originalPosition.groupIndex;
					if (!cardsByOriginalGroup[groupIndex]) {
						cardsByOriginalGroup[groupIndex] = [];
					}
					cardsByOriginalGroup[groupIndex].push(card);
					card.table = true;
				}
			} else {
				// Fallback: if a card has no originalPosition, put it back in player 1's hand
				console.warn("Card found without originalPosition, adding to player 1 hand:", card);
				this.scene.p1Hand.push(card);
				card.table = false;
			}
		});

		// Reconstruct original table groups
		Object.keys(cardsByOriginalGroup).forEach((groupIndexStr) => {
			const groupIndex = parseInt(groupIndexStr);
			const cards = cardsByOriginalGroup[groupIndex];
			
			// Sort the group to ensure proper order
			this.scene.tableManager.sortGroup(cards);
			
			// Restore custom position if it existed for this original group
			if (groupCustomPositions[groupIndex]) {
				const position = groupCustomPositions[groupIndex];
				cards.forEach(card => {
					if (position.hasCustomPosition) {
						card.customPosition = { x: position.x, y: position.y };
					}
				});
			}
			
			// Add the reconstructed group to the table
			this.scene.tableCards.push(cards);
		});

		this.scene.cardsSelected = [];
		
		// Update tracked hand lengths before refreshing displays
		// This ensures consistency before any win condition checks
		this.updateActualHandLengths();
		
		this.scene.refreshDisplays();
		
		// After refresh, ensure all groups have proper card spacing to prevent overlap
		this.scene.tableManager.ensureProperGroupSpacing();
		
		// Restore the turn start tracking to match the current state
		// This ensures validation checks work correctly after reset
		for (let i = 0; i < this.scene.playerCount; i++) {
			this.playerHandSizesAtTurnStart[i] = this.scene.playerHands[i].length;
			this.playerHandCardsAtTurnStart[i] = this.scene.playerHands[i].map(card => `${card.card.rank}_${card.card.suit}`);
		}
		
		// Maintain backwards compatibility
		this.p1HandSizeAtTurnStart = this.scene.playerHands[0].length;
		this.p2HandSizeAtTurnStart = this.scene.playerHands[1] ? this.scene.playerHands[1].length : 0;
		this.p1HandCardsAtTurnStart = this.scene.playerHands[0].map(card => `${card.card.rank}_${card.card.suit}`);
		this.p2HandCardsAtTurnStart = this.scene.playerHands[1] ? this.scene.playerHands[1].map(card => `${card.card.rank}_${card.card.suit}`) : [];
		
		// Re-flag all table cards as must return to table (since we're back to turn start)
		this.flagTableCardsForTurn();
		
		// Clear any lingering hand selection tints and refresh UI
		this.clearHandSelectionTints();
		this.scene.updateValidationBoxVisibility();
		
		// Refresh hand display to show proper visual indicators for table cards
		this.scene.handManager.displayHand();
		
		this.scene.resetPressed = false;
		this.isProcessingMove = false;
	}

	// Checks if the player has made a valid turn action (drew card or reduced hand size)
	checkValidTurnAction() {
		const currentPlayerIndex = this.scene.currentPlayerIndex;
		const currentHand = this.scene.playerHands[currentPlayerIndex];
		const startingHandSize = this.playerHandSizesAtTurnStart[currentPlayerIndex];
		const startingHandCards = this.playerHandCardsAtTurnStart[currentPlayerIndex];
		
		const currentHandCards = currentHand.map(card => `${card.card.rank}_${card.card.suit}`);
		
		console.log('checkValidTurnAction detailed check:');
		console.log('- currentPlayerIndex:', currentPlayerIndex);
		console.log('- currentHand.length:', currentHand.length);
		console.log('- startingHandSize:', startingHandSize);
		console.log('- drawnCard flag:', this.scene.drawnCard);
		console.log('- placedCards flag:', this.scene.placedCards);
		
		// Valid turn action 1: Player drew a card from deck
		if (this.scene.drawnCard) {
			// If they drew a card, their hand should be exactly 1 card larger
			// and contain all original cards plus the new one
			if (currentHand.length === startingHandSize + 1) {
				// Verify all starting cards are still present (count-aware for duplicate cards)
				if (this.areCardsSubset(startingHandCards, currentHandCards)) {
					// Also verify all table cards from turn start are still on the table
					if (this.checkTableCardsIntegrity()) {
						console.log('checkValidTurnAction: TRUE (valid card draw)');
						return true;
					}
					console.log('checkValidTurnAction: FALSE (table cards missing after draw)');
					return false;
				}
			}
			console.log('checkValidTurnAction: FALSE (invalid state after drawing)');
			return false;
		}
		
		// Valid turn action 2: Player reduced hand size (played cards to table)
		if (currentHand.length < startingHandSize) {
			// Verify no new cards were added - all current cards must be a subset of starting cards
			if (!this.areCardsSubset(currentHandCards, startingHandCards)) {
				console.log('checkValidTurnAction: FALSE (new card found in hand)');
				return false;
			}
			
			// Verify that cards were actually placed (not just discarded)
			if (!this.scene.placedCards) {
				console.log('checkValidTurnAction: FALSE (hand reduced but no cards placed)');
				return false;
			}
			
			// Verify all table cards from turn start are still on the table
			if (!this.checkTableCardsIntegrity()) {
				console.log('checkValidTurnAction: FALSE (table cards missing after placing)');
				return false;
			}
			
			console.log('checkValidTurnAction: TRUE (valid hand reduction with cards placed)');
			return true;
		}
		
		// No valid action: hand unchanged with no draw and no placement is not a valid turn
		console.log('checkValidTurnAction: FALSE (no action taken - must draw or play cards)');
		return false;
	}

	// Checks if every card in 'subset' appears in 'superset' with sufficient count
	// Handles duplicate card IDs properly (2-deck game)
	areCardsSubset(subset, superset) {
		const superCounts = this.buildCardCounts(superset);
		for (const cardId of subset) {
			if (!superCounts[cardId] || superCounts[cardId] <= 0) {
				return false;
			}
			superCounts[cardId]--;
		}
		return true;
	}

	// Checks if two card arrays are identical multisets (same cards, same counts)
	areCardsSameMultiset(cards1, cards2) {
		if (cards1.length !== cards2.length) return false;
		const counts1 = this.buildCardCounts(cards1);
		const counts2 = this.buildCardCounts(cards2);
		const allKeys = new Set([...Object.keys(counts1), ...Object.keys(counts2)]);
		for (const key of allKeys) {
			if ((counts1[key] || 0) !== (counts2[key] || 0)) return false;
		}
		return true;
	}

	// Builds a frequency map of card ID strings
	buildCardCounts(cardIds) {
		const counts = {};
		for (const id of cardIds) {
			counts[id] = (counts[id] || 0) + 1;
		}
		return counts;
	}
}
