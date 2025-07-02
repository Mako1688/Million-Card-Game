// CardSystem.js - Handles card creation, deck management, and card operations

class CardSystem {
    constructor(scene) {
        this.scene = scene;
    }

    createDeck() {
        let deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push(this.createCard(suit, rank));
                deck.push(this.createCard(suit, rank));
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

    dealCards() {
        for (let i = 0; i < 7; i++) {
            this.dealCardToPlayer(this.scene.p1Hand, 1);
            this.dealCardToPlayer(this.scene.p2Hand, 2);
        }
        
        // Update tracked hand lengths after dealing
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
            
            // Don't update tracked hand lengths here - only when turn ends
            // This allows for proper reset functionality
            
            // Refresh the hand display with the new card to trigger poof effect
            this.scene.handManager.displayHand(newCard);
            
            console.log("Card drawn");
        } else {
            this.handleInvalidDraw();
        }
    }

    canDrawCard() {
        // Basic checks
        if (this.scene.deck.length === 0 || 
            this.scene.drawn || 
            this.scene.drawnCard || 
            this.scene.placedCards) {
            return false;
        }

        // Check if current hand contains any cards that originally came from the table
        const currentHand = this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
        const hasTableCards = currentHand.some(card => 
            card.originalPosition && card.originalPosition.type === "table"
        );

        if (hasTableCards) {
            return false;
        }

        // Check if all groups on the table are valid
        if (!this.scene.tableManager.checkTableValidity()) {
            return false;
        }

        return true;
    }

    addCardToHand(newCard) {
        if (this.scene.p1Turn) {
            newCard.originalPosition = { type: "hand", player: 1 };
            this.scene.p1Hand.push(newCard);
        } else {
            newCard.originalPosition = { type: "hand", player: 2 };
            this.scene.p2Hand.push(newCard);
        }
    }

    handleInvalidDraw() {
        if (this.scene.deck.length === 0) {
            console.log("Cannot draw: deck is empty");
        } else if (this.scene.drawnCard) {
            console.log("Cannot draw: card already drawn this turn");
        } else if (this.scene.placedCards) {
            console.log("Cannot draw: cards already placed this turn");
        } else {
            // Check specific reasons why drawing is not allowed
            const currentHand = this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
            const hasTableCards = currentHand.some(card => 
                card.originalPosition && card.originalPosition.type === "table"
            );
            
            if (hasTableCards) {
                console.log("Cannot draw: hand contains cards taken from the table");
            } else if (!this.scene.tableManager.checkTableValidity()) {
                console.log("Cannot draw: table contains invalid groups");
            } else {
                console.log("Cannot draw: unknown reason");
            }
        }
    }

    getCardFrameIndex(card) {
        return suits.indexOf(card.card.suit) * 13 + ranks.indexOf(card.card.rank);
    }

    // Helper function to get the value of a rank, considering Aces high or low
    getRankValue(rank) {
        if (rank === "A") {
            return 1;
        }
        if (rank === "2") {
            return 2;
        }
        if (rank === "3") {
            return 3;
        }
        if (rank === "4") {
            return 4;
        }
        if (rank === "5") {
            return 5;
        }
        if (rank === "6") {
            return 6;
        }
        if (rank === "7") {
            return 7;
        }
        if (rank === "8") {
            return 8;
        }
        if (rank === "9") {
            return 9;
        }
        if (rank === "10") {
            return 10;
        }
        if (rank === "J") {
            return 11;
        }
        if (rank === "Q") {
            return 12;
        }
        if (rank === "K") {
            return 13;
        }
    }

    checkValidGroup(cards = []) {
        if (cards.length < 3) {
            return false;
        }

        const uniqueRanks = new Set(cards.map((card) => card.card.rank));
        const uniqueSuits = new Set(cards.map((card) => card.card.suit));

        // Check if it's a set (all cards have the same rank but different suits)
        if (uniqueRanks.size === 1 && uniqueSuits.size === cards.length) {
            return true;
        }

        // Check if it's a run (consecutive ranks with the same suit)
        if (uniqueSuits.size === 1) {
            const rankValues = cards
                .map((card) => this.getRankValue(card.card.rank))
                .sort((a, b) => a - b);

            // Check for consecutive ranks (Ace as low)
            for (let i = 1; i < rankValues.length; i++) {
                if (rankValues[i] !== rankValues[i - 1] + 1) {
                    // If not consecutive, check if it's a high-ace run
                    if (rankValues[0] === 1) {
                        // Check if the cards form a high-ace run (A-K-Q-J-10...)
                        const highAceValues = cards
                            .map((card) => {
                                if (card.card.rank === "A") {
                                    return 14; // Ace high
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
