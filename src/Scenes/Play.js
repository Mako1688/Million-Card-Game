class Play extends Phaser.Scene {
  constructor() {
    super("playScene");
  }

  init() { }

  preload() { }

  create() {
    console.log("play scene started");

    // Create arrays for states cards can be in
    this.handSelected = [];

    // Create all sprites here
    // Place end turn button
    this.endTurnButton = this.add
      .sprite(w - borderPadding, h - borderPadding, "end_turn", 0)
      .setOrigin(1, 1)
      .setScale(3);
    // Place restart button
    this.restart = this.add
      .sprite(w - borderPadding, 0 + borderPadding, "restart", 0)
      .setOrigin(1, 0)
      .setScale(3);
    // Add deck to middle right
    this.deckSprite = this.add
      .sprite(w - borderPadding, centerY, "card_deck", 53)
      .setOrigin(1, 0.5)
      .setScale(2)
      .setDepth(5);
    this.add
      .sprite(this.deckSprite.x - 4, this.deckSprite.y + 4, "card_deck", 53)
      .setOrigin(1, 0.5)
      .setScale(2)
      .setDepth(4);
    this.add
      .sprite(this.deckSprite.x - 8, this.deckSprite.y + 8, "card_deck", 53)
      .setOrigin(1, 0.5)
      .setScale(2)
      .setDepth(3);
    this.add
      .sprite(this.deckSprite.x - 12, this.deckSprite.y + 12, "card_deck", 53)
      .setOrigin(1, 0.5)
      .setScale(2)
      .setDepth(2);
    // Add sortRank to bottom left
    this.sortRank = this.add
      .sprite(0 + borderPadding, h - borderPadding, "sort_rank", 0)
      .setOrigin(0, 1)
      .setScale(3);
    // Add sortSuit to bottom left
    this.sortSuit = this.add
      .sprite(
        0 + borderPadding,
        h - borderPadding - this.sortRank.height * 3 - 5,
        "sort_suit",
        0
      )
      .setOrigin(0, 1)
      .setScale(3);

    // Menu config
    let menuConfig = {
      fontFamily: "PressStart2P",
      fontSize: "20px",
      backgroundColor: "#000000",
      color: "#FFFFFF",
      align: "center",
      padding: {
        top: 5,
        bottom: 5,
      },
      fixedWidth: 0,
    };

    // Create bools
    this.turnValid = false;
    this.p1Turn = true;
    this.p2Turn = false;
    this.drawn = false;
    this.drawnCard = false;
    this.placedCards = false;
    this.resetPressed = false;

    // Create hands
    this.p1Hand = [];
    this.p2Hand = [];
    this.cardsSelected = [];
    this.tableCards = [];

    // Create deck
    this.deck = this.createDeck();
    this.deck = this.shuffle(this.deck);
    console.log(this.deck);

    // Deal cards
    this.dealCards();

    // Display cards in hand
    this.displayHand();

    // Call startNewTurn to set initial positions for cards at the start of the game
    this.startNewTurn();

    // Print deck
    console.log(this.deck);

    // Create validation box (hidden initially)
    this.validationBox = this.add
      .rectangle(centerX, centerY - 200, 200, 100, 0x00ff00)
      .setOrigin(0.5)
      .setInteractive()
      .setVisible(false);

    // Handle validation box click
    this.validationBox.on("pointerdown", () => {
      this.handleValidPlay();
      this.turnValid = true;
    });

    // Make the end turn button clickable
    this.endTurnButton.setInteractive();

    // Add pointerover event listener for hovering
    this.endTurnButton.on("pointerover", () => {
      console.log("Turn Valid: " + this.turnValid);
      console.log("end turn hover");
      // Change to hover frame
      this.endTurnButton.setFrame(2);
    });

    // Add pointerout event listener for when hovering ends
    this.endTurnButton.on("pointerout", () => {
      console.log("end turn not hover");
      // Change to none hover frame
      this.endTurnButton.setFrame(0);
    });

    // Listen for pointerdown event on the card
    this.endTurnButton.on("pointerdown", () => {
      console.log("End turn button pressed");
      this.endTurn();
      console.log("End turn completed");
      // Change to push frame
      this.endTurnButton.setFrame(1);
      // Display cards in hand
      this.displayHand();
      // Display table
      this.displayTable();
    });

    // Make the restart button clickable
    this.restart.setInteractive();

    // Add pointerover event listener for hovering
    this.restart.on("pointerover", () => {
      console.log("restart hover");
      // Change to hover frame
      this.restart.setFrame(2);
    });

    // Add pointerout event listener for when hovering ends
    this.restart.on("pointerout", () => {
      console.log("restart not hover");
      // Change to none hover frame
      this.restart.setFrame(0);
    });

    // Function to handle restart button click
    this.restart.on("pointerdown", () => {
      console.log("restart press");
      console.log("Player 1 hand before reset:", this.p1Hand.length);
      console.log("Player 2 hand before reset:", this.p2Hand.length);
      console.log("Table groups before reset:", this.tableCards);
      this.resetPressed = true; // Set the flag to prevent win scene transition
      this.resetHandToTable();
      console.log("resetHandToTable called");
      console.log("Player 1 hand after reset:", this.p1Hand.length);
      console.log("Player 2 hand after reset:", this.p2Hand.length);
      console.log("Table groups after reset:", this.tableCards);
      // Change to push frame
      this.restart.setFrame(1);
    });

    // Make the deck clickable
    this.deckSprite.setInteractive();

    // Add pointerover event listener for hovering
    this.deckSprite.on("pointerover", () => {
      console.log(this.deck);
      console.log("deckSprite hovered");
      // Scale the card slightly larger
      this.tweens.add({
        targets: this.deckSprite,
        scaleX: 2.1,
        scaleY: 2.1,
        duration: 200,
        ease: "Linear",
      });
    });

    // Add pointerout event listener for when hovering ends
    this.deckSprite.on("pointerout", () => {
      console.log("deckSprite not hovered");
      // Restore the deckSprite to its original scale
      this.tweens.add({
        targets: this.deckSprite,
        scaleX: 2,
        scaleY: 2,
        duration: 200,
        ease: "Linear",
      });
    });

    // Listen for pointerdown event on the deck
    this.deckSprite.on("pointerdown", () => {
      // Code to execute when the deckSprite is clicked
      console.log("deckSprite clicked!");
      this.drawCard();
      this.turnValid = true;
      // Display cards in hand
      this.displayHand();
      // Display table
      this.displayTable();
    });

    // Make the sortRank button clickable
    this.sortRank.setInteractive();

    // Add pointerover event listener for hovering
    this.sortRank.on("pointerover", () => {
      console.log("sortRank hover");
      // Change to hover frame
      this.sortRank.setFrame(2);
    });

    // Add pointerout event listener for when hovering ends
    this.sortRank.on("pointerout", () => {
      console.log("sortRank not hover");
      // Change to none hover frame
      this.sortRank.setFrame(0);
    });

    // Listen for pointerdown event on the card
    this.sortRank.on("pointerdown", () => {
      this.sortRankHand();
      console.log("sortRank press");
      // Change to push frame
      this.sortRank.setFrame(1);
      // Display cards in hand
      this.displayHand();
      // Display table
      this.displayTable();
    });

    // Make the sortSuit button clickable
    this.sortSuit.setInteractive();

    // Add pointerover event listener for hovering
    this.sortSuit.on("pointerover", () => {
      console.log("sortSuit hover");
      // Change to hover frame
      this.sortSuit.setFrame(2);
    });

    // Add pointerout event listener for when hovering ends
    this.sortSuit.on("pointerout", () => {
      console.log("sortSuit not hover");
      // Change to none hover frame
      this.sortSuit.setFrame(0);
    });

    // Listen for pointerdown event on the card
    this.sortSuit.on("pointerdown", () => {
      this.sortSuitHand();
      console.log("sortSuit press");
      // Change to push frame
      this.sortSuit.setFrame(1);
      // Display cards in hand
      this.displayHand();
      // Display table
      this.displayTable();
    });

    // Display initial hand
    this.displayHand();
  }

  // Updated update function to prevent win scene transition
  update() {
    // Display Player turn
    this.displayTurn();

    // Only transition to win scene if the hand is empty and reset button was not just pressed
    if (!this.resetPressed) {
      if (this.p1Hand.length === 0) {
        console.log("Player 1 wins");
        this.scene.start("winScene", {
          p1Win: true,
        });
      } else if (this.p2Hand.length === 0) {
        console.log("Player 2 wins");
        this.scene.start("winScene", {
          p1Win: false,
        });
      }
    }
  }

  // Function to create a deck with two copies of each card
  createDeck() {
    let deck = [];
    for (let suit of suits) {
      for (let rank of ranks) {
        // Create two copies of each card
        deck.push({ card: { suit, rank }, table: false });
        deck.push({ card: { suit, rank }, table: false });
      }
    }
    return deck;
  }

  // Shuffle function (Fisher-Yates shuffle)
  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // Function to deal 7 cards to each player
  dealCards() {
    for (let i = 0; i < 7; i++) {
      this.p1Hand.push(this.deck.pop());
      this.p2Hand.push(this.deck.pop());
    }
    // Ensure all dealt cards have their original position set to 'hand'
    this.p1Hand.forEach(card => {
      card.originalPosition = { type: 'hand' };
    });
    this.p2Hand.forEach(card => {
      card.originalPosition = { type: 'hand' };
    });
  }

  // Function to display the current player's hand
  displayHand() {
    const minX = 200;
    const maxX = 1450;
    const cardWidth = 75; // Width of each card sprite
    const borderUISize = -25;

    // Determine the current hand
    const currentHand = this.p1Turn ? this.p1Hand : this.p2Hand;

    // Clear existing cards in handSelected
    this.handSelected.forEach((card) => {
      card.destroy();
    });

    // Calculate total width of the hand
    const totalHandWidth = currentHand.length * cardWidth;

    // Adjust spacing if cards would exceed the bounds
    let spacing = cardWidth;
    if (totalHandWidth > maxX - minX) {
      spacing = (maxX - minX) / currentHand.length;
    }

    // Calculate starting x position to center the hand
    let startX = (this.scale.width - (currentHand.length - 1) * spacing) / 2;

    // Display current player's hand
    this.handSelected = [];
    for (let i = 0; i < currentHand.length; i++) {
      // Calculate position based on adjusted spacing
      let xPosition = startX + i * spacing;
      let frameIndex =
        suits.indexOf(currentHand[i].card.suit) * 13 +
        ranks.indexOf(currentHand[i].card.rank);
      let cardSprite = this.add
        .sprite(xPosition, h - borderUISize * 2, "card_deck", frameIndex)
        .setOrigin(0.5, 1)
        .setScale(2)
        .setInteractive();

      // Add click event listener to the card
      cardSprite.on("pointerdown", () => {
        console.log("Card selected: ", currentHand[i].card);
        this.selectCard(i, this.p1Turn ? "p1Hand" : "p2Hand", cardSprite);
      });

      this.handSelected.push(cardSprite);
    }
  }

  drawCard() {
    if (this.deck.length > 0 && !this.drawnCard && !this.placedCards) {
      if (this.p1Turn) {
        const newCard = this.deck.pop();
        newCard.originalPosition = { type: 'hand' }; // Set original position to 'hand'
        this.p1Hand.push(newCard);
      } else {
        const newCard = this.deck.pop();
        newCard.originalPosition = { type: 'hand' }; // Set original position to 'hand'
        this.p2Hand.push(newCard);
      }
      this.drawnCard = true;
      this.turnValid = true;

      // Disable card selection after drawing a card
      this.disableCardInteractivity();
    } else if (this.drawnCard) {
      console.log("You can only draw once per turn.");
    } else if (this.placedCards) {
      console.log("You cannot draw cards after placing cards.");
    }
  }

  // Function to disable card interactivity
  disableCardInteractivity() {
    this.handSelected.forEach((cardSprite) => {
      cardSprite.disableInteractive();
    });
    if (this.tableSprites) {
      this.tableSprites.forEach((groupContainer) => {
        groupContainer.list.forEach((cardSprite) => {
          cardSprite.disableInteractive();
        });
      });
    }
  }

  // Function to enable card interactivity
  enableCardInteractivity() {
    this.handSelected.forEach((cardSprite) => {
      cardSprite.setInteractive();
    });
    if (this.tableSprites) {
      this.tableSprites.forEach((groupContainer) => {
        groupContainer.list.forEach((cardSprite) => {
          cardSprite.setInteractive();
        });
      });
    }
  }

  // Function to check if a group of cards is valid
  checkValidGroup(cards = []) {
    if (cards.length < 3) {
      return false;
    }

    // Check for sandwiching suits of the same rank
    const ranks = cards.map((card) => card.card.rank);
    const suits = cards.map((card) => card.card.suit);
    const uniqueRanks = new Set(ranks);
    const uniqueSuits = new Set(suits);

    if (uniqueRanks.size === 1 && uniqueSuits.size === cards.length) {
      return true;
    }

    // Check for ascending rank same suit
    if (uniqueSuits.size === 1) {
      const sortedRanks = cards
        .map((card) => ranks.indexOf(card.card.rank))
        .sort((a, b) => a - b);

      for (let i = 1; i < sortedRanks.length; i++) {
        if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  // Function to display table cards
  displayTable() {
    console.log(this.tableCards);
    // Clear previous table card containers
    if (this.tableSprites) {
      this.tableSprites.forEach((group) => {
        group.destroy();
      });
    }
    this.tableSprites = [];

    this.tableCards.forEach((group, groupIndex) => {
      this.displayTableGroup(group, groupIndex);
    });
  }

  // Function to display a group of cards on the table
  displayTableGroup(group, groupIndex) {
    let rowHeight = 150; // height of each row
    let colWidth = 200; // width of each column
    let maxColumns = Math.floor(this.scale.width / colWidth); // max columns per row

    let rowIndex = Math.floor(groupIndex / maxColumns); // current row index
    let colIndex = groupIndex % maxColumns; // current column index

    let groupContainer = this.add.container(colIndex * colWidth, rowIndex * rowHeight + 150);

    group.forEach((card, cardIndex) => {
      let frameIndex =
        suits.indexOf(card.card.suit) * 13 + ranks.indexOf(card.card.rank);
      let cardSprite = this.add
        .sprite(cardIndex * 50, 0, "card_deck", frameIndex)
        .setOrigin(0.5)
        .setScale(2)
        .setInteractive();

      // Add click event listener to the card in the table group
      cardSprite.on("pointerdown", () => {
        console.log("Card clicked on table: ", card.card);
        if (this.drawnCard) {
          console.log("You cannot select cards after drawing. End your turn.");
          return;
        }
        if (this.cardsSelected.length > 0) {
          // Attempt to place selected card in the group
          const selectedCard = this.cardsSelected.pop();
          const result = this.addToGroup(selectedCard, groupIndex);
          if (!result) {
            // If placement fails, re-add the card to the selected array
            this.cardsSelected.push(selectedCard);
          } else {
            // If placement succeeds, remove the card from hand and clear selection
            const currentHand = this.p1Turn ? this.p1Hand : this.p2Hand;
            currentHand.splice(currentHand.indexOf(selectedCard), 1);
            this.displayHand();
          }
        } else {
          // Add clicked card to hand
          this.addToHand(card, groupIndex);
        }
      });

      groupContainer.add(cardSprite);
    });

    // Add the container to the display list and make it draggable
    this.add.existing(groupContainer);
    groupContainer.setSize(groupContainer.width, groupContainer.height); // Set the size for dragging
    groupContainer.setInteractive(
      new Phaser.Geom.Rectangle(
        0,
        0,
        groupContainer.width,
        groupContainer.height
      ),
      Phaser.Geom.Rectangle.Contains
    );
    this.input.setDraggable(groupContainer);

    // Handle drag event
    groupContainer.on("drag", (pointer, dragX, dragY) => {
      groupContainer.x = dragX;
      groupContainer.y = dragY;
    });

    this.tableSprites.push(groupContainer);
  }

  // Function to handle valid play
  handleValidPlay() {
    const currentHand = this.p1Turn ? this.p1Hand : this.p2Hand;

    // Remove selected cards from player's hand and push to table array
    this.tableCards.push([...this.cardsSelected]);

    // Ensure original positions are not changed until turn is ended
    this.cardsSelected.forEach(card => {
      card.table = true;
      // Remove card from hand
      const indexInHand = currentHand.indexOf(card);
      if (indexInHand !== -1) {
        currentHand.splice(indexInHand, 1);
      }
    });

    this.displayTable();

    // Reset selected cards array and hide validation box
    this.cardsSelected.forEach((card) => (card.selected = false));
    this.cardsSelected = [];
    this.validationBox.setVisible(false);

    // Update hand display
    this.displayHand();

    // Mark that the player has placed cards
    this.placedCards = true;
  }

  // Function to select a card
  selectCard(index, hand, cardSprite) {
    if (this.drawnCard) {
      console.log("You cannot select cards after drawing. End your turn.");
      return;
    }

    if (this[hand][index].selected) {
      // Deselect the card
      this[hand][index].selected = false;
      this.cardsSelected = this.cardsSelected.filter(
        (card) => card !== this[hand][index]
      );
      // Remove tint and move card back to original position
      cardSprite.clearTint();
      this.tweens.add({
        targets: cardSprite,
        y: cardSprite.y + 50,
        duration: 200,
        ease: "Linear",
      });
    } else {
      // Select the card
      this[hand][index].selected = true;
      this.cardsSelected.push(this[hand][index]);
      // Add green tint and move card up
      cardSprite.setTint(0x00ff00);
      this.tweens.add({
        targets: cardSprite,
        y: cardSprite.y - 50,
        duration: 200,
        ease: "Linear",
      });
      console.log(this.cardsSelected);
    }

    // Check if selected cards form a valid group
    if (this.cardsSelected.length >= 3) {
      const isValidGroup = this.checkValidGroup(this.cardsSelected);
      console.log(`Is valid group: ${isValidGroup}`);
      // Show or hide validation box based on validity of group
      this.validationBox.setVisible(isValidGroup);
    } else {
      this.validationBox.setVisible(false);
    }
  }

  // Function to end the turn
  endTurn() {
    if (this.turnValid && !this.cardsSelected.some((card) => !card.table) && this.checkAllGroupsValid()) {
      // Update the originalPosition for all cards on the table
      this.tableCards.forEach((group, groupIndex) => {
        group.forEach(card => {
          card.originalPosition = { type: 'table', groupIndex: groupIndex };
        });
      });

      this.p1Turn = !this.p1Turn;
      this.turnValid = false;
      this.drawnCard = false;
      this.placedCards = false;
      this.validationBox.setVisible(false);

      this.enableCardInteractivity();

      this.startNewTurn();
    } else {
      console.log("You must complete a valid action before ending your turn.");
    }
  }

  // Function to sort hand by rank
  sortRankHand() {
    if (this.p1Turn) {
      this.p1Hand.sort(
        (a, b) => ranks.indexOf(a.card.rank) - ranks.indexOf(b.card.rank)
      );
    } else {
      this.p2Hand.sort(
        (a, b) => ranks.indexOf(a.card.rank) - ranks.indexOf(b.card.rank)
      );
    }
  }

  // Function to sort hand by suit
  sortSuitHand() {
    if (this.p1Turn) {
      this.p1Hand.sort(
        (a, b) => suits.indexOf(a.card.suit) - suits.indexOf(b.card.suit)
      );
    } else {
      this.p2Hand.sort(
        (a, b) => suits.indexOf(a.card.suit) - suits.indexOf(b.card.suit)
      );
    }
  }

  // Function to display current player's turn
  displayTurn() {
    // Display current turn
    let turnText = this.p1Turn ? "Player 1's Turn" : "Player 2's Turn";
    console.log(turnText);
  }

  // Function to check the validity of all groups on the table
  checkTableValidity() {
    let allValid = true;
    this.tableSprites.forEach((groupContainer, groupIndex) => {
      const group = this.tableCards[groupIndex];
      const isValid = this.checkValidGroup(group);
      groupContainer.list.forEach((cardSprite) => {
        cardSprite.setTint(isValid ? 0xffffff : 0xff0000);
      });
      if (!isValid) allValid = false;
    });
    this.turnValid = allValid && this.checkAllGroupsValid();
  }

  addToGroup(card, groupIndex) {
    const group = this.tableCards[groupIndex];
    const isValid = this.checkValidGroup([...group, card]);
    if (isValid) {
      group.push(card);
      this.tableCards[groupIndex] = group;
      this.displayTable();
      this.checkTableValidity();
      return true;
    }
    return false;
  }

  addToHand(card, groupIndex) {
    const currentHand = this.p1Turn ? this.p1Hand : this.p2Hand;
    const group = this.tableCards[groupIndex];
    const cardIndex = group.indexOf(card);

    if (cardIndex !== -1) {
      group.splice(cardIndex, 1);
      card.originalGroupIndex = groupIndex; // Track the original group index
      card.originalPosition = { type: 'table', groupIndex: groupIndex }; // Track original position
      card.table = false; // Mark the card as not on the table
      currentHand.push(card);
      this.turnValid = false; // Prevent ending the turn

      // Remove the group if it has no cards left
      if (group.length === 0) {
        this.tableCards.splice(groupIndex, 1);
      }

      this.displayHand();
      this.displayTable();
      this.checkTableValidity();
    }
  }

  // Function to reset hand to table
  resetHandToTable() {
    const currentHand = this.p1Turn ? this.p1Hand : this.p2Hand;

    // Temporarily store cards to be reset
    const cardsToReset = [];

    // Iterate through the player's hand
    for (let i = currentHand.length - 1; i >= 0; i--) {
      const card = currentHand[i];
      if (card.originalPosition) {
        cardsToReset.push(card);
        currentHand.splice(i, 1); // Remove the card from the player's hand
      }
    }

    // Add cards from the table to the reset list
    this.tableCards.forEach((group) => {
      group.forEach((card) => {
        if (card.originalPosition) {
          cardsToReset.push(card);
        }
      });
    });

    // Remove the reset cards from their current groups
    this.tableCards.forEach((group, groupIndex) => {
      for (let i = group.length - 1; i >= 0; i--) {
        if (cardsToReset.includes(group[i])) {
          group.splice(i, 1);
        }
      }
    });

    // Reset the cards to their original positions
    cardsToReset.forEach(card => {
      if (card.originalPosition.type === 'table') {
        const originalGroup = this.tableCards[card.originalPosition.groupIndex];
        if (originalGroup) {
          originalGroup.push(card);
        } else {
          this.tableCards[card.originalPosition.groupIndex] = [card];
        }
      } else if (card.originalPosition.type === 'hand') {
        currentHand.push(card);
      }
    });

    // Remove empty groups and ensure no duplicates in groups
    this.tableCards = this.tableCards.filter(group => group.length > 0);

    // Clear all selected cards
    this.cardsSelected.forEach((cardObject) => {
      if (cardObject.sprite) {
        cardObject.sprite.clearTint(); // Remove tint
      }
    });
    this.cardsSelected = [];

    // Redraw the hand and table
    this.displayHand();
    this.displayTable();

    // Reset the resetPressed flag after the reset function is done
    this.resetPressed = false;
  }


  // Function to start a new turn
  startNewTurn() {
    // Track original positions at the start of the turn
    this.p1Hand.forEach(card => card.originalPosition = { type: 'hand' });
    this.p2Hand.forEach(card => card.originalPosition = { type: 'hand' });
    this.tableCards.forEach((group, groupIndex) => {
      group.forEach(card => {
        card.originalPosition = { type: 'table', groupIndex: groupIndex };
      });
    });
  }

  // Function to check if all groups on the table are valid
  checkAllGroupsValid() {
    return this.tableCards.every(group => group.length >= 3);
  }
}
