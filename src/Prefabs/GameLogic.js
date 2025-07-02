// GameLogic.js - Handles turn management, win conditions, and game flow

class GameLogic {
    constructor(scene) {
        this.scene = scene;
    }

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
    }

    startNewTurn() {
        this.scene.drawn = false;
        this.scene.drawnCard = false;
        this.scene.placedCards = false;
        this.scene.resetPressed = false;
        this.scene.cardsSelected = [];
        this.scene.turnValid = false;
    }

    checkWinCondition() {
        // During a reset operation, don't check win conditions at all
        if (this.scene.resetPressed) {
            console.log("Skipping win check - reset in progress");
            return;
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
        
        // Debug logging
        if (p1ActualEmpty || p2ActualEmpty || p1TrackedEmpty || p2TrackedEmpty) {
            console.log(`Win check: P1 actual=${this.scene.p1Hand.length}, tracked=${this.scene.p1ActualHandLength}, P2 actual=${this.scene.p2Hand.length}, tracked=${this.scene.p2ActualHandLength}`);
        }
        
        // Only trigger win if both tracked and actual agree (this prevents false wins)
        if (p1ActualEmpty && p1TrackedEmpty) {
            this.handleWin(true);
        } else if (p2ActualEmpty && p2TrackedEmpty) {
            this.handleWin(false);
        }
    }

    handleWin(p1Win) {
        console.log(p1Win ? "Player 1 wins" : "Player 2 wins");
        this.scene.scene.start("winScene", { p1Win });
    }

    handleValidPlay() {
        const currentHand = this.scene.handManager.getCurrentHand();
        this.scene.tableManager.moveSelectedCardsToTable(currentHand);
        this.scene.refreshDisplays();
        this.scene.resetSelectedCards();
        this.scene.markTurnAsValid();
        
        // Don't update tracked hand lengths here - only update when turn actually ends
        // This allows for proper reset functionality
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
        // Allow ending turn if either:
        // 1. A card was drawn (and no cards were permanently placed)
        // 2. Cards were placed on the table AND all table groups are valid
        const canEndTurn = this.scene.drawnCard || 
                          (this.scene.placedCards && this.scene.tableManager.checkTableValidity());
        
        if (canEndTurn) {
            this.updateOriginalPositions();
            this.updateActualHandLengths(); // Update tracked hand lengths when turn completes
            this.switchTurn();
            this.resetTurnFlags();
            console.log("Turn ended");
        } else {
            if (!this.scene.drawnCard && !this.scene.placedCards) {
                console.log("Cannot end turn: must draw a card or place cards on the table");
            } else if (this.scene.placedCards && !this.scene.tableManager.checkTableValidity()) {
                console.log("Cannot end turn: all groups on the table must be valid");
            }
        }
    }

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

    updateActualHandLengths() {
        // Update the tracked hand lengths to reflect the current actual state
        // This is called only when a turn successfully completes
        const oldP1Length = this.scene.p1ActualHandLength;
        const oldP2Length = this.scene.p2ActualHandLength;
        
        this.scene.p1ActualHandLength = this.scene.p1Hand.length;
        this.scene.p2ActualHandLength = this.scene.p2Hand.length;
        
        console.log(`Updated actual hand lengths: P1=${oldP1Length}->${this.scene.p1ActualHandLength}, P2=${oldP2Length}->${this.scene.p2ActualHandLength}`);
    }

    switchTurn() {
        this.scene.p1Turn = !this.scene.p1Turn;
        this.scene.p2Turn = !this.scene.p2Turn;
    }

    resetTurnFlags() {
        this.scene.drawn = false;
        this.scene.drawnCard = false;
        this.scene.placedCards = false;
        this.scene.resetPressed = false;
        this.scene.cardsSelected = [];
        this.scene.turnValid = false;
    }

    resetHandToTable() {
        if (this.scene.drawnCard) {
            console.log("Cannot reset after drawing a card");
            return;
        }

        console.log("Resetting all cards to their original positions");
        this.scene.resetPressed = true;

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

        console.log(`Reset: Found ${allCards.length} total cards to restore`);

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
        
        console.log(`Reset complete: P1 hand=${this.scene.p1Hand.length}, P2 hand=${this.scene.p2Hand.length}, Table groups=${this.scene.tableCards.length}`);
        
        // Reset can now be safely completed without worrying about false win conditions
        this.scene.resetPressed = false;
    }
}
