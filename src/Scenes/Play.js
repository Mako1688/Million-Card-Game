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

        //create all sprites here
        //place end turn button
        this.endTurnButton = this.add.sprite(w - borderPadding, h - borderPadding, 'end_turn', 0).setOrigin(1, 1).setScale(3)
        //place restart button
        this.restart = this.add.sprite(w - borderPadding, 0 + borderPadding, 'restart', 0).setOrigin(1, 0).setScale(3)
        //add deck to middle right
        this.deckSprite = this.add.sprite(w - borderPadding, centerY, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(5)
        this.add.sprite(this.deckSprite.x - 4, this.deckSprite.y + 4, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(4)
        this.add.sprite(this.deckSprite.x - 8, this.deckSprite.y + 8, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(3)
        this.add.sprite(this.deckSprite.x - 12, this.deckSprite.y + 12, 'card_deck', 53).setOrigin(1, 0.5).setScale(2).setDepth(2)
        //add sortRank to bottom left
        this.sortRank = this.add.sprite(0 + borderPadding, h - borderPadding, 'sort_rank', 0).setOrigin(0, 1).setScale(3)
        //add deck to middle right
        this.sortSuit = this.add.sprite(0 + borderPadding, h - borderPadding - this.sortRank.width - 5, 'sort_suit', 0).setOrigin(0, 1).setScale(3)


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

        //create hands
        this.p1Hand
        this.p2Hand
        this.cardsSelected = []
        this.tableCards = []

        //create deck
        this.deck = this.createDeck()
        this.deck = this.shuffle(this.deck)
        console.log(this.deck)

        

        //deal cards
        this.dealCards()

        //display cards in hand
        this.displayHand()

        //print deck
        console.log(this.deck)

        

        

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
            //display cards in hand
            this.displayHand()
            //display table
            this.displayTable()
        })

        

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
            this.cardsSelected = []
            //change to push frame
            this.restart.setFrame(1, false)
            //display cards in hand
            this.displayHand()
            //display table
            this.displayTable()
        })

        

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
            //display cards in hand
            this.displayHand()
            //display table
            this.displayTable()
            
        })

        

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
            //display cards in hand
            this.displayHand()
            //display table
            this.displayTable()
        })

        

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
            //display cards in hand
            this.displayHand()
            //display table
            this.displayTable()
        })
        
    }

    update() {
        //display Player turn
        this.displayTurn()

        //if either hand is 0 transition to win scene
        if(this.p1Hand.length === 0){
            this.scene.start('winScene', {
                p1Win: true
            })
        }else if (this.p2Hand.length === 0){
            this.scene.start('winScene', {
                p1Win: false
            })
        }

       

    }

    // Function to create a deck with two copies of each card
    createDeck() {
        let deck = []
        for (let suit of suits) {
            for (let rank of ranks) {
                // Create two copies of each card
                deck.push({ card: {suit, rank}, sprite: null, table: false })
                deck.push({ card: {suit, rank}, sprite: null, table: false })
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
        // //add event listener
        // this.addListener()
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
        if (this.p1Turn && !this.drawn && !this.turnValid) {
            if (this.deck.length > 0) { // Check if the deck is not empty
                this.p1Hand.push(this.deck.pop()) // Remove the top card from the deck and add it to player 1's hand
                console.log("Player 1's Hand:", this.p1Hand)
                this.drawn = true
                this.turnValid = true
            } else {
                console.log("The deck is empty. Cannot draw more cards.")
            }
        } else if (this.p2Turn && !this.drawn && !this.turnValid) {
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

        // //add event listener
        // this.addListener()
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
        var hand = this.p1Turn ? this.p1Hand : this.p2Hand // Select the current player's hand based on the turn
        const startX = this.sortRank.x + this.sortRank.width * 3 // Starting X position for the first card
        const minVisibleWidth = 10 // Minimum width visible for each card
    
        // Remove any existing card sprites
        hand.forEach(cardObject => cardObject.sprite = null)
    
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
        hand.forEach((cardObject) => {
            const cardIndex = this.getCardFrameIndex(cardObject)
            cardObject.sprite = this.add.sprite(x, this.scale.height - borderPadding, 'card_deck', cardIndex).setOrigin(0, 0.5).setScale(2)
            this.handHeight = this.scale.height - borderPadding
            this.selectHeight = this.handHeight - 92

            // Update the position of the next card
            x += minVisibleWidth + cardSpacing
        })

        this.addListener(hand)

        console.log(hand)
    }

    displayTable() {
        const startX = 80
        const startY = 40
        const verticalSpacing = 50
        const horizontalSpacing = 150
        const maxRowWidth = 10 // Maximum number of arrays in a row
    
        let currentX = startX
        let currentY = startY
        let rowWidth = 0
        let rowMult = 1
    
        this.tableCards.forEach(array => {
            array.forEach(object => {
                const cardIndex = this.getCardFrameIndex(object)
                object.sprite = this.add.sprite(currentX, currentY, 'card_deck', cardIndex).setOrigin(0.5, 0).setScale(2);
                currentY += verticalSpacing
            })

            currentY = startY * rowMult  // reset y position
            currentX += horizontalSpacing // Move to the next column
            rowWidth++
            if (rowWidth === maxRowWidth) {
                rowMult += 7
                currentX = startX // Reset y position
                currentY = startY * rowMult  // reset y position
                rowWidth = 0 // Reset row width counter
            }
            
        })
        this.addListener(this.tableCards)
        console.log(this.tableCards)
        
    }
    
    
    
    

    getCardFrameIndex(cardObject) {
        console.log(cardObject)
        const suitOrder = ['diamond', 'spade', 'heart', 'club']
        const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
        const suitIndex = suitOrder.indexOf(cardObject.card.suit)
        const rankIndex = rankOrder.indexOf(cardObject.card.rank)
        return suitIndex * 13 + rankIndex // Each suit has 13 cards in the sprite sheet
    }

    addListener(cardArray) {
        
        console.log('add listeners')
        if (cardArray) {
            console.log(cardArray)
            // Remove any existing event listeners
            this.removeListeners(cardArray)

            cardArray.forEach(cardObject => {
                const cardSprite = cardObject.sprite
                if(cardSprite != null) {
                    // Make the card sprite interactive
                    cardSprite.setInteractive({ draggable: true})

                    // // Listen for drag events on the card
                    // cardSprite.on('drag', (pointer, dragX, dragY) => {
                    //     cardSprite.x = dragX
                    //     cardSprite.y = dragY

                    //     // Check if the dragged card is within 1 pixel of another card sprite
                    //     hand.forEach(otherCardObject => {
                    //         const otherCardSprite = otherCardObject.sprite
                    //         if (otherCardSprite !== cardSprite) {
                    //             const distance = Phaser.Math.Distance.Between(cardSprite.x, cardSprite.y, otherCardSprite.x, otherCardSprite.y)
                    //             //console.log('Distance:', distance)
                    //             if (distance <= 50) {
                    //                 // Snap the dragged card to the position of the other card
                    //                 console.log("card snapped")
                    //                 cardSprite.x = otherCardSprite.x 
                    //                 cardSprite.y = otherCardSprite.y + 50
                    //                 cardObject.snapped = true
                    //                 otherCardObject.snapped = true

                    //                 // Check if the combination is valid
                    //                 const combinationValid = this.checkCombinationValidity()
                    //                 if (combinationValid) {
                    //                     // Flash the cards green if the combination is valid
                    //                     this.flashCard(cardSprite, 0x00FF00)
                    //                     this.flashCard(otherCardSprite, 0x00FF00)
                                        
                    //                 } else {
                    //                     // Flash the cards red if the combination is not valid
                    //                     this.flashCard(cardSprite, 0xFF0000)
                    //                     this.flashCard(otherCardSprite, 0xFF0000)
                    //                 }
                    //             }
                    //         }
                    //     })
                    // })

                    // // Listen for dragend event on the card
                    // cardSprite.on('dragend', () => {
                    //     // Perform any necessary actions when the drag ends
                    //     // For example, check if the dropped card forms a valid combination on the table
                    //     // and handle placing it accordingly
                    // })

                    // Add pointerover event listener for hovering
                    cardSprite.on('pointerover', () => {
                        console.log('Card hovered:', cardObject.card)
                        // Add hover effects here
                        // Scale the card slightly larger
                        // this.tweens.add({
                        //     targets: cardObject.sprite,
                        //     y: cardObject.sprite.y - 92,
                        //     duration: 200,
                        //     ease: 'Linear'
                        // })

                    })

                    // Add pointerout event listener for when hovering ends
                    cardSprite.on('pointerout', () => {
                        console.log('Card not hovered:', cardObject.card)
                        // Remove hover effects here
                        // this.tweens.add({
                        //     targets: cardObject.sprite,
                        //     y: cardObject.sprite.y + 92,
                        //     duration: 200,
                        //     ease: 'Linear'
                        // })

                    })

                    // Listen for pointerdown event on the card
                    cardSprite.on('pointerdown', () => {
                        
                        console.log('Card clicked:', cardObject.card)
                        if(cardObject.table === false){
                            // Add click functionality here
                            if(!this.cardsSelected.includes(cardObject)){
                                // Scale the card slightly larger
                                this.tweens.add({
                                    targets: cardObject.sprite,
                                    y: this.selectHeight,
                                    duration: 200,
                                    ease: 'Linear'
                                })
                                this.cardsSelected.push(cardObject)
                                this.checkCardsSelected()
                            }
                        } else if(cardObject.table === true){
                            // Add click functionality here
                            this.tweens.add({
                                targets: cardObject.sprite,
                                y: cardObject.sprite.x + 50,
                                duration: 200,
                                ease: 'Linear'
                            })
                            cardObject.table = false
                            if(this.p1Turn){
                                this.p1Hand.push(cardObject)
                            }else if(this.p2Turn){
                                this.p2Hand.push(cardObject)
                            }
                            cardObject.sprite.destroy()
                            this.turnValid = false
                            this.displayHand()
                            this.displayTable()
                        }
                    })

                console.log(cardArray)
        
                }
            })
        }
    }

    checkCardsSelected() {
        var hand = this.p1Turn ? this.p1Hand : this.p2Hand // Select the current player's hand based on the turn
        console.log(this.cardsSelected)
        if(this.cardsSelected.length > 2){
            // Check if the combination is valid
            const rankValidity = this.checkSameRankAlternatingSuits(this.cardsSelected)
            const suitValidity = this.checkAscendingDescendingSameSuit(this.cardsSelected)
            this.cardsSelected.forEach(cardObject => {
                if (rankValidity || suitValidity) {
                    //add bool for table cards
                    cardObject.table = true
                    // Flash the cards green if the combination is valid
                    this.flashCard(cardObject.sprite, 0x00FF00)
                } else {
                    this.tweens.add({
                        targets: cardObject.sprite,
                        y: this.handHeight,
                        duration: 200,
                        ease: 'Linear'
                    })
                    // Flash the cards red if the combination is not valid
                    this.flashCard(cardObject.sprite, 0xFF0000)
                }
            })
            console.log(this.tableCards)
            if(rankValidity || suitValidity){

                //remove the cards from player hand as well as hand
                this.tableCards.push(this.cardsSelected)
                
                // Remove sprites from the screen for the cards in this.cardsSelected
                this.cardsSelected.forEach(selectedCardObject => {
                    const selectedSprite = selectedCardObject.sprite
                    // Find the corresponding card in hand and remove its sprite
                    const matchingCardObject = hand.find(cardObject => cardObject.card === selectedCardObject.card)
                    if (matchingCardObject) {
                        matchingCardObject.sprite.destroy() // Remove sprite from the screen
                    }
                })
                // Remove selected cards from hand based on reference comparison
                hand = hand.filter(cardObject => !this.cardsSelected.includes(cardObject))

                if(this.p1Turn){
                    // Remove selected cards from hand based on reference comparison
                    this.p1Hand = this.p1Hand.filter(card => !this.cardsSelected.some(selectedCardObject => selectedCardObject.card === card))
                } else if (this.p2Turn){
                    // Remove selected cards from hand based on reference comparison
                    this.p2Hand = this.p2Hand.filter(card => !this.cardsSelected.some(selectedCardObject => selectedCardObject.card === card))
                }
                
                this.turnValid = true
                console.log(this.cardsSelected, hand)
            }
            this.cardsSelected = []
            //display table
            this.displayTable()
        }
    }

    
    
        

    removeListeners(cardArray) {
        
        console.log('remove listeners')
        // Remove event listeners for each card in hand
        
        cardArray.forEach(cardObject => {
            if(cardObject.sprite != null){
                const cardSprite = cardObject.sprite
                cardSprite.removeAllListeners('pointerover')
                cardSprite.removeAllListeners('pointerout')
                cardSprite.removeAllListeners('pointerdown')
            }
            
        })
    }

    checkCombinationValidity(cardArray) {
        const snappedCards = []
        // Collect all snapped cards
        // Collect all snapped cards
        cardArray.forEach(cardObject => {
            if (cardObject.snapped) {
                snappedCards.push(cardObject)
            }
        })

        console.log(snappedCards)
    
        // Check if at least three cards are snapped together
        if (snappedCards.length < 3) {
            // Combination not valid if less than 3 cards are snapped together
            return false
        }
    
        // Check for same rank and alternating suits
        if (this.checkSameRankAlternatingSuits(snappedCards)) {
            return true
        }
    
        // Check for ascending or descending numbers with the same suit
        if (this.checkAscendingDescendingSameSuit(snappedCards)) {
            return true
        }
    
        return false
    }
    
    checkSameRankAlternatingSuits(cards) {
        // Check for same rank and alternating suits
        const ranks = new Set(cards.map(cardObject => cardObject.card.rank))
        if (ranks.size === 1) { // Same rank
            const suits = new Set(cards.map(cardObject => cardObject.card.suit))
            if (suits.size === cards.length) { // Alternating suits
                return true
            }
        }
        return false
    }
    
    checkAscendingDescendingSameSuit(cards) {
        const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
        const sortedCards = cards.map(cardObject => cardObject.card).sort((a, b) => {
            return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
        })
    
        const firstSuit = sortedCards[0].suit
        let isAscending = true
        let isDescending = true
    
        for (let i = 1; i < sortedCards.length; i++) {
            if (sortedCards[i].suit !== firstSuit) {
                return false // Not same suit
            }
            const currentRankIndex = rankOrder.indexOf(sortedCards[i].rank)
            const prevRankIndex = rankOrder.indexOf(sortedCards[i - 1].rank)
            if (currentRankIndex !== prevRankIndex + 1) {
                isAscending = false
            }
            if (currentRankIndex !== prevRankIndex - 1) {
                isDescending = false
            }
        }
    
        return isAscending || isDescending
    }
    
    flashCard(cardSprite, color) {
        cardSprite.setTint(color)
        this.time.delayedCall(500, () => {
            cardSprite.clearTint()
        })
    }
    
    resetCardColor(cardSprite) {
        cardSprite.clearTint()
    }

    
}