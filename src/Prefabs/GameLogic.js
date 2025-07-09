// GameLogic.js - Handles turn management, win conditions, and game flow

class GameLogic {
    constructor(scene) {
        this.scene = scene;
    }

    // Initializes all game state variables at the start of the game
    initializeVariables() {
        this.scene.handSelected = [];
        this.scene.borderUISize = -25;
        this.scene.turnValid = false;
        this.scene.p1Turn = true;
        this.scene.p2Turn = false;
        this.scene.drawn = false;
        this.scene.drawnCard = false;
        this.scene.placedCards = false;
        this.scene.resetPressed = false;
        this.scene.p1Hand = [];
        this.scene.p2Hand = [];
        this.scene.cardsSelected = [];
        this.scene.tableCards = [];
        
        // Track actual hand lengths for win condition (updated only when turn completes)
        // Initialize to 0 - will be set correctly after dealing cards
        this.scene.p1ActualHandLength = 0; 
        this.scene.p2ActualHandLength = 0;
        
        // Flag to track when moves are being processed to prevent inappropriate flashing
        this.isProcessingMove = false;
        
        // Track cards that were on table at start of turn for validation
        this.cardsOnTableAtTurnStart = [];
        
        // Track cards that were in hands at start of turn for validation
        this.cardsInHandAtTurnStart = [];
        
        // Track hand sizes at turn start for validation
        this.p1HandSizeAtTurnStart = 0;
        this.p2HandSizeAtTurnStart = 0;
    }

    // Resets turn-specific flags when starting a new turn
    startNewTurn() {
        this.scene.drawn = false;
        this.scene.drawnCard = false;
        this.scene.placedCards = false;
        this.scene.resetPressed = false;
        this.scene.cardsSelected = [];
        this.scene.turnValid = false;
        
        // Track cards that start this turn on the table for validation
        this.cardsOnTableAtTurnStart = [];
        this.scene.tableCards.forEach(group => {
            group.forEach(card => {
                this.cardsOnTableAtTurnStart.push(card);
            });
        });
        
        // Track cards that start this turn in hands for validation
        this.cardsInHandAtTurnStart = [];
        [...this.scene.p1Hand, ...this.scene.p2Hand].forEach(card => {
            this.cardsInHandAtTurnStart.push(card);
        });
        
        // Also track the hand sizes at turn start for validation
        this.p1HandSizeAtTurnStart = this.scene.p1Hand.length;
        this.p2HandSizeAtTurnStart = this.scene.p2Hand.length;
        
        console.log(`Turn start - P1 hand: ${this.scene.p1Hand.length}, P2 hand: ${this.scene.p2Hand.length}`);
        console.log(`Total cards in hands at turn start: ${this.cardsInHandAtTurnStart.length}`);
        
        // Flag all cards currently on the table as "must return to table"
        this.flagTableCardsForTurn();
        
        // Clear any lingering hand selection tints from previous turn
        this.clearHandSelectionTints();
    }
    
    // Flags all cards currently on the table as needing to return to the table by turn end
    flagTableCardsForTurn() {
        let totalFlagged = 0;
        this.scene.tableCards.forEach(group => {
            group.forEach(card => {
                card.mustReturnToTable = true;
                totalFlagged++;
            });
        });
        console.log("Flagged", totalFlagged, "cards on table at start of turn");
    }

    // Checks if either player has won by emptying their hand
    checkWinCondition() {
        // During a reset operation, don't check win conditions at all
        if (this.scene.resetPressed) {
            return; // Skip win check during reset
        }
        
        // Don't check win conditions if the game hasn't started (no cards dealt yet)
        if (this.scene.p1ActualHandLength === 0 && this.scene.p2ActualHandLength === 0) {
            return;
        }
        
        // Use tracked hand lengths for win condition, but also verify with actual hands
        // This prevents false wins during temporary operations
        const p1ActualEmpty = this.scene.p1Hand.length === 0;
        const p2ActualEmpty = this.scene.p2Hand.length === 0;
        const p1TrackedEmpty = this.scene.p1ActualHandLength === 0;
        const p2TrackedEmpty = this.scene.p2ActualHandLength === 0;
        
        // Only trigger win if both tracked and actual agree (this prevents false wins)
        if (p1ActualEmpty && p1TrackedEmpty) {
            this.handleWin(true);
        } else if (p2ActualEmpty && p2TrackedEmpty) {
            this.handleWin(false);
        }
    }

    // Handles the win condition by transitioning to the win scene
    handleWin(p1Win) {
        console.log(p1Win ? "Player 1 wins" : "Player 2 wins");
        this.scene.scene.start("winScene", { p1Win });
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
        // Allow ending turn if either:
        // 1. A card was drawn (and no cards were permanently placed)
        // 2. Cards were placed on the table AND all table groups are valid
        const canEndTurn = this.scene.drawnCard || 
                          (this.scene.placedCards && this.scene.tableManager.checkTableValidity());
        
        // Additional check: ensure no table cards are left in hands
        const tableCardsInHands = this.checkForTableCardsInHands();
        
        // Additional check: ensure player made a valid turn action
        const validTurnAction = this.checkValidTurnAction();
        
        // Debug logging
        if (tableCardsInHands) {
            console.log("Turn end blocked: Table cards still in hands");
            this.debugTableCards();
        }
        
        if (!validTurnAction) {
            console.log("Turn end blocked: No valid turn action taken");
        }
        
        if (canEndTurn && !tableCardsInHands && validTurnAction) {
            // Clear all hand card selection tints when turn ends
            this.clearHandSelectionTints();
            
            // Clear the mustReturnToTable flags since turn is ending successfully
            this.clearTableCardFlags();
            
            // Clear the turn start tracking
            this.cardsOnTableAtTurnStart = [];
            this.cardsInHandAtTurnStart = [];
            
            this.updateOriginalPositions();
            this.updateActualHandLengths(); // Update tracked hand lengths when turn completes
            this.switchTurn();
            this.resetTurnFlags();
        } else {
            // Invalid turn end attempt - could provide user feedback here
            // Reasons: must draw or place cards, all table groups must be valid, 
            // no table cards can remain in hands, and must make valid turn action
            if (tableCardsInHands) {
                console.log("Cannot end turn: cards taken from table must be returned to table");
            } else if (!validTurnAction) {
                console.log("Cannot end turn: must draw a card or place at least one hand card on table");
            } else if (!canEndTurn) {
                if (!this.scene.drawnCard && !this.scene.placedCards) {
                    console.log("Cannot end turn: must draw a card or place cards on table");
                } else if (this.scene.placedCards && !this.scene.tableManager.checkTableValidity()) {
                    console.log("Cannot end turn: all table groups must be valid");
                }
            }
        }
    }
    
    // Debug helper to show which cards are flagged
    debugTableCards() {
        const p1TableCards = this.scene.p1Hand.filter(card => card.mustReturnToTable);
        const p2TableCards = this.scene.p2Hand.filter(card => card.mustReturnToTable);
        
        console.log("P1 hand has", p1TableCards.length, "table cards");
        console.log("P2 hand has", p2TableCards.length, "table cards");
        
        p1TableCards.forEach(card => {
            console.log("P1 table card:", card.card.rank, "of", card.card.suit);
        });
        p2TableCards.forEach(card => {
            console.log("P2 table card:", card.card.rank, "of", card.card.suit);
        });
    }
    
    // Checks if any cards flagged as table cards are currently in player hands
    checkForTableCardsInHands() {
        const allHandCards = [...this.scene.p1Hand, ...this.scene.p2Hand];
        
        // Primary check: look for cards flagged as mustReturnToTable
        const flaggedCards = allHandCards.filter(card => card.mustReturnToTable);
        
        // Secondary check: look for cards that originally came from table
        const tableOriginCards = allHandCards.filter(card => 
            card.originalPosition && card.originalPosition.type === "table"
        );
        
        // Tertiary check: look for cards that were on table at start of turn
        const turnStartTableCards = allHandCards.filter(card => 
            this.cardsOnTableAtTurnStart && this.cardsOnTableAtTurnStart.includes(card)
        );
        
        // Combine all checks - if ANY card from table is in hand, block turn end
        const allProblematicCards = [...flaggedCards, ...tableOriginCards, ...turnStartTableCards];
        
        // Remove duplicates by using a Set with card identity
        const uniqueProblematicCards = Array.from(new Set(allProblematicCards));
        
        if (uniqueProblematicCards.length > 0) {
            console.log("Found", uniqueProblematicCards.length, "table cards in hands:");
            uniqueProblematicCards.forEach(card => {
                console.log("- " + card.card.rank + " of " + card.card.suit, 
                    "(flagged:", !!card.mustReturnToTable, 
                    "tableOrigin:", !!(card.originalPosition && card.originalPosition.type === "table"),
                    "turnStart:", !!(this.cardsOnTableAtTurnStart && this.cardsOnTableAtTurnStart.includes(card)), ")");
            });
        }
        
        return uniqueProblematicCards.length > 0;
    }
    
    // Clears the mustReturnToTable flags from all cards
    clearTableCardFlags() {
        // Clear flags from hand cards
        const allHandCards = [...this.scene.p1Hand, ...this.scene.p2Hand];
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
        // Update original positions for all cards
        this.scene.p1Hand.forEach((card, index) => {
            card.originalPosition = { type: "hand", player: 1, index };
        });
        this.scene.p2Hand.forEach((card, index) => {
            card.originalPosition = { type: "hand", player: 2, index };
        });
        this.scene.tableCards.forEach((group, groupIndex) => {
            group.forEach((card, cardIndex) => {
                card.originalPosition = { type: "table", groupIndex, cardIndex };
            });
        });
    }

    // Updates tracked hand lengths to match actual current hand sizes
    updateActualHandLengths() {
        // Update the tracked hand lengths to reflect the current actual state
        this.scene.p1ActualHandLength = this.scene.p1Hand.length;
        this.scene.p2ActualHandLength = this.scene.p2Hand.length;
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

    // Switches the active player turn
    switchTurn() {
        this.scene.p1Turn = !this.scene.p1Turn;
        this.scene.p2Turn = !this.scene.p2Turn;
        
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
        
        // Restore the turn start tracking arrays to match the current state
        // This ensures validation checks work correctly after reset
        this.cardsOnTableAtTurnStart = [];
        this.scene.tableCards.forEach(group => {
            group.forEach(card => {
                this.cardsOnTableAtTurnStart.push(card);
            });
        });
        
        this.cardsInHandAtTurnStart = [];
        [...this.scene.p1Hand, ...this.scene.p2Hand].forEach(card => {
            this.cardsInHandAtTurnStart.push(card);
        });
        
        // Re-flag all table cards as must return to table (since we're back to turn start)
        this.flagTableCardsForTurn();
        
        // Clear any lingering hand selection tints and refresh UI
        this.clearHandSelectionTints();
        this.scene.updateValidationBoxVisibility();
        
        // Refresh hand display to show proper visual indicators for table cards
        this.scene.handManager.displayHand();
        
        // Reset can now be safely completed without worrying about false win conditions
        this.scene.resetPressed = false;
        this.isProcessingMove = false; // Clear processing flag
        
        console.log("Reset completed: Turn state restored to beginning of turn");
    }

    // Checks if the player has made a valid turn action (drew card or placed hand card on table)
    checkValidTurnAction() {
        // If a card was drawn, that's a valid turn action
        if (this.scene.drawnCard) {
            console.log("Valid turn action: card was drawn");
            return true;
        }
        
        // Debug: Log what we're checking
        console.log("Checking valid turn action...");
        console.log("Cards in hand at turn start:", this.cardsInHandAtTurnStart?.length || 0);
        
        // Check if at least one card that started in hand is now on the table
        let handCardsFoundOnTable = 0;
        this.scene.tableCards.forEach((group, groupIndex) => {
            group.forEach(card => {
                if (this.cardsInHandAtTurnStart && this.cardsInHandAtTurnStart.includes(card)) {
                    handCardsFoundOnTable++;
                    console.log(`Found hand card on table: ${card.card.rank} of ${card.card.suit}`);
                }
            });
        });
        
        // Alternative check: if placedCards is true, verify that at least one card moved from hand to table
        if (this.scene.placedCards && handCardsFoundOnTable === 0) {
            console.log("placedCards is true but no hand cards found on table - checking alternative method");
            
            // Use the simple hand size tracking method
            const currentHand = this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
            const originalHandSize = this.scene.p1Turn ? this.p1HandSizeAtTurnStart : this.p2HandSizeAtTurnStart;
            
            console.log(`Player ${this.scene.p1Turn ? 1 : 2} - Original hand size: ${originalHandSize}, Current hand size: ${currentHand.length}`);
            
            // If current hand is smaller than original, cards were placed on table
            if (currentHand.length < originalHandSize) {
                const cardsPlaced = originalHandSize - currentHand.length;
                console.log(`Valid turn action: ${cardsPlaced} hand card(s) placed on table (detected by hand size change)`);
                return true;
            }
        }
        
        if (handCardsFoundOnTable > 0) {
            console.log(`Valid turn action: ${handCardsFoundOnTable} hand card(s) placed on table`);
            return true;
        }
        
        console.log("Invalid turn action: no card drawn and no hand cards placed on table");
        console.log("Note: Just moving table cards around doesn't constitute a valid turn");
        return false;
    }
}
