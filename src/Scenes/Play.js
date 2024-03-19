class Play extends Phaser.Scene {
    constructor() {
        super('playScene')
    }

    init() {

    }

    preload() {
        
    }

    create() {
        console.log('play scene started')

        // Menu config
        let menuConfig = {
            fontFamily: 'PressStart2P',
            fontSize: '20px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            },
            fixedWidth: 0,
        }
        
        //create bools
        this.turnValid = false
        this.p1Turn = true
        this.p2Turn = false
        this.drawn = false

        //create deck
        this.deck = this.createDeck()
        this.deck = this.shuffle(this.deck)
        console.log(this.deck)

        //create hands
        this.p1Hand
        this.p2Hand

        //deal cards
        this.dealCards()

        //print deck
        console.log(this.deck)

        //place end turn button
        this.endTurnButton = this.add.sprite(w - borderPadding, h - borderPadding, 'end_turn', 0).setOrigin(1, 1).setScale(3)

        // Make the end turn clickable
        this.endTurnButton.setInteractive()

        // Add pointerover event listener for hovering
        this.endTurnButton.on('pointerover', () => {
            console.log('Turn Valid: ' + this.turnValid)
            console.log('end turn hover')
            //change to hover frame
            this.endTurnButton.setFrame(2, false)
        })

        // Add pointerout event listener for when hovering ends
        this.endTurnButton.on('pointerout', () => {
            console.log('end turn not hover')
             //change to none hover frame
             this.endTurnButton.setFrame(0, false)
        })

        // Listen for pointerdown event on the card
        this.endTurnButton.on('pointerdown', () => {
            this.endTurn()
            console.log('end turn press')
            //change to push frame
            this.endTurnButton.setFrame(1, false)
        })

        //place restart button
        this.restart = this.add.sprite(w - borderPadding, 0 + borderPadding, 'restart', 0).setOrigin(1, 0).setScale(3)

        // Make the restart clickable
        this.restart.setInteractive()

        // Add pointerover event listener for hovering
        this.restart.on('pointerover', () => {
            console.log('restart hover')
            //change to hover frame
            this.restart.setFrame(2, false)
        })

        // Add pointerout event listener for when hovering ends
        this.restart.on('pointerout', () => {
            console.log('restart not hover')
             //change to none hover frame
             this.restart.setFrame(0, false)
        })

        // Listen for pointerdown event on the card
        this.restart.on('pointerdown', () => {
            console.log('restart press')
            //change to push frame
            this.restart.setFrame(1, false)
        })

        //add deck to middle right
        this.deckSprite = this.add.sprite(w - borderPadding, centerY, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(5)
        this.add.sprite(this.deckSprite.x - 4, this.deckSprite.y + 4, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(4)
        this.add.sprite(this.deckSprite.x - 8, this.deckSprite.y + 8, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(3)
        this.add.sprite(this.deckSprite.x - 12, this.deckSprite.y + 12, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(2)

        // Make the deck clickable
        this.deckSprite.setInteractive()

        // Add pointerover event listener for hovering
        this.deckSprite.on('pointerover', () => {
            console.log(this.deck)
            console.log('deckSprite hovered')
            // Scale the card slightly larger
            this.tweens.add({
                targets: this.deckSprite,
                scaleX: 2.1,
                scaleY: 2.1,
                duration: 200,
                ease: 'Linear'
            })
        })

        // Add pointerout event listener for when hovering ends
        this.deckSprite.on('pointerout', () => {
            console.log('deckSprite not hovered')
            // Restore the deckSprite to its original scale
            this.tweens.add({
                targets: this.deckSprite,
                scaleX: 2,
                scaleY: 2,
                duration: 200,
                ease: 'Linear'
            })
        })

        // Listen for pointerdown event on the deck
        this.deckSprite.on('pointerdown', () => {
            // Code to execute when the deckSprite is clicked
            console.log('deckSprite clicked!')
            this.drawCard()
            this.turnValid = true
            
        })

        //add sortRank to bottom left
        this.sortRank = this.add.sprite(0 + borderPadding, h - borderPadding, 'sort_rank', 0).setOrigin(0, 1).setScale(3)

         // Make the restart clickable
        this.sortRank.setInteractive()

        // Add pointerover event listener for hovering
        this.sortRank.on('pointerover', () => {
            console.log('sortRank hover')
            //change to hover frame
            this.sortRank.setFrame(2, false)
        })

        // Add pointerout event listener for when hovering ends
        this.sortRank.on('pointerout', () => {
            console.log('sortRank not hover')
             //change to none hover frame
             this.sortRank.setFrame(0, false)
        })

        // Listen for pointerdown event on the card
        this.sortRank.on('pointerdown', () => {
            this.sortRankHand()
            console.log('sortRank press')
            //change to push frame
            this.sortRank.setFrame(1, false)
        })

        //add deck to middle right
        this.sortSuit = this.add.sprite(0 + borderPadding, h - borderPadding - this.sortRank.width - 5, 'sort_suit', 0).setOrigin(0, 1).setScale(3)

         // Make the restart clickable
        this.sortSuit.setInteractive()

        // Add pointerover event listener for hovering
        this.sortSuit.on('pointerover', () => {
            console.log('sortSuit hover')
            //change to hover frame
            this.sortSuit.setFrame(2, false)
        })

        // Add pointerout event listener for when hovering ends
        this.sortSuit.on('pointerout', () => {
            console.log('sortSuit not hover')
             //change to none hover frame
             this.sortSuit.setFrame(0, false)
        })

        // Listen for pointerdown event on the card
        this.sortSuit.on('pointerdown', () => {
            this.sortSuitHand()
            console.log('sortSuit press')
            //change to push frame
            this.sortSuit.setFrame(1, false)
        })
        
    }

    update() {
        //display Player turn
        this.displayTurn()

        //display cards in hand
        this.displayHand()
       

    }

    // Function to create a deck with two copies of each card
    createDeck() {
        let deck = []
        for (let suit of suits) {
            for (let rank of ranks) {
                // Create two copies of each card
                deck.push({ suit, rank })
                deck.push({ suit, rank })
            }
        }
        return deck
    }

    // Shuffle function (Fisher-Yates shuffle)
    shuffle(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const temp = deck[i]
            deck[i] = deck[j]
            deck[j] = temp
        }
        return deck
    }

    dealCards() {
        this.p1Hand = []
        this.p2Hand = []
        for (let i = 0; i < 5; i++) {
            // Deal cards alternately between players
            this.p1Hand.push(this.deck.pop()) // Take a card from the top of the deck and add it to player 1's hand
            this.p2Hand.push(this.deck.pop()) // Take a card from the top of the deck and add it to player 2's hand
        }
        console.log("Player 1's Hand:", this.p1Hand)
        console.log("Player 2's Hand:", this.p2Hand)
    }

    drawCard() {
        // Menu config
        let menuConfig = {
            fontFamily: 'PressStart2P',
            fontSize: '20px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            },
            fixedWidth: 0,
        }

        // Only can draw if not drawn
        if (this.p1Turn && !this.drawn) {
            if (this.deck.length > 0) { // Check if the deck is not empty
                this.p1Hand.push(this.deck.pop()) // Remove the top card from the deck and add it to player 1's hand
                console.log("Player 1's Hand:", this.p1Hand)
                this.drawn = true
                this.turnValid = true
            } else {
                console.log("The deck is empty. Cannot draw more cards.")
            }
        } else if (this.p2Turn && !this.drawn) {
            if (this.deck.length > 0) { // Check if the deck is not empty
                this.p2Hand.push(this.deck.pop()) // Remove the top card from the deck and add it to player 2's hand
                console.log("Player 2's Hand:", this.p2Hand)
                this.drawn = true
                this.turnValid = true
            } else {
                console.log("The deck is empty. Cannot draw more cards.")
            }
        } else if (this.drawn) {
            this.endText = this.add.text(centerX, centerY, 'YOU HAVE ALREADY DRAWN\nYOU MUST END TURN', menuConfig).setOrigin(0.5, 0.5)
            this.time.delayedCall(2000, () => {
                this.tweens.add({
                    targets: this.endText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.endText.destroy() // Destroy the text object after fading out
                    }
                })
            })
        }
    }

    sortRankHand() {
        let hand = this.p1Turn ? this.p1Hand : this.p2Hand // Select the current player's hand based on the turn
        hand.sort((a, b) => {
            if (a.rank !== b.rank) {
                // If ranks are different, sort by rank
                return this.getRankValue(a.rank) - this.getRankValue(b.rank)
            } else {
                // If ranks are the same, sort by suit in the order: diamond, spade, heart, club
                const suitOrder = { 'diamond': 0, 'spade': 1, 'heart': 2, 'club': 3 }
                return suitOrder[a.suit] - suitOrder[b.suit]
            }
        })
        console.log("Sorted Hand by Rank:", hand)
    }
    
    sortSuitHand() {
        let hand = this.p1Turn ? this.p1Hand : this.p2Hand // Select the current player's hand based on the turn
        hand.sort((a, b) => {
            if (a.suit !== b.suit) {
                // If suits are different, sort by suit in the order: diamond, spade, heart, club
                const suitOrder = { 'diamond': 0, 'spade': 1, 'heart': 2, 'club': 3 }
                return suitOrder[a.suit] - suitOrder[b.suit]
            } else {
                // If suits are the same, sort by rank
                return this.getRankValue(a.rank) - this.getRankValue(b.rank)
            }
        })
        console.log("Sorted Hand by Suit:", hand)
    }
    
    getRankValue(rank) {
        // Return numerical value for rank, starting from 2 to A
        const rankOrder = { '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6, '9': 7, '10': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12 }
        return rankOrder[rank]
    }
    
    displayTurn() {
        // Menu config
        let menuConfig = {
            fontFamily: 'PressStart2P',
            fontSize: '20px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            },
            fixedWidth: 0,
        }
        if(this.p1Turn) {
            //display text
            this.add.text(centerX, 0 + borderPadding, 'PLAYER 1 TURN', menuConfig).setOrigin(0.5, 0)
        }else if(this.p2Turn) {
            //display text
            this.add.text(centerX, 0 + borderPadding, 'PLAYER 2 TURN', menuConfig).setOrigin(0.5, 0)
        }

    }

    endTurn() {
        // Menu config
        let menuConfig = {
            fontFamily: 'PressStart2P',
            fontSize: '20px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            },
            fixedWidth: 0,
        }

        if(this.turnValid){
            //switch turn
            if(this.p1Turn){
                this.p1Turn = false
                this.p2Turn = true
                this.drawn = false
                this.turnValid = false
            } else if(this.p2Turn){
                this.p2Turn = false
                this.p1Turn = true
                this.drawn = false
                this.turnValid = false
            }
        }else {
            if(this.invalidText){
                this.invalidText.destroy() // Destroy the text object
            }
            this.invalidText =this.add.text(centerX, centerY, 'INVALID TURN', menuConfig).setOrigin(0.5, 0.5)
            this.time.delayedCall(2000, () => {
                this.tweens.add({
                    targets: this.invalidText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.invalidText.destroy() // Destroy the text object after fading out
                    }
                })
            })
        }
    }

    displayHand() {
        let hand = this.p1Turn ? this.p1Hand : this.p2Hand // Select the current player's hand based on the turn
        const startX = this.sortRank.x + this.sortRank.width * 3 // Starting X position for the first card
        const cardWidth = this.add.sprite(-50, -50, 'card_deck', 0).width * 2 // Width of each card sprite
        const minVisibleWidth = 10 // Minimum width visible for each card
    
        // Remove any existing card sprites
        this.handSprites?.forEach(sprite => sprite.destroy())
    
        this.handSprites = [] // Array to store references to the card sprites
    
        // Calculate the total width taken by the cards
        const totalCardWidth = hand.length * minVisibleWidth
    
        // Calculate the available space between startX and endX
        const availableSpace = this.endTurnButton.x - 250 - startX
    
        // Calculate the number of spaces between the cards
        const numSpaces = hand.length - 1
    
        // Calculate the card spacing
        let cardSpacing = 0
        if (numSpaces > 0) {
            cardSpacing = (availableSpace - totalCardWidth) / numSpaces
        }
    
        // Ensure that card spacing is not less than minVisibleWidth
        cardSpacing = Math.max(cardSpacing, minVisibleWidth)
    
        let x = startX
    
        // Loop through each card in the hand and create a sprite for it
        hand.forEach((card, index) => {
            const cardIndex = this.getCardFrameIndex(card)
            this.cardSprite = this.add.sprite(x, this.scale.height - borderPadding, 'card_deck', cardIndex).setOrigin(0, 0.5).setScale(2)
    
            // Make the card sprite interactive
            this.cardSprite.setInteractive()
    
            // Add pointerover event listener for hovering
            this.cardSprite.on('pointerover', () => {
                console.log('Card hovered:', card)
                // Add hover effects here
            })
    
            // Add pointerout event listener for when hovering ends
            this.cardSprite.on('pointerout', () => {
                console.log('Card not hovered:', card)
                // Remove hover effects here
            })
    
            // Listen for pointerdown event on the card
            this.cardSprite.on('pointerdown', () => {
                console.log('Card clicked:', card)
                // Add click functionality here
            })
    
            this.handSprites.push(this.cardSprite)
    
            // Update the position of the next card
            x += minVisibleWidth + cardSpacing
        })
    }
    
    

    getCardFrameIndex(card) {
        const suitOrder = ['diamond', 'spade', 'heart', 'club']
        const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
        const suitIndex = suitOrder.indexOf(card.suit)
        const rankIndex = rankOrder.indexOf(card.rank)
        return suitIndex * 13 + rankIndex // Each suit has 13 cards in the sprite sheet
    }
    
}