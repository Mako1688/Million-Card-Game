// Tutorial.js - Interactive tutorial scene that teaches gameplay mechanics

class Tutorial extends Phaser.Scene {
	constructor() {
		super("tutorialScene");
	}

	init() {
		// Clean up any existing tutorial state
		this.cleanup();
		
		// Tutorial state tracking
		this.tutorialStep = 0;
		this.tutorialComplete = false;
		this.waitingForPlayerAction = false;
		this.playerActionCompleted = false;
		this.tutorialInitialized = false;
		
		this.currentPlayer = 0;
		this.turnValid = false;
		this.cardDrawnThisTurn = false;
		this.drawnCard = false;
		this.selectedCards = [];
		this.handSelected = [];
		this.cardsSelected = [];
		this.tableCards = [];
		
		this.initializeTutorialHands();
		
		this.currentPlayer = 0;
		this.p1Hand = this.playerHands[0];
		this.p2Hand = this.playerHands[1];
		this.p1Turn = true;
		this.p2Turn = false;
		
		// Tutorial messages for each step
		this.tutorialMessages = [
			"Hello and welcome to Million Card Game! Click anywhere to continue.",
			"The goal of the game is to be the first player with no cards left in your hand.",
			"Draw cards from the deck on the right when you don't have any valid cards to play.",
			"You now have a valid color sandwich pair to play with your 5s. Select the 5s and click the play button when it appears.",
			"You placed a valid group of cards! All cards on the table need to be apart of a valid group for you to be able to end your turn.",
			"Draw again since you have no valid groups in your hand.",
			"You have a valid run of cards which is valid to play as well as sandwiches.",
			"During your turn you can take cards from existing groups on the table. Click the 9 of diamonds from the group to take it to your hand.",
			"Now play your 7-8-9 of hearts as a run. Select all three cards and click play.",
			"Finally, place your last remaining card (9 of clubs) into the existing group to make it valid again. Click on one of the remaining 9s on the table.",
			"Congratulations, you have completed the tutorial! Click anywhere to return to the main menu."
		];
		
		// Add flag to prevent multiple scene transitions
		this.sceneTransitioning = false;
	}

	initializeTutorialHands() {
		this.playerHands = [
			[
				{ card: { suit: "club", rank: "5" }, table: false },
				{ card: { suit: "heart", rank: "5" }, table: false },
				{ card: { suit: "diamond", rank: "J" }, table: false },
				{ card: { suit: "diamond", rank: "Q" }, table: false }
			],
			[]
		];
		
		this.playerHands[0].forEach(card => {
			card.sprite = null;
		});
	}

	preload() {}

	create() {
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		this.initializeSystems();
		this.createTutorialUI();
		
		this.deck = this.cardSystem.createDeck();
		this.handSelected = [];
		this.borderUISize = -25;
		
		this.refreshDisplays();
		this.tutorialInitialized = true;
		this.startTutorialStep(0);
	}

	initializeSystems() {
		this.cardSystem = new CardSystem(this);
		this.handManager = new HandManager(this);
		this.tableManager = new TableManager(this);
		this.uiSystem = new UISystem(this);
		this.animationSystem = new AnimationSystem(this);
		this.audioSystem = new AudioSystem(this);
		this.gameLogic = new GameLogic(this);
		this.controllerSystem = new ControllerSystem(this);

		this.animationSystem.initializeParticles();
	}

	createTutorialUI() {
		const w = this.scale.width;
		const h = this.scale.height;
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;
		const borderPadding = 10;

		// Create most UI elements like normal game
		this.restart = this.uiSystem.createButton(
			w - borderPadding,
			borderPadding,
			"restart",
			3,
			1,
			0
		);
		
		this.deckSprite = this.uiSystem.createDeckSprite(
			w - borderPadding,
			centerY - borderPadding * 5,
			2,
			5
		);

		this.sortRank = this.uiSystem.createButton(
			w - borderPadding,
			h - borderPadding * 12,
			"sort_rank",
			3,
			1,
			1
		);
		
		this.sortSuit = this.uiSystem.createButton(
			this.sortRank.x,
			this.sortRank.y - this.sortRank.height - 50,
			"sort_suit",
			3,
			1,
			1
		);

		// Create tutorial advance button (replaces end turn)
		this.tutorialAdvanceButton = this.uiSystem.createButton(
			w - borderPadding,
			h - borderPadding * 6,
			"end_turn", // Reuse end turn sprite
			3,
			1,
			1
		);

		// Create tutorial text display
		this.createTutorialTextBox();
		
		// Create arrow pointer for highlighting
		this.createArrowPointer();
		
		// Add interactivity
		this.addTutorialInteractivity();
	}

	createTutorialTextBox() {
		const centerX = this.scale.width / 2;
		const h = this.scale.height;
		
		// Create text box background at the top of the screen
		this.tutorialTextBg = this.add.rectangle(centerX, 80, 800, 120, 0x000000, 0.9)
			.setStrokeStyle(2, 0xffffff)
			.setDepth(100); // High depth to ensure it's above everything
		
		// Create tutorial text at the top of the screen
		this.tutorialText = this.add.text(centerX, 80, "", {
			fontFamily: 'PressStart2P',
			fontSize: '16px',
			color: '#FFFFFF',
			align: 'center',
			wordWrap: { width: 750 }
		}).setOrigin(0.5)
		  .setDepth(101); // Even higher depth to be above the background
	}

	createArrowPointer() {
		// Create arrow using graphics for pointing at elements
		this.arrow = this.add.graphics().setDepth(50); // High depth for visibility
		this.arrow.setVisible(false);
	}

	drawArrow(fromX, fromY, toX, toY, color = 0xffff00) {
		this.arrow.clear();
		this.arrow.lineStyle(4, color);
		this.arrow.beginPath();
		this.arrow.moveTo(fromX, fromY);
		this.arrow.lineTo(toX, toY);
		this.arrow.strokePath();
		
		// Add arrowhead
		const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
		const arrowLength = 20;
		const arrowAngle = 0.5;
		
		this.arrow.lineTo(
			toX - arrowLength * Math.cos(angle - arrowAngle),
			toY - arrowLength * Math.sin(angle - arrowAngle)
		);
		this.arrow.moveTo(toX, toY);
		this.arrow.lineTo(
			toX - arrowLength * Math.cos(angle + arrowAngle),
			toY - arrowLength * Math.sin(angle + arrowAngle)
		);
		this.arrow.strokePath();
		this.arrow.setVisible(true);
	}

	hideArrow() {
		this.arrow.setVisible(false);
	}

	addTutorialInteractivity() {
		// Allow clicking anywhere on the screen to advance tutorial (when not waiting for specific action)
		this.input.on('pointerdown', (pointer, currentlyOver) => {
			// Prevent multiple transitions or actions before tutorial is initialized
			if (this.sceneTransitioning || !this.tutorialInitialized) return;
			
			// If tutorial is complete, return to main menu
			if (this.tutorialComplete && currentlyOver.length === 0) {
				this.sceneTransitioning = true;
				this.scene.start("titleScene");
				return;
			}
			
			// Only advance if we're not waiting for a specific player action
			// and if the click wasn't on an interactive element (cards, buttons, deck)
			if (!this.waitingForPlayerAction && currentlyOver.length === 0) {
				this.advanceTutorial();
			}
		});

		// Tutorial advance button (keep as backup/visual indicator)
		this.tutorialAdvanceButton.setInteractive({ useHandCursor: true })
			.on('pointerdown', () => {
				// Prevent multiple transitions or actions before tutorial is initialized
				if (this.sceneTransitioning || !this.tutorialInitialized) return;
				
				// If tutorial is complete, return to main menu
				if (this.tutorialComplete) {
					this.sceneTransitioning = true;
					this.scene.start("titleScene");
					return;
				}
				
				if (!this.waitingForPlayerAction) {
					this.advanceTutorial();
				}
			});

		// Deck interaction for tutorial
		this.deckSprite.setInteractive({ useHandCursor: true })
			.on('pointerdown', () => {
				this.handleTutorialDeckClick();
			});

		// Sort buttons (disabled in tutorial)
		this.sortRank.setInteractive({ useHandCursor: true })
			.on('pointerdown', () => {
				this.audioSystem.playButtonPress();
				this.handManager.sortRankHand();
				this.refreshDisplays();
			});

		this.sortSuit.setInteractive({ useHandCursor: true })
			.on('pointerdown', () => {
				this.audioSystem.playButtonPress();
				this.handManager.sortSuitHand();
				this.refreshDisplays();
			});

		// Restart button
		this.restart.setInteractive({ useHandCursor: true })
			.on('pointerdown', () => {
				// Prevent multiple transitions or actions before tutorial is initialized
				if (this.sceneTransitioning || !this.tutorialInitialized) return;
				
				this.audioSystem.playButtonPress();
				this.sceneTransitioning = true;
				this.scene.start("titleScene");
			});
	}

	startTutorialStep(step) {
		this.tutorialStep = step;
		this.waitingForPlayerAction = false;
		this.playerActionCompleted = false;
		
		// Reset card drawn state for new turn (except when actually drawing)
		if (step !== 2 && step !== 5) {
			this.cardDrawnThisTurn = false;
			this.drawnCard = false;
		}
		
		// Display tutorial message
		this.tutorialText.setText(this.tutorialMessages[step]);
		
		// Handle step-specific setup
		switch (step) {
			case 1: // Show hand with arrow
				this.drawArrow(centerX, centerY, centerX, this.scale.height - 200);
				break;
				
			case 2: // Point to deck
				this.waitingForPlayerAction = true;
				this.drawArrow(this.deckSprite.x - 300, this.deckSprite.y, this.deckSprite.x - 100, this.deckSprite.y);
				break;
				
			case 3: // Wait for 5s selection and play
				this.waitingForPlayerAction = true;
				this.hideArrow();
				break;
				
			case 4: // 5s remain on table for next lesson
				// Don't clear table - let 5s stay for J-Q-K lesson
				break;
				
			case 5: // Wait for second deck draw
				this.waitingForPlayerAction = true;
				this.drawArrow(this.deckSprite.x - 300, this.deckSprite.y, this.deckSprite.x - 100, this.deckSprite.y);
				break;
				
			case 6: // Wait for JQK run play
				this.waitingForPlayerAction = true;
				this.hideArrow();
				break;
				
			case 7: // Clear table (remove both 5s and JQK run), then setup table with 9s and wait for click
				this.tableCards = []; // Clear the table (removes 5s from step 3 and JQK from step 6)
				this.tableManager.displayTable();
				this.setupStep7();
				break;
				
			case 8: // Wait for 7-8-9 clubs run play
				this.waitingForPlayerAction = true;
				this.hideArrow();
				break;
				
			case 9: // Wait for final card placement
				this.waitingForPlayerAction = true;
				this.hideArrow();
				setTimeout(() => {
					if (this.tableCards.length > 0 && this.tableCards[0].length > 0) {
						const firstCard = this.tableCards[0][0];
						if (firstCard && firstCard.sprite) {
							this.drawArrow(firstCard.sprite.x - 50, firstCard.sprite.y - 50, 
										 firstCard.sprite.x, firstCard.sprite.y);
						}
					}
				}, 500);
				break;
				
			case 10: // Tutorial complete
				this.tutorialComplete = true;
				this.hideArrow();
				// Tutorial is complete - wait for user click to exit (no automatic timeout)
				this.waitingForPlayerAction = false; // Allow clicking anywhere to exit
				break;
				
			default:
				this.hideArrow();
				break;
		}
	}

	setupStep7() {
		this.playerHands[0].push(
			{ card: { suit: "heart", rank: "7" }, table: false },
			{ card: { suit: "heart", rank: "8" }, table: false },
			{ card: { suit: "spade", rank: "9" }, table: false }
		);
		
		const ninesGroup = [
			{ card: { suit: "club", rank: "9" }, table: true },
			{ card: { suit: "heart", rank: "9" }, table: true },
			{ card: { suit: "diamond", rank: "9" }, table: true }
		];
		
		const tableStartX = 150;
		const tableStartY = 200;
		ninesGroup.forEach((card, index) => {
			card.customPosition = {
				x: tableStartX + (index * 65),
				y: tableStartY
			};
		});
		
		this.tableCards.push(ninesGroup);
		
		this.refreshDisplays();
		this.waitingForPlayerAction = true;
		
		// Point to 9 of hearts on table
		setTimeout(() => {
			if (this.tableCards.length > 0 && this.tableCards[0].length > 0) {
				const heartCard = this.tableCards[0].find(card => 
					(card.card ? card.card.suit : card.suit) === "heart"
				);
				if (heartCard && heartCard.sprite) {
					this.drawArrow(heartCard.sprite.x - 50, heartCard.sprite.y - 50, 
								 heartCard.sprite.x, heartCard.sprite.y);
				}
			}
		}, 500);
	}

	handleTutorialDeckClick() {
		if (!this.waitingForPlayerAction) return;
		
		if (this.tutorialStep === 2) {
			// Give 5 of spades
			this.playerHands[0].push({ card: { suit: "spade", rank: "5" }, table: false });
			this.cardDrawnThisTurn = true;
			this.drawnCard = true; // Set both for compatibility
			this.refreshDisplays();
			this.advanceTutorial();
			
		} else if (this.tutorialStep === 5) {
			// Give King of diamonds  
			this.playerHands[0].push({ card: { suit: "diamond", rank: "K" }, table: false });
			this.cardDrawnThisTurn = true;
			this.drawnCard = true; // Set both for compatibility
			this.refreshDisplays();
			this.advanceTutorial();
		}
		
		this.audioSystem.playCardSelect();
		this.animationSystem.poofEffect(this.deckSprite.x, this.deckSprite.y);
	}

	advanceTutorial() {
		if (this.sceneTransitioning) return;
		
		if (this.tutorialMessages && this.tutorialStep < this.tutorialMessages.length - 1) {
			this.startTutorialStep(this.tutorialStep + 1);
		} else {
			this.tutorialComplete = true;
			this.tutorialText.setText("Congratulations, you have completed the tutorial! Click anywhere to return to the main menu.");
			this.waitingForPlayerAction = false;
		}
		
		if (this.audioSystem) {
			this.audioSystem.playMenuButton();
		}
	}

	checkTutorialProgressionBeforePlay(cardsToPlay) {
		if (!this.waitingForPlayerAction) return;
		
		switch (this.tutorialStep) {
			case 3: // Check if 5s were played
				if (cardsToPlay.length >= 2) {
					const has5s = cardsToPlay.every(card => card.card ? card.card.rank === "5" : card.rank === "5");
					if (has5s) {
						this.playerActionCompleted = true;
						this.waitingForPlayerAction = false;
					}
				}
				break;
				
			case 6: // Check if JQK run was played
				if (cardsToPlay.length === 3) {
					const ranks = cardsToPlay.map(card => card.card ? card.card.rank : card.rank).sort();
					if (ranks.includes("J") && ranks.includes("Q") && ranks.includes("K")) {
						this.playerActionCompleted = true;
						this.waitingForPlayerAction = false;

					}
				}
				break;
				
			case 8: // Check if 7-8-9 hearts run was played
				if (cardsToPlay.length === 3) {
					const heartsRun = cardsToPlay.every(card => (card.card ? card.card.suit : card.suit) === "heart");
					const hasRun = cardsToPlay.map(card => card.card ? card.card.rank : card.rank).sort()
									.join('') === "789";
					if (heartsRun && hasRun) {
						this.playerActionCompleted = true;
						this.waitingForPlayerAction = false;
					}
				}
				break;
		}
	}

	// Override validation to allow tutorial progression
	checkTutorialProgression() {
		if (!this.waitingForPlayerAction) return;
		
		const cardsToCheck = this.selectedCards.length > 0 ? this.selectedCards : this.cardsSelected;
		
		switch (this.tutorialStep) {
			case 7: // Check if 9 of hearts was taken from table
				const hand = this.playerHands[0];
				const has9OfHearts = hand.some(card => 
					(card.card ? card.card.rank === "9" && card.card.suit === "heart" : card.rank === "9" && card.suit === "heart")
				);
				if (has9OfHearts && this.tableCards[0] && this.tableCards[0].length === 2) {
					this.playerActionCompleted = true;
					this.advanceTutorial();
				}
				break;
				
			case 9: // Check if final card was placed to complete the tutorial
				if (this.playerHands[0].length === 0 && this.tableCards.length >= 2) {
					const allGroupsValid = this.tableCards.every(group => {
						return group.length >= 3 && this.cardSystem.checkValidGroup(group);
					});
					if (allGroupsValid) {
						this.playerActionCompleted = true;
						this.advanceTutorial();
					}
				}
				break;
		}
	}

	refreshDisplays() {
		this.clearAllHandSprites();
		this.handManager.displayHand();
		this.tableManager.displayTable();
	}
	clearAllHandSprites() {
		if (this.handSelected) {
			this.handSelected.forEach((sprite) => {
				if (sprite && sprite.scene) {
					this.tweens.killTweensOf(sprite);
					if (this.animationSystem) {
						this.animationSystem.stopWaveTint(sprite);
					}
					sprite.destroy();
				}
			});
			this.handSelected = [];
		}
		
		if (this.playerHands && this.playerHands[0]) {
			this.playerHands[0].forEach(card => {
				if (card.sprite) {
					if (card.sprite.scene) {
						this.tweens.killTweensOf(card.sprite);
						if (this.animationSystem) {
							this.animationSystem.stopWaveTint(card.sprite);
						}
						card.sprite.destroy();
					}
					card.sprite = null;
				}
			});
		}
		
		[this.selectedCards, this.cardsSelected].forEach(array => {
			if (array) {
				array.forEach(card => {
					if (card && card.sprite && card.sprite.scene) {
						this.tweens.killTweensOf(card.sprite);
						if (this.animationSystem) {
							this.animationSystem.stopWaveTint(card.sprite);
						}
						card.sprite.destroy();
						card.sprite = null;
					}
				});
			}
		});
	}

	resetSelectedCards() {
		this.selectedCards = [];
		this.handSelected = [];
		this.cardsSelected = [];
	}

	markTurnAsValid() {
		this.turnValid = true;
	}

	updateValidationBoxVisibility() {
		// Custom validation for tutorial steps
		const cardsToCheck = this.selectedCards.length > 0 ? this.selectedCards : this.cardsSelected;
		if (cardsToCheck.length >= 2) {
			const isValid = this.cardSystem.checkValidGroup(cardsToCheck);
			
			if (isValid) {
				// Show play button for tutorial
				if (!this.playButton) {
					this.createPlayButton();
				}
				this.playButton.setVisible(true);
			} else {
				if (this.playButton) {
					this.playButton.setVisible(false);
				}
			}
		} else {
			if (this.playButton) {
				this.playButton.setVisible(false);
			}
		}
	}

	createPlayButton() {
		const centerX = this.scale.width / 2;
		const centerY = this.scale.height / 2;
		
		this.playButton = this.add.text(centerX, centerY - 100, "PLAY CARDS", {
			fontFamily: 'PressStart2P',
			fontSize: '24px',
			color: '#FFFFFF',
			backgroundColor: '#4CAF50',
			padding: { x: 20, y: 10 }
		}).setOrigin(0.5)
		  .setInteractive({ useHandCursor: true })
		  .on('pointerdown', () => {
			  this.handlePlayCards();
		  });
	}

	handlePlayCards() {
		const cardsToPlay = this.selectedCards.length > 0 ? this.selectedCards : this.cardsSelected;
		if (cardsToPlay.length === 0) return;
		
		this.checkTutorialProgressionBeforePlay(cardsToPlay);
		const shouldAdvanceTutorial = this.playerActionCompleted;
		
		cardsToPlay.forEach(playedCard => {
			if (playedCard.sprite) {
				this.tweens.killTweensOf(playedCard.sprite);
				playedCard.sprite.destroy();
				playedCard.sprite = null;
			}
		});
		
		const newGroup = [...cardsToPlay];
		
		if (this.tutorialStep === 4 || this.tutorialStep === 8) {
			const baseX = this.tutorialStep === 4 ? 350 : 600;
			const baseY = this.tutorialStep === 4 ? 200 : 300;
			
			newGroup.forEach((card, index) => {
				card.customPosition = {
					x: baseX + (index * 65),
					y: baseY
				};
			});
		}
		
		this.tableCards.push(newGroup);
		
		cardsToPlay.forEach(playedCard => {
			const handIndex = this.playerHands[0].findIndex(handCard => {
				const playedRank = playedCard.card ? playedCard.card.rank : playedCard.rank;
				const playedSuit = playedCard.card ? playedCard.card.suit : playedCard.suit;
				const handRank = handCard.card ? handCard.card.rank : handCard.rank;
				const handSuit = handCard.card ? handCard.card.suit : handCard.suit;
				return handRank === playedRank && handSuit === playedSuit;
			});
			if (handIndex !== -1) {
				this.playerHands[0].splice(handIndex, 1);
			}
		});
		
		this.resetSelectedCards();
		this.refreshDisplays();
		this.playButton.setVisible(false);
		
		if (shouldAdvanceTutorial) {
			this.advanceTutorial();
		}
		
		this.audioSystem.playCardsPlacement();
	}

	update(time, delta) {
		if (this.animationSystem) {
			this.animationSystem.update(time, delta);
		}
		if (this.controllerSystem) {
			this.controllerSystem.update(time, delta);
		}
	}

	cleanup() {
		if (this.scene) {
			// Clear all hand sprites
			this.clearAllHandSprites();
			
			// Clear table sprites
			if (this.tableManager) {
				this.tableManager.clearPreviousTableSprites();
			}
			
			// Stop all tweens that might be running
			if (this.tweens) {
				this.tweens.killAll();
			}
			
			// Clear arrow graphics
			if (this.arrow) {
				this.arrow.clear();
				this.arrow.setVisible(false);
			}
			
			// Clean up play button if it exists
			if (this.playButton) {
				this.playButton.destroy();
				this.playButton = null;
			}
			
			// Clear tutorial text
			if (this.tutorialText) {
				this.tutorialText.destroy();
				this.tutorialText = null;
			}
		}
		
		// Reset all arrays and state
		this.selectedCards = [];
		this.handSelected = [];
		this.cardsSelected = [];
		this.tableCards = [];
		
		// Reset tutorial state
		this.tutorialStep = 0;
		this.tutorialComplete = false;
		this.waitingForPlayerAction = false;
		this.playerActionCompleted = false;
		this.turnValid = false;
		this.cardDrawnThisTurn = false;
		this.drawnCard = false;
		this.sceneTransitioning = false;
		this.tutorialInitialized = false;
	}
}