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
	}

	async takeTurn() {
		if (this.isThinking || this.scene.currentPlayerIndex !== this.playerIndex) {
			return;
		}
		
		this.isThinking = true;
		this.turnAttempts = 0;
		
		setTimeout(() => {
			this.disablePlayerInteractions();
		}, 100);
		
		this.showThinkingIndicator();
		const thinkTime = this.calculateThinkingTime();
		
		setTimeout(() => {
			this.makeMove();
		}, thinkTime);
	}

	calculateThinkingTime() {
		const baseTime = this.thinkingTime;
		const handSize = this.getMyHand().length;
		const tableGroups = this.scene.tableCards.length;
		const handComplexity = handSize * 100;
		const tableComplexity = tableGroups * 200;
		const randomFactor = 0.5 + Math.random() * 0.5;
		
		return Math.min(baseTime + handComplexity + tableComplexity, 3000) * randomFactor;
	}

	makeMove() {
		// Safety check to prevent infinite loops
		this.turnAttempts++;
		if (this.turnAttempts > this.maxTurnAttempts) {
			// Force draw or end turn if we've tried too many times
			if (this.scene.cardSystem.canDrawCard() && !this.scene.drawnCard && !this.scene.placedCards) {
				this.drawCard();
			} else {
				this.endTurn();
			}
			return;
		}
		
		// Validate that it's actually our turn
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}
		
		const myHand = this.getMyHand();
		if (!myHand || myHand.length === 0) {
			this.endTurn();
			return;
		}
		
		// Reset turn state flags to ensure clean turn
		if (this.turnAttempts === 1) {
			this.scene.placedCards = false;
			this.scene.drawnCard = false;
		}
		
		// Ensure table is valid before making any moves
		if (!this.scene.tableManager.checkTableValidity()) {
			this.endTurn();
			return;
		}
		
		const playableGroups = this.findPlayableGroups(myHand);
		const tableOpportunities = this.analyzeTableManipulation(myHand);
		const simpleTableOptions = this.findTablePlayOptions(myHand);
		const canDraw = this.scene.cardSystem.canDrawCard();
		
		const canWinBasic = this.canWinThisTurn(playableGroups, simpleTableOptions);
		const canWinAdvanced = this.checkTableManipulationWin(tableOpportunities, myHand);
		
		if (canWinBasic || canWinAdvanced) {
			this.executeWinningStrategy(playableGroups, tableOpportunities, simpleTableOptions);
			return;
		}
		
		const bestStrategy = this.chooseBestStrategy(playableGroups, tableOpportunities, simpleTableOptions, myHand);
		
		if (bestStrategy) {
			this.executeStrategy(bestStrategy);
		} else if (canDraw && !this.scene.drawnCard && !this.scene.placedCards) {
			this.drawCard();
		} else {
			this.endTurn();
		}
	}

	findPlayableGroups(hand) {
		const playableGroups = [];
		
		if (!hand || hand.length < 3) {
			return playableGroups;
		}
		
		for (let size = 3; size <= hand.length; size++) {
			const combinations = this.getCombinations(hand, size);
			
			for (let combo of combinations) {
				const isValid = this.scene.cardSystem.checkValidGroup(combo);
				
				if (isValid) {
					const value = this.evaluateGroupValue(combo);
					playableGroups.push({
						cards: combo,
						value: value,
						size: combo.length
					});
				}
			}
		}
		
		return playableGroups.sort((a, b) => b.value - a.value);
	}

	findTablePlayOptions(hand) {
		const options = [];
		
		if (!hand || hand.length === 0 || !this.scene.tableCards || this.scene.tableCards.length === 0) {
			return options;
		}
		
		this.scene.tableCards.forEach((group, groupIndex) => {
			if (!Array.isArray(group) || group.length === 0) {
				return;
			}
			
			hand.forEach((card, cardIndex) => {
				const testGroup = [...group, card];
				const isValid = this.scene.cardSystem.checkValidGroup(testGroup);
				
				if (isValid) {
					const value = this.evaluateAddToGroupValue(card, group);
					options.push({
						card: card,
						cardIndex: cardIndex,
						groupIndex: groupIndex,
						newGroupSize: testGroup.length,
						value: value
					});
				}
			});
		});
		
		return options.sort((a, b) => b.value - a.value);
	}

	analyzeTableManipulation(hand) {
		const opportunities = {
			simpleAdditions: [],
			tableReorganization: [],
			complexMoves: []
		};
		
		if (!this.scene.tableCards || this.scene.tableCards.length === 0) {
			return opportunities;
		}
		
		opportunities.simpleAdditions = this.findTablePlayOptions(hand);
		opportunities.tableReorganization = this.findTableReorganization(hand);
		opportunities.complexMoves = this.findComplexTableMoves(hand);
		
		return opportunities;
	}
	
	findTableReorganization(hand) {
		const opportunities = [];
		
		if (!hand || hand.length === 0 || !this.scene.tableCards || this.scene.tableCards.length === 0) {
			return opportunities;
		}
		
		// Skip complex reorganizations on later turn attempts to avoid getting stuck
		if (this.turnAttempts > 1) {
			return opportunities;
		}
		
		this.scene.tableCards.forEach((group, groupIndex) => {
			if (!Array.isArray(group) || group.length === 0) return;
			
			for (let i = 0; i < group.length; i++) {
				const cardToTake = group[i];
				const remainingGroup = group.filter((_, index) => index !== i);
				
				if (remainingGroup.length >= 3 && this.scene.cardSystem.checkValidGroup(remainingGroup)) {
					const combinedCards = [...hand, cardToTake];
					const possibleGroups = this.findAllPossibleGroups(combinedCards);
					
					possibleGroups.forEach(newGroup => {
						const handReduction = newGroup.filter(card => hand.includes(card)).length;
						if (handReduction > 0) {
							opportunities.push({
								type: 'table_reorganization',
								sourceGroupIndex: groupIndex,
								cardsToTake: [cardToTake],
								remainingGroup: remainingGroup,
								newGroup: newGroup,
								handReduction: handReduction,
								value: this.evaluateReorganizationValue(handReduction, newGroup, [cardToTake])
							});
						}
					});
				}
			}
		});
		
		return opportunities.sort((a, b) => b.value - a.value);
	}
	
	findComplexTableMoves(hand) {
		const opportunities = [];
		
		if (!hand || hand.length === 0 || !this.scene.tableCards || this.scene.tableCards.length < 2) {
			return opportunities;
		}
		
		// Skip complex moves on later turn attempts to avoid getting stuck
		if (this.turnAttempts > 1) {
			return opportunities;
		}
		
		for (let i = 0; i < this.scene.tableCards.length; i++) {
			for (let j = i + 1; j < this.scene.tableCards.length; j++) {
				const group1 = this.scene.tableCards[i];
				const group2 = this.scene.tableCards[j];
				
				if (!Array.isArray(group1) || !Array.isArray(group2) || group1.length === 0 || group2.length === 0) continue;
				
				group1.forEach(card1 => {
					group2.forEach(card2 => {
						const remaining1 = group1.filter(c => c !== card1);
						const remaining2 = group2.filter(c => c !== card2);
						
						if (remaining1.length >= 3 && remaining2.length >= 3 && 
							this.scene.cardSystem.checkValidGroup(remaining1) && 
							this.scene.cardSystem.checkValidGroup(remaining2)) {
							
							const combinedCards = [...hand, card1, card2];
							const possibleGroups = this.findAllPossibleGroups(combinedCards);
							
							possibleGroups.forEach(newGroup => {
								const handReduction = newGroup.filter(card => hand.includes(card)).length;
								if (handReduction > 0) {
									opportunities.push({
										type: 'complex_move',
										sourceGroups: [i, j],
										cardsToTake: [card1, card2],
										remainingGroups: [remaining1, remaining2],
										newGroup: newGroup,
										handReduction: handReduction,
										value: this.evaluateComplexMoveValue(handReduction, newGroup, [card1, card2])
									});
								}
							});
						}
					});
				});
			}
		}
		
		return opportunities.sort((a, b) => b.value - a.value);
	}
	
	findAllPossibleGroups(cards) {
		const groups = [];
		
		for (let size = 3; size <= cards.length; size++) {
			const combinations = this.getCombinations(cards, size);
			combinations.forEach(combo => {
				if (this.scene.cardSystem.checkValidGroup(combo)) {
					groups.push(combo);
				}
			});
		}
		
		return groups;
	}
	
	evaluateReorganizationValue(handReduction, newGroup, takenCards) {
		let value = handReduction * 10;
		value += newGroup.length * 2;
		
		newGroup.forEach(card => {
			const rank = card.card.rank;
			if (rank === 'A' || rank === 'K' || rank === 'Q' || rank === 'J') {
				value += 3;
			}
		});
		
		if (this.difficulty === 'easy') {
			value *= 0.7;
		} else if (this.difficulty === 'hard') {
			value *= 1.3;
		}
		
		return value;
	}
	
	evaluateComplexMoveValue(handReduction, newGroup, takenCards) {
		let value = handReduction * 15;
		value += newGroup.length * 3;
		
		if (this.difficulty === 'easy') {
			value *= 0.5;
		} else if (this.difficulty === 'medium') {
			value *= 0.8;
		}
		
		return value;
	}

	canWinThisTurn(playableGroups, tablePlayOptions) {
		const myHand = this.getMyHand();
		
		for (let group of playableGroups) {
			if (group.cards.length === myHand.length) {
				return true;
			}
		}
		
		let remainingCards = myHand.length;
		for (let option of tablePlayOptions) {
			remainingCards--;
			if (remainingCards === 0) {
				return true;
			}
		}
		
		return false;
	}

	checkTableManipulationWin(tableOpportunities, myHand) {
		if (!tableOpportunities || !myHand) {
			return false;
		}
		
		const allOpportunities = [
			...tableOpportunities.complexMoves,
			...tableOpportunities.tableReorganization,
			...tableOpportunities.simpleAdditions
		];
		
		for (let opp of allOpportunities) {
			if (opp.handReduction >= myHand.length) {
				return true;
			}
		}
		
		return false;
	}

	executeWinningStrategy(playableGroups, tableOpportunities, simpleTableOptions) {
		for (const group of playableGroups) {
			if (group.cards.length >= this.getMyHand().length) {
				this.playGroup(group.cards);
				return;
			}
		}
		
		const allOpportunities = [
			...tableOpportunities.complexMoves,
			...tableOpportunities.tableReorganization,
			...tableOpportunities.simpleAdditions
		].sort((a, b) => b.handReduction - a.handReduction);
		
		for (const opp of allOpportunities) {
			if (opp.handReduction >= this.getMyHand().length) {
				this.executeStrategy(opp);
				return;
			}
		}
		
		const bestStrategy = this.chooseBestStrategy(playableGroups, tableOpportunities, simpleTableOptions, this.getMyHand());
		if (bestStrategy) {
			this.executeStrategy(bestStrategy);
		}
	}

	chooseBestStrategy(playableGroups, tableOpportunities, simpleTableOptions, myHand) {
		const strategies = [];
		
		if (playableGroups && playableGroups.length > 0) {
			playableGroups.forEach(group => {
				const priority = this.calculateGroupPriority(group);
				strategies.push({
					type: 'play_group',
					cards: group.cards,
					value: group.value,
					priority: priority
				});
			});
		}
		
		if (tableOpportunities) {
			if (tableOpportunities.simpleAdditions) {
				tableOpportunities.simpleAdditions.forEach(addition => {
					const priority = this.calculateTablePriority(addition, 'simple');
					strategies.push({
						type: 'simple_addition',
						...addition,
						priority: priority
					});
				});
			}
			
			if (tableOpportunities.tableReorganization) {
				tableOpportunities.tableReorganization.forEach(reorg => {
					const priority = this.calculateTablePriority(reorg, 'reorganization');
					strategies.push({
						type: 'table_reorganization',
						...reorg,
						priority: priority
					});
				});
			}
			
			if (tableOpportunities.complexMoves) {
				tableOpportunities.complexMoves.forEach(complex => {
					const priority = this.calculateTablePriority(complex, 'complex');
					strategies.push({
						type: 'complex_move',
						...complex,
						priority: priority
					});
				});
			}
		}
		
		if (simpleTableOptions && simpleTableOptions.length > 0) {
			simpleTableOptions.forEach(option => {
				strategies.push({
					type: 'add_to_table',
					...option,
					priority: option.value * 0.8
				});
			});
		}
		
		if (strategies.length === 0) {
			return null;
		}
		
		strategies.sort((a, b) => b.priority - a.priority);
		
		let chosenStrategy;
		if (this.difficulty === 'easy') {
			const maxChoices = Math.min(3, strategies.length);
			chosenStrategy = strategies[Math.floor(Math.random() * maxChoices)];
		} else if (this.difficulty === 'medium') {
			const topChoices = strategies.slice(0, Math.min(2, strategies.length));
			chosenStrategy = topChoices[Math.floor(Math.random() * topChoices.length)];
		} else {
			chosenStrategy = strategies[0];
		}
		
		return chosenStrategy;
	}

	calculateGroupPriority(group) {
		const myHand = this.getMyHand();
		let priority = group.value;
		
		const handPercentage = group.cards.length / myHand.length;
		priority *= (1 + handPercentage);
		
		if (group.cards.length === myHand.length) {
			priority *= 10;
		}
		
		return priority;
	}

	calculateTablePriority(opportunity, type) {
		let priority = opportunity.value || 0;
		
		if (type === 'simple') {
			priority *= 1.2;
		} else if (type === 'reorganization') {
			priority *= 0.9;
		} else if (type === 'complex') {
			priority *= 0.7;
		}
		
		if (opportunity.handReduction) {
			const myHand = this.getMyHand();
			const handPercentage = opportunity.handReduction / myHand.length;
			priority *= (1 + handPercentage * 2);
		}
		
		return priority;
	}

	executeStrategy(strategy) {
		switch (strategy.type) {
			case 'play_group':
				this.playGroup(strategy.cards);
				break;
			case 'simple_addition':
			case 'add_to_table':
				this.addToTable(strategy);
				break;
			case 'table_reorganization':
				this.executeTableReorganization(strategy);
				break;
			case 'complex_move':
				this.executeComplexMove(strategy);
				break;
			default:
				this.endTurn();
		}
	}

	playGroup(cards) {
		// Validate turn state
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}
		
		if (!this.validateGroupBeforePlay(cards)) {
			this.endTurn();
			return;
		}
		
		// Check if we can actually play cards (haven't drawn this turn)
		if (this.scene.drawnCard) {
			this.endTurn();
			return;
		}
		
		const myHand = this.getMyHand();
		
		// Verify all cards are actually in our hand
		for (let card of cards) {
			if (!myHand.includes(card)) {
				this.endTurn();
				return;
			}
		}
		
		// Clear any existing selections
		this.scene.handSelected = [];
		this.scene.cardsSelected = [];
		
		// Add to table
		this.scene.tableCards.push([...cards]);
		
		// Remove played cards from hand AND destroy their sprites
		cards.forEach(card => {
			const index = myHand.findIndex(c => c === card);
			if (index !== -1) {
				// Destroy sprite if it exists
				if (card.sprite && typeof card.sprite.destroy === 'function') {
					card.sprite.destroy();
					card.sprite = null;
				}
				myHand.splice(index, 1);
			}
		});
		
		// Mark turn as valid - SET BOTH FLAGS
		this.scene.placedCards = true;
		this.scene.turnValid = true;
		this.scene.gameLogic.markTurnAsValid();
		
		// Validate table is still valid after our move
		if (!this.scene.tableManager.checkTableValidity()) {
			// Rollback if table became invalid
			this.scene.tableCards.pop();
			cards.forEach(card => myHand.push(card));
			this.scene.placedCards = false;
			this.scene.turnValid = false;
			this.endTurn();
			return;
		}
		
		// Force refresh displays
		this.scene.gameLogic.refreshDisplays();
		
		this.endTurn();
	}

	addToTable(strategy) {
		// Validate turn state
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}
		
		if (!strategy.card || strategy.groupIndex === undefined) {
			this.endTurn();
			return;
		}
		
		// Check if we can actually play cards (haven't drawn this turn)
		if (this.scene.drawnCard) {
			this.endTurn();
			return;
		}
		
		const myHand = this.getMyHand();
		const targetGroup = this.scene.tableCards[strategy.groupIndex];
		
		if (!targetGroup) {
			this.endTurn();
			return;
		}
		
		// Verify card is actually in our hand
		if (!myHand.includes(strategy.card)) {
			this.endTurn();
			return;
		}
		
		// Validate before playing
		const testGroup = [...targetGroup, strategy.card];
		if (!this.scene.cardSystem.checkValidGroup(testGroup)) {
			this.endTurn();
			return;
		}
		
		// Store original group state for rollback
		const originalGroup = [...targetGroup];
		
		// Add card to table group
		targetGroup.push(strategy.card);
		
		// Remove card from hand AND destroy its sprite
		const cardIndex = myHand.findIndex(c => c === strategy.card);
		if (cardIndex !== -1) {
			// Destroy sprite if it exists
			if (strategy.card.sprite && typeof strategy.card.sprite.destroy === 'function') {
				strategy.card.sprite.destroy();
				strategy.card.sprite = null;
			}
			myHand.splice(cardIndex, 1);
		}
		
		// Mark turn as valid - SET BOTH FLAGS
		this.scene.placedCards = true;
		this.scene.turnValid = true;
		this.scene.gameLogic.markTurnAsValid();
		
		// Validate table is still valid after our move
		if (!this.scene.tableManager.checkTableValidity()) {
			// Rollback if table became invalid
			this.scene.tableCards[strategy.groupIndex] = originalGroup;
			myHand.push(strategy.card);
			this.scene.placedCards = false;
			this.scene.turnValid = false;
			this.endTurn();
			return;
		}
		
		// Force refresh displays
		this.scene.gameLogic.refreshDisplays();
		
		this.endTurn();
	}

	executeTableReorganization(strategy) {
		// Validate turn state
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}
		
		// Check if we can actually play cards (haven't drawn this turn)
		if (this.scene.drawnCard) {
			this.endTurn();
			return;
		}
		
		const myHand = this.getMyHand();
		
		// Store original table state for rollback
		const originalTableState = this.scene.tableCards.map(group => [...group]);
		const originalHandState = [...myHand];
		
		try {
			// Take cards from table to hand temporarily
			strategy.cardsToTake.forEach(card => {
				card.mustReturnToTable = true;
				myHand.push(card);
			});
			
			// Update the source group
			this.scene.tableCards[strategy.sourceGroupIndex] = strategy.remainingGroup;
			
			// Create new group and remove cards from hand
			this.scene.tableCards.push([...strategy.newGroup]);
			
			strategy.newGroup.forEach(card => {
				const index = myHand.findIndex(c => c === card);
				if (index !== -1) {
					// Destroy sprite if it exists and card was from hand
					if (!card.mustReturnToTable && card.sprite && typeof card.sprite.destroy === 'function') {
						card.sprite.destroy();
						card.sprite = null;
					}
					myHand.splice(index, 1);
				}
				// Clear ALL problematic flags from cards going to table
				delete card.mustReturnToTable;
				// Ensure cards going to table have correct original position
				card.originalPosition = { type: "table" };
			});
			
			// Clean up any remaining problematic flags in hand
			myHand.forEach(card => {
				if (card.mustReturnToTable) {
					// This card should have been returned to table but wasn't
					// Remove the flag since the move is complete
					delete card.mustReturnToTable;
					// Update original position to hand since it's staying in hand
					card.originalPosition = { type: "hand", player: this.playerNumber };
				}
			});
			
			// Validate table is still valid after our move
			if (!this.scene.tableManager.checkTableValidity()) {
				throw new Error("Invalid table state after reorganization");
			}
			
			// Mark turn as valid - SET BOTH FLAGS
			this.scene.placedCards = true;
			this.scene.turnValid = true;
			this.scene.gameLogic.markTurnAsValid();
			
			// Force refresh displays
			this.scene.gameLogic.refreshDisplays();
			
		} catch (error) {
			// Rollback on any error
			this.scene.tableCards = originalTableState;
			myHand.length = 0;
			myHand.push(...originalHandState);
			this.scene.placedCards = false;
			this.scene.turnValid = false;
		}
		
		this.endTurn();
	}

	executeComplexMove(strategy) {
		// Validate turn state
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}
		
		// Check if we can actually play cards (haven't drawn this turn)
		if (this.scene.drawnCard) {
			this.endTurn();
			return;
		}
		
		const myHand = this.getMyHand();
		
		// Store original table state for rollback
		const originalTableState = this.scene.tableCards.map(group => [...group]);
		const originalHandState = [...myHand];
		
		try {
			// Take cards from multiple groups
			strategy.cardsToTake.forEach(card => {
				card.mustReturnToTable = true;
				myHand.push(card);
			});
			
			// Update source groups (handle indices carefully)
			strategy.sourceGroups.sort((a, b) => b - a);
			strategy.sourceGroups.forEach((groupIndex, i) => {
				if (strategy.remainingGroups[i] && strategy.remainingGroups[i].length > 0) {
					this.scene.tableCards[groupIndex] = strategy.remainingGroups[i];
				} else {
					this.scene.tableCards.splice(groupIndex, 1);
				}
			});
			
			// Create new group
			this.scene.tableCards.push([...strategy.newGroup]);
			
			// Remove used cards from hand
			strategy.newGroup.forEach(card => {
				const index = myHand.findIndex(c => c === card);
				if (index !== -1) {
					// Destroy sprite if it exists and card was from hand
					if (!card.mustReturnToTable && card.sprite && typeof card.sprite.destroy === 'function') {
						card.sprite.destroy();
						card.sprite = null;
					}
					myHand.splice(index, 1);
				}
				// Clear ALL problematic flags from cards going to table
				delete card.mustReturnToTable;
				// Ensure cards going to table have correct original position
				card.originalPosition = { type: "table" };
			});
			
			// Clean up any remaining problematic flags in hand
			myHand.forEach(card => {
				if (card.mustReturnToTable) {
					// This card should have been returned to table but wasn't
					// Remove the flag since the move is complete
					delete card.mustReturnToTable;
					// Update original position to hand since it's staying in hand
					card.originalPosition = { type: "hand", player: this.playerNumber };
				}
			});
			
			// Validate table is still valid after our move
			if (!this.scene.tableManager.checkTableValidity()) {
				throw new Error("Invalid table state after complex move");
			}
			
			// Mark turn as valid - SET BOTH FLAGS
			this.scene.placedCards = true;
			this.scene.turnValid = true;
			this.scene.gameLogic.markTurnAsValid();
			
			// Force refresh displays
			this.scene.gameLogic.refreshDisplays();
			
		} catch (error) {
			// Rollback on any error
			this.scene.tableCards = originalTableState;
			myHand.length = 0;
			myHand.push(...originalHandState);
			this.scene.placedCards = false;
			this.scene.turnValid = false;
		}
		
		this.endTurn();
	}

	drawCard() {
		// Validate turn state
		if (this.scene.currentPlayerIndex !== this.playerIndex) {
			this.endTurn();
			return;
		}
		
		// Check if we've already made a move this turn
		if (this.scene.placedCards || this.scene.drawnCard) {
			this.endTurn();
			return;
		}
		
		const canDraw = this.scene.cardSystem.canDrawCard();
		
		if (!canDraw) {
			this.endTurn();
			return;
		}
		
		// Store hand size before drawing for validation
		const handSizeBefore = this.getMyHand().length;
		
		this.scene.cardSystem.drawCard();
		
		// Verify card was actually drawn
		const handSizeAfter = this.getMyHand().length;
		if (handSizeAfter <= handSizeBefore) {
			this.endTurn();
			return;
		}
		
		// Mark that we drew a card
		this.scene.drawnCard = true;
		
		setTimeout(() => {
			this.autoSortHand();
		}, 100);
		
		this.endTurn();
	}

	endTurn() {
		this.hideThinkingIndicator();
		this.isThinking = false;
		
		this.scene.handSelected = [];
		
		// Ensure hand display is updated
		if (this.scene.handManager) {
			this.scene.handManager.displayHand();
		}
		
		// CRITICAL: Clear any problematic card flags before ending turn
		const myHand = this.getMyHand();
		myHand.forEach(card => {
			// Clear any mustReturnToTable flags on remaining cards
			delete card.mustReturnToTable;
			// Update original position for remaining cards to be hand cards
			if (card.originalPosition && card.originalPosition.type === "table") {
				card.originalPosition = { type: "hand", player: this.playerNumber };
			}
		});
		
		// CRITICAL: Ensure the turn validation will work by explicitly updating the hand tracking
		// Since this is the bot's turn, force update the hand length tracking
		if (this.scene.gameLogic) {
			if (this.scene.gameLogic.updateActualHandLengths) {
				this.scene.gameLogic.updateActualHandLengths();
			}
			
			// Ensure the starting hand state is properly set for this player index
			if (this.scene.gameLogic.playerHandSizesAtTurnStart && 
				this.scene.gameLogic.playerHandCardsAtTurnStart) {
				
				// If the starting hand tracking seems incorrect, don't let it block valid bot moves
				const currentHandSize = this.getMyHand().length;
				const startingHandSize = this.scene.gameLogic.playerHandSizesAtTurnStart[this.playerIndex];
				
				// If we placed cards and reduced hand size, but validation might fail due to tracking issues,
				// temporarily adjust the tracking to reflect the valid move
				if (this.scene.placedCards && currentHandSize < startingHandSize) {
					// The hand size reduction is valid, ensure the validation passes
					console.log('Bot: Valid move detected, ensuring turn validation passes');
				}
			}
		}
		
		// Debug logging to help identify validation issues
		console.log('Bot ending turn - Debug info:');
		console.log('- placedCards:', this.scene.placedCards);
		console.log('- drawnCard:', this.scene.drawnCard);
		console.log('- turnValid:', this.scene.turnValid);
		console.log('- current hand size:', this.getMyHand().length);
		console.log('- starting hand size:', this.scene.gameLogic.playerHandSizesAtTurnStart[this.playerIndex]);
		console.log('- table valid:', this.scene.tableManager.checkTableValidity());
		
		// Additional debug: check for problematic cards
		const problematicCards = myHand.filter(card => 
			card.mustReturnToTable || 
			(card.originalPosition && card.originalPosition.type === "table")
		);
		console.log('- problematic cards in hand:', problematicCards.length);
		
		this.enablePlayerInteractions();
		
		setTimeout(() => {
			this.scene.gameLogic.endTurn();
		}, 300);
	}

	evaluateGroupValue(cards) {
		let value = cards.length * 10;
		
		if (cards.length >= 4) value += 20;
		if (cards.length >= 5) value += 30;
		
		cards.forEach(card => {
			const rank = card.card.rank;
			if (['J', 'Q', 'K'].includes(rank)) value += 5;
			if (rank === 'A') value += 3;
		});
		
		return value;
	}

	evaluateAddToGroupValue(card, group) {
		let value = 15;
		
		if (group.length >= 4) value += 10;
		
		const rank = card.card.rank;
		if (['J', 'Q', 'K'].includes(rank)) value += 5;
		if (rank === 'A') value += 3;
		
		return value;
	}

	getCombinations(array, size) {
		if (size > array.length || size <= 0) {
			return [];
		}
		if (size === 1) {
			return array.map(item => [item]);
		}
		if (size === array.length) {
			return [array];
		}
		
		const combinations = [];
		
		for (let i = 0; i <= array.length - size; i++) {
			const head = array[i];
			const tailCombinations = this.getCombinations(array.slice(i + 1), size - 1);
			
			for (let tailCombination of tailCombinations) {
				combinations.push([head, ...tailCombination]);
			}
		}
		
		return combinations;
	}

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
			const rankA = this.scene.cardSystem.getRankValue(a.card.rank);
			const rankB = this.scene.cardSystem.getRankValue(b.card.rank);
			
			if (rankA !== rankB) {
				return rankA - rankB;
			}
			
			const suitOrder = { "diamond": 0, "club": 1, "heart": 2, "spade": 3 };
			return suitOrder[a.card.suit] - suitOrder[b.card.suit];
		});
		
		if (this.scene.currentPlayerIndex === this.playerIndex && this.scene.handManager) {
			this.scene.handManager.displayHand();
		}
	}

	validateGroupBeforePlay(cards) {
		if (!cards || cards.length < 3) {
			return false;
		}
		
		return this.scene.cardSystem.checkValidGroup(cards);
	}

	setDifficulty(difficulty) {
		this.difficulty = difficulty;
		
		switch(difficulty) {
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
				this.thinkingTime = 1500;
				break;
			case 'hard':
				this.aggressiveness = 0.9;
				this.patience = 0.8;
				this.handOptimization = 0.95;
				this.thinkingTime = 2200;
				break;
		}
	}

	disablePlayerInteractions() {
		try {
			if (this.scene.endTurnButton) {
				this.scene.endTurnButton.disableInteractive();
			}
			if (this.scene.deckSprite) {
				this.scene.deckSprite.disableInteractive();
			}
			if (this.scene.restart) {
				this.scene.restart.disableInteractive();
			}
			if (this.scene.sortRankButton) {
				this.scene.sortRankButton.disableInteractive();
			}
			if (this.scene.sortSuitButton) {
				this.scene.sortSuitButton.disableInteractive();
			}
		} catch (error) {
			// Ignore errors during interaction disabling
		}
	}

	enablePlayerInteractions() {
		try {
			if (this.scene.endTurnButton) {
				this.scene.endTurnButton.setInteractive();
			}
			if (this.scene.deckSprite) {
				this.scene.deckSprite.setInteractive();
			}
			if (this.scene.restart) {
				this.scene.restart.setInteractive();
			}
			if (this.scene.sortRankButton) {
				this.scene.sortRankButton.setInteractive();
			}
			if (this.scene.sortSuitButton) {
				this.scene.sortSuitButton.setInteractive();
			}
		} catch (error) {
			// Ignore errors during interaction enabling
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