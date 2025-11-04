// GameLogic.js - Handles turn management, win conditions, and game flow

class GameLogic {
	constructor(scene) {
		this.scene = scene;
	}

	// Initializes all game state variables at the start of the game
	initializeVariables(playerCount = 2) {
		this.scene.playerCount = playerCount; // Set player count
		this.scene.currentPlayerIndex = 0; // 0-based index for current player
		this.scene.handSelected = [];
		this.scene.borderUISize = -25;
		this.scene.turnValid = false;
		this.scene.drawn = false;
		this.scene.drawnCard = false;
		this.scene.placedCards = false;
		this.scene.resetPressed = false;
		this.scene.cardsSelected = [];
		this.scene.tableCards = [];
		
		// Initialize hands for all players
		this.scene.playerHands = [];
		for (let i = 0; i < playerCount; i++) {
			this.scene.playerHands[i] = [];
			// Also create individual hand references for backwards compatibility
			this.scene[`p${i + 1}Hand`] = this.scene.playerHands[i];
		}
		
		// Maintain backwards compatibility for 2-player game logic
		this.scene.p1Turn = true;
		this.scene.p2Turn = false;
		
		// UI state flags
		this.scene.invalidTurnActive = false;
		
		// Track actual hand lengths for win condition (updated only when turn completes)
		this.scene.playerActualHandLengths = new Array(playerCount).fill(0);
		// Maintain backwards compatibility
		this.scene.p1ActualHandLength = 0; 
		this.scene.p2ActualHandLength = 0;
		
		// Flag to track when moves are being processed to prevent inappropriate flashing
		this.isProcessingMove = false;
		
		// Track hand sizes and card identities at turn start for validation
		this.playerHandSizesAtTurnStart = new Array(playerCount).fill(0);
		this.playerHandCardsAtTurnStart = new Array(playerCount).fill(null).map(() => []);
		// Track table cards at turn start for validation
		this.tableCardsAtTurnStart = [];
		// Maintain backwards compatibility
		this.p1HandSizeAtTurnStart = 0;
		this.p2HandSizeAtTurnStart = 0;
		this.p1HandCardsAtTurnStart = [];
		this.p2HandCardsAtTurnStart = [];
	}

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

	// Resets turn-specific flags when starting a new turn
	startNewTurn() {
		this.scene.drawn = false;
		this.scene.drawnCard = false;
		this.scene.placedCards = false;
		this.scene.resetPressed = false;
		this.scene.cardsSelected = [];
		this.scene.turnValid = false;
		
		// Track starting hand sizes and cards for validation
		for (let i = 0; i < this.scene.playerCount; i++) {
			this.playerHandSizesAtTurnStart[i] = this.scene.playerHands[i].length;
			this.playerHandCardsAtTurnStart[i] = this.scene.playerHands[i].map(card => `${card.card.rank}_${card.card.suit}`);
		}
		
		// Track starting table cards for validation
		this.tableCardsAtTurnStart = [];
		this.scene.tableCards.forEach(group => {
			const groupCards = group.map(card => `${card.card.rank}_${card.card.suit}`);
			this.tableCardsAtTurnStart.push(groupCards);
		});
		
		// Maintain backwards compatibility
		this.p1HandSizeAtTurnStart = this.scene.playerHands[0].length;
		this.p2HandSizeAtTurnStart = this.scene.playerHands[1] ? this.scene.playerHands[1].length : 0;
		this.p1HandCardsAtTurnStart = this.scene.playerHands[0].map(card => `${card.card.rank}_${card.card.suit}`);
		this.p2HandCardsAtTurnStart = this.scene.playerHands[1] ? this.scene.playerHands[1].map(card => `${card.card.rank}_${card.card.suit}`) : [];
		
		this.flagTableCardsForTurn();
		this.clearHandSelectionTints();
	}
	
	// Flags all cards currently on the table as needing to return to the table by turn end
	flagTableCardsForTurn() {
		this.scene.tableCards.forEach(group => {
			group.forEach(card => {
				card.mustReturnToTable = true;
			});
		});
	}

	// Checks if any player has won by emptying their hand
	checkWinCondition() {
		// During a reset operation, don't check win conditions at all
		if (this.scene.resetPressed) {
			return; // Skip win check during reset
		}
		
		// Don't check win conditions if the game hasn't started (no cards dealt yet)
		const totalActualHandLength = this.scene.playerActualHandLengths.reduce((sum, length) => sum + length, 0);
		if (totalActualHandLength === 0) {
			return;
		}
		
		// Check each player for win condition
		for (let i = 0; i < this.scene.playerCount; i++) {
			const playerHand = this.scene.playerHands[i];
			const actualEmpty = playerHand.length === 0;
			const trackedEmpty = this.scene.playerActualHandLengths[i] === 0;
			
			// Only trigger win if both tracked and actual agree (this prevents false wins)
			if (actualEmpty && trackedEmpty) {
				this.handleWin(i + 1);
				return;
			}
		}
	}

	// Handles the win condition by transitioning to the win scene
	handleWin(winningPlayer) {
		this.scene.scene.start("winScene", { 
			winningPlayer: winningPlayer,
			p1Win: winningPlayer === 1,
			isSinglePlayer: this.scene.isSinglePlayer || false
		});
	}

	// Handles successful card placement from hand to table
	handleValidPlay() {
		const currentHand = this.scene.handManager.getCurrentHand();
		this.scene.tableManager.moveSelectedCardsToTable(currentHand);
		this.scene.refreshDisplays();
		this.scene.resetSelectedCards();
		this.scene.markTurnAsValid();
		
		// Don't update tracked hand lengths here - only update when turn actually ends
		// This allows for proper reset functionality
	}

	// Refreshes both hand and table displays
	refreshDisplays() {
		this.scene.handManager.displayHand();
		this.scene.tableManager.displayTable();
	}

	// Clears the selected cards array and updates UI
	resetSelectedCards() {
		this.scene.cardsSelected = [];
		this.scene.uiSystem.updateValidationBoxVisibility();
	}

	// Marks the current turn as having valid moves
	markTurnAsValid() {
		this.scene.turnValid = true;
	}

	// Attempts to end the current turn based on game rules
	endTurn() {
		// Check if any table cards are still in hands (invalid state)
		const tableCardsInHands = this.checkForTableCardsInHands();
		
		// Check if all table cards from start of turn are still on table
		const tableIntegrity = this.checkTableCardsIntegrity();
		
		// Check if the player made a valid turn action
		const validTurnAction = this.checkValidTurnAction();
		
		// Additional validation: ensure the table is valid
		const tableValid = this.scene.tableManager.checkTableValidity();
		
		// Debug logging for validation
		console.log('Turn validation checks:');
		console.log('- drawnCard:', this.scene.drawnCard);
		console.log('- placedCards:', this.scene.placedCards);
		console.log('- tableValid:', tableValid);
		console.log('- tableCardsInHands:', tableCardsInHands);
		console.log('- tableIntegrity:', tableIntegrity);
		console.log('- validTurnAction:', validTurnAction);
		
		// A turn is valid if:
		// 1. No table cards are in hands, AND
		// 2. All starting table cards are still on table, AND
		// 3. Table is valid, AND
		// 4. Player made a valid action (drew card OR reduced hand size)
		if (!tableCardsInHands && tableIntegrity && tableValid && validTurnAction) {
			console.log('Turn validation PASSED - ending turn');
			this.clearHandSelectionTints();
			this.clearTableCardFlags();
			
			this.p1HandCardsAtTurnStart = [];
			this.p2HandCardsAtTurnStart = [];
			
			this.updateOriginalPositions();
			this.updateActualHandLengths();
			
			this.scene.showPauseScreen();
		} else {
			console.log('Turn validation FAILED - showing invalid turn notification');
			this.scene.showInvalidTurnNotification();
		}
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
	
	// Checks if all table cards from the start of the turn are still on the table
	checkTableCardsIntegrity() {
		if (!this.tableCardsAtTurnStart) {
			return true; // No starting table cards to validate
		}
		
		// Create a flat list of all current table cards
		const currentTableCards = [];
		this.scene.tableCards.forEach(group => {
			group.forEach(card => {
				currentTableCards.push(`${card.card.rank}_${card.card.suit}`);
			});
		});
		
		// Check if all starting table cards are still present
		for (const startingGroup of this.tableCardsAtTurnStart) {
			for (const cardId of startingGroup) {
				if (!currentTableCards.includes(cardId)) {
					console.log('checkTableCardsIntegrity: FALSE - missing card:', cardId);
					return false;
				}
			}
		}
		
		console.log('checkTableCardsIntegrity: TRUE - all starting table cards preserved');
		return true;
	}
	
	// Clears the mustReturnToTable flags from all cards
	clearTableCardFlags() {
		// Clear flags from all players' hand cards
		const allHandCards = [];
		for (let i = 0; i < this.scene.playerCount; i++) {
			allHandCards.push(...this.scene.playerHands[i]);
		}
		allHandCards.forEach(card => {
			delete card.mustReturnToTable;
		});
		
		// Clear flags from table cards
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
		console.log('- currentHandCards:', currentHandCards);
		console.log('- startingHandCards:', startingHandCards);
		
		// Valid turn action 1: Player drew a card from deck
		if (this.scene.drawnCard) {
			// If they drew a card, their hand should be exactly 1 card larger
			// and contain all original cards plus the new one
			if (currentHand.length === startingHandSize + 1) {
				// Verify all starting cards are still present
				let allStartingCardsPresent = true;
				for (let cardId of startingHandCards) {
					if (!currentHandCards.includes(cardId)) {
						allStartingCardsPresent = false;
						break;
					}
				}
				
				if (allStartingCardsPresent) {
					console.log('checkValidTurnAction: TRUE (valid card draw)');
					return true;
				}
			}
			console.log('checkValidTurnAction: FALSE (invalid state after drawing)');
			return false;
		}
		
		// Valid turn action 2: Player reduced hand size (played cards to table)
		if (currentHand.length < startingHandSize) {
			// Verify no new cards were added (all current cards were in starting hand)
			for (let cardId of currentHandCards) {
				if (!startingHandCards.includes(cardId)) {
					console.log('checkValidTurnAction: FALSE (new card found in hand:', cardId, ')');
					return false;
				}
			}
			
			// Verify that cards were actually placed (not just discarded)
			if (this.scene.placedCards) {
				console.log('checkValidTurnAction: TRUE (valid hand reduction with cards placed)');
				return true;
			} else {
				console.log('checkValidTurnAction: FALSE (hand reduced but no cards placed)');
				return false;
			}
		}
		
		// Valid turn action 3: Player maintained original hand state exactly
		// This allows for situations where player took table cards and returned them
		// In this case, they should be allowed to draw a card if they haven't already
		if (currentHand.length === startingHandSize && !this.scene.drawnCard && !this.scene.placedCards) {
			// Check if hand composition is exactly the same
			const startingSet = new Set(startingHandCards);
			const currentSet = new Set(currentHandCards);
			
			if (startingSet.size === currentSet.size && 
				[...startingSet].every(card => currentSet.has(card))) {
				console.log('checkValidTurnAction: TRUE (hand unchanged, eligible to draw card)');
				return true;
			}
		}
		
		console.log('checkValidTurnAction: FALSE (no valid turn action detected)');
		return false;
	}
}
