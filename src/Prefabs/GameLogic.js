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
        if (!this.scene.resetPressed) {
            if (this.scene.p1Hand.length === 0) {
                this.handleWin(true);
            } else if (this.scene.p2Hand.length === 0) {
                this.handleWin(false);
            }
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

        console.log("Resetting hand to table");
        this.scene.resetPressed = true;

        // Move all cards back to their original positions
        const allCards = [...this.scene.p1Hand, ...this.scene.p2Hand];
        allCards.forEach((card) => {
            if (card.originalPosition) {
                if (card.originalPosition.type === "table") {
                    // Move card back to table
                    const groupIndex = card.originalPosition.groupIndex;
                    const cardIndex = card.originalPosition.cardIndex;

                    // Ensure the group exists
                    if (!this.scene.tableCards[groupIndex]) {
                        this.scene.tableCards[groupIndex] = [];
                    }

                    // Remove from hand
                    this.scene.handManager.removeCardFromHand(this.scene.p1Hand, card);
                    this.scene.handManager.removeCardFromHand(this.scene.p2Hand, card);

                    // Add to table
                    this.scene.tableCards[groupIndex][cardIndex] = card;
                    card.table = true;
                }
            }
        });

        // Clean up table cards array (remove empty slots)
        this.scene.tableCards = this.scene.tableCards.map(group => 
            group.filter(card => card != null)
        ).filter(group => group.length > 0);

        this.scene.cardsSelected = [];
        this.scene.refreshDisplays();
        this.scene.resetPressed = false;
    }
}
