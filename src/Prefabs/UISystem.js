// UISystem.js - Handles UI elements, buttons, and interactivity

class UISystem {
    constructor(scene) {
        this.scene = scene;
    }

    // Creates all UI elements including buttons, deck sprite, and text displays
    createUIElements() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;
        const borderPadding = 10;

        // Create all sprites here
        this.scene.endTurnButton = this.createButton(
            w - borderPadding,
            h - borderPadding * 6,
            "end_turn",
            3,
            1,
            1
        );
        this.scene.restart = this.createButton(
            w - borderPadding,
            borderPadding,
            "restart",
            3,
            1,
            0
        );
        this.scene.deckSprite = this.createDeckSprite(
            w - borderPadding,
            centerY - borderPadding * 5,
            2,
            5
        );

        // Add sort buttons
        this.scene.sortRank = this.createButton(
            this.scene.endTurnButton.x,
            this.scene.endTurnButton.y - this.scene.endTurnButton.height - 50,
            "sort_rank",
            3,
            1,
            1
        );
        this.scene.sortSuit = this.createButton(
            this.scene.sortRank.x,
            this.scene.sortRank.y - this.scene.sortRank.height - 50,
            "sort_suit",
            3,
            1,
            1
        );

        // Add settings button
        this.scene.settingsButton = this.scene.add.text(
            borderPadding + 60,
            borderPadding + 20,
            "SETTINGS",
            {
                fontFamily: "PressStart2P",
                fontSize: "16px",
                backgroundColor: "#444444",
                color: "#FFFFFF",
                padding: { x: 8, y: 4 }
            }
        ).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

        // Menu config
        let menuConfig = {
            fontFamily: "PressStart2P",
            fontSize: "25px",
            backgroundColor: "#000000",
            color: "#FFFFFF",
            align: "center",
            padding: {
                top: 5,
                bottom: 5,
            },
            fixedWidth: 0,
        };

        // Add text for displaying the current player's turn
        this.scene.turnText = this.scene.add
            .text(
                25 + borderPadding * 4,
                h - borderPadding * 15,
                "Turn:\nP1",
                menuConfig
            )
            .setOrigin(0.5, 0.5);
    }

    // Creates a generic button sprite with specified properties
    createButton(x, y, texture, scale, originX, originY) {
        return this.scene.add
            .sprite(x, y, texture, 0)
            .setOrigin(originX, originY)
            .setScale(scale);
    }

    // Creates the deck sprite with stacked card effect for visual appeal
    createDeckSprite(x, y, scale, depth) {
        const deckSprite = this.scene.add
            .sprite(x, y, "card_deck", 53)
            .setOrigin(1, 0.5)
            .setScale(scale)
            .setDepth(depth);
        for (let i = 1; i <= 4; i++) {
            this.scene.add
                .sprite(deckSprite.x - 4 * i, deckSprite.y + 4 * i, "card_deck", 53)
                .setOrigin(1, 0.5)
                .setScale(scale)
                .setDepth(depth - i);
        }
        return deckSprite;
    }

    // Creates the validation box for confirming valid card plays
    createValidationBox() {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;
        
        // Create container for the validation box and text
        this.scene.validationBoxContainer = this.scene.add.container(centerX, centerY + 100);
        
        // Create the green box with rounded appearance
        this.scene.validationBox = this.scene.add
            .rectangle(0, 0, 250, 80, 0x00ff00)
            .setOrigin(0.5)
            .setInteractive()
            .setStrokeStyle(4, 0x00aa00);
        
        // Create the "Play" text
        this.scene.validationBoxText = this.scene.add.text(0, 0, "PLAY", {
            fontFamily: "PressStart2P",
            fontSize: "20px",
            color: "#000000",
            align: "center",
            stroke: "#FFFFFF",
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Add both to the container
        this.scene.validationBoxContainer.add([this.scene.validationBox, this.scene.validationBoxText]);
        
        // Set high depth to appear in front of all elements
        this.scene.validationBoxContainer.setDepth(2000);
        
        // Set initially invisible
        this.scene.validationBoxContainer.setVisible(false);
        
        // Add hover effects and click functionality
        this.scene.validationBox
            .on("pointerover", () => {
                // Darken the box on hover
                this.scene.validationBox.setFillStyle(0x00cc00);
                this.scene.validationBox.setStrokeStyle(4, 0x008800);
                this.scene.validationBoxText.setStyle({ color: "#FFFFFF", stroke: "#000000" });
            })
            .on("pointerout", () => {
                // Return to original colors
                this.scene.validationBox.setFillStyle(0x00ff00);
                this.scene.validationBox.setStrokeStyle(4, 0x00aa00);
                this.scene.validationBoxText.setStyle({ color: "#000000", stroke: "#FFFFFF" });
            })
            .on("pointerdown", () => {
                if (this.scene.audioSystem) {
                    this.scene.audioSystem.playCardsPlacement();
                }
                this.scene.gameLogic.handleValidPlay();
                this.scene.turnValid = true;
            });
    }

    // Adds interactive behavior to all UI buttons and elements
    addInteractivity() {
        // End Turn Button
        this.addButtonInteractivity(
            this.scene.endTurnButton,
            () => {
                if (this.scene.audioSystem) {
                    this.scene.audioSystem.playEndTurn();
                }
                this.scene.gameLogic.endTurn();
            },
            this.scene.handManager.displayHand.bind(this.scene.handManager)
        );
        
        // Restart Button
        this.addButtonInteractivity(
            this.scene.restart, 
            () => {
                if (this.scene.audioSystem) {
                    this.scene.audioSystem.playButtonPress();
                }
                this.scene.gameLogic.resetHandToTable();
            }
        );
        
        this.addDeckInteractivity(this.scene.deckSprite);
        
        // Sort Rank Button
        this.addButtonInteractivity(
            this.scene.sortRank,
            () => {
                if (this.scene.audioSystem) {
                    this.scene.audioSystem.playButtonPress();
                }
                
                // Clear any selected cards before sorting
                if (this.scene.cardsSelected && this.scene.cardsSelected.length > 0) {
                    console.log("Clearing selected cards before sorting by rank");
                    
                    // Clear the selected cards array
                    this.scene.cardsSelected = [];
                    
                    // Clear visual selection tints from all hand cards
                    if (this.scene.gameLogic) {
                        this.scene.gameLogic.clearHandSelectionTints();
                    }
                    
                    // Update validation box visibility to hide it
                    this.updateValidationBoxVisibility();
                }
                
                this.scene.handManager.sortRankHand();
            },
            this.scene.handManager.displayHand.bind(this.scene.handManager)
        );
        
        // Sort Suit Button
        this.addButtonInteractivity(
            this.scene.sortSuit,
            () => {
                if (this.scene.audioSystem) {
                    this.scene.audioSystem.playButtonPress();
                }
                
                // Clear any selected cards before sorting
                if (this.scene.cardsSelected && this.scene.cardsSelected.length > 0) {
                    console.log("Clearing selected cards before sorting by suit");
                    
                    // Clear the selected cards array
                    this.scene.cardsSelected = [];
                    
                    // Clear visual selection tints from all hand cards
                    if (this.scene.gameLogic) {
                        this.scene.gameLogic.clearHandSelectionTints();
                    }
                    
                    // Update validation box visibility to hide it
                    this.updateValidationBoxVisibility();
                }
                
                this.scene.handManager.sortSuitHand();
            },
            this.scene.handManager.displayHand.bind(this.scene.handManager)
        );

        // Settings Button
        this.scene.settingsButton.on('pointerover', () => {
            this.scene.settingsButton.setStyle({ backgroundColor: '#666666' });
        });

        this.scene.settingsButton.on('pointerout', () => {
            this.scene.settingsButton.setStyle({ backgroundColor: '#444444' });
        });

        this.scene.settingsButton.on('pointerdown', () => {
            if (this.scene.audioSystem) {
                this.scene.audioSystem.playMenuButton();
            }
            this.scene.scene.launch("settingsScene", { callingScene: "playScene" });
            this.scene.scene.pause();
        });
    }

    // Adds hover and click effects to buttons
    addButtonInteractivity(button, onClick, ...callbacks) {
        button.setInteractive();
        button.on("pointerover", () => {
            button.setFrame(2);
        });
        button.on("pointerout", () => {
            button.setFrame(0);
        });
        button.on("pointerdown", () => {
            onClick();
            button.setFrame(1);
            callbacks.forEach((callback) => callback());
        });
    }

    // Adds special interactive behavior to the deck sprite for drawing cards
    addDeckInteractivity(deckSprite) {
        deckSprite.setInteractive();
        deckSprite.on("pointerover", () => {
            this.scene.tweens.add({
                targets: deckSprite,
                scaleX: 2.1,
                scaleY: 2.1,
                duration: 200,
                ease: "Linear",
            });
        });
        deckSprite.on("pointerout", () => {
            this.scene.tweens.add({
                targets: deckSprite,
                scaleX: 2,
                scaleY: 2,
                duration: 200,
                ease: "Linear",
            });
        });
        deckSprite.on("pointerdown", () => {
            // Play card draw sound
            if (this.scene.audioSystem) {
                this.scene.audioSystem.playCardSelect();
            }
            this.scene.cardSystem.drawCard();
            this.scene.handManager.displayHand();
            // Remove displayTable() call - deck click should not reset table positions
        });
    }

    // Shows or hides the validation box based on selected cards validity
    updateValidationBoxVisibility() {
        const isValid = this.scene.cardSystem.checkValidGroup(this.scene.cardsSelected);
        this.scene.validationBoxContainer.setVisible(
            this.scene.cardsSelected.length >= 3 && isValid
        );
        if (this.scene.validationBoxContainer.visible) {
            this.positionValidationBox();
        }
    }

    // Positions the validation box at the center of the screen
    positionValidationBox() {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;
        this.scene.validationBoxContainer.setPosition(centerX, centerY + 100);
    }

    // Updates the turn display text to show which player's turn it is
    displayTurn() {
        if (this.scene.p1Turn) {
            this.scene.turnText.setText("Turn:\nP1");
        } else {
            this.scene.turnText.setText("Turn:\nP2");
        }
    }

    // Creates and shows the pause screen for turn transitions
    showPauseScreen() {
        console.log("Showing pause screen - Current turn:", this.scene.p1Turn ? "Player 1" : "Player 2");
        
        // Set pause screen active flag
        this.scene.pauseScreenActive = true;
        
        // Hide the current player's hand completely for privacy
        this.scene.handManager.hideHandSpritesForPauseScreen();
        
        // Create semi-transparent overlay
        this.scene.pauseOverlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.8)
            .setOrigin(0, 0)
            .setDepth(1000); // Ensure it's on top of everything

        // Determine which player's turn is next
        const nextPlayer = this.scene.p1Turn ? "Player 2" : "Player 1";
        
        // Create main text
        this.scene.pauseText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 60, `${nextPlayer} Ready?`, {
            fontFamily: 'PressStart2P',
            fontSize: '48px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        // Create instruction text
        this.scene.pauseInstructionText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 + 60, 'Click anywhere to continue', {
            fontFamily: 'PressStart2P',
            fontSize: '24px',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        // Add pulsing effect to the instruction text
        this.scene.pauseInstructionTween = this.scene.tweens.add({
            targets: this.scene.pauseInstructionText,
            alpha: { from: 1, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Make the overlay clickable
        this.scene.pauseOverlay.setInteractive();
        this.scene.pauseOverlay.on('pointerdown', () => {
            console.log("Pause screen clicked - hiding pause screen");
            this.hidePauseScreen();
        });

        // Disable all other game interactions while pause screen is active
        this.disableGameInteractions();
    }

    // Hides the pause screen and resumes the game
    hidePauseScreen() {
        console.log("Hiding pause screen and completing turn transition");
        
        // Clear pause screen active flag
        this.scene.pauseScreenActive = false;
        
        if (this.scene.pauseInstructionTween) {
            this.scene.pauseInstructionTween.stop();
            this.scene.pauseInstructionTween = null;
        }
        if (this.scene.pauseOverlay) {
            this.scene.pauseOverlay.destroy();
            this.scene.pauseOverlay = null;
        }
        if (this.scene.pauseText) {
            this.scene.pauseText.destroy();
            this.scene.pauseText = null;
        }
        if (this.scene.pauseInstructionText) {
            this.scene.pauseInstructionText.destroy();
            this.scene.pauseInstructionText = null;
        }

        // Re-enable game interactions
        this.enableGameInteractions();

        // Actually complete the turn transition
        this.scene.gameLogic.completeTurnTransition();
    }

    // Disables all game interactions while pause screen is shown
    disableGameInteractions() {
        // Disable UI buttons
        if (this.scene.endTurnButton) this.scene.endTurnButton.disableInteractive();
        if (this.scene.restart) this.scene.restart.disableInteractive();
        if (this.scene.sortRank) this.scene.sortRank.disableInteractive();
        if (this.scene.sortSuit) this.scene.sortSuit.disableInteractive();
        if (this.scene.deckSprite) this.scene.deckSprite.disableInteractive();
        if (this.scene.settingsButton) this.scene.settingsButton.disableInteractive();

        // Disable validation box interactivity
        if (this.scene.validationBox) this.scene.validationBox.disableInteractive();

        // Disable hand card interactions
        this.scene.handManager.disableCardInteractivity();
    }

    // Re-enables all game interactions after pause screen is hidden
    enableGameInteractions() {
        // Re-enable UI buttons
        if (this.scene.endTurnButton) this.scene.endTurnButton.setInteractive();
        if (this.scene.restart) this.scene.restart.setInteractive();
        if (this.scene.sortRank) this.scene.sortRank.setInteractive();
        if (this.scene.sortSuit) this.scene.sortSuit.setInteractive();
        if (this.scene.deckSprite) this.scene.deckSprite.setInteractive();
        if (this.scene.settingsButton) this.scene.settingsButton.setInteractive();

        // Re-enable validation box interactivity
        if (this.scene.validationBox) this.scene.validationBox.setInteractive();

        // Re-enable hand card interactions
        this.scene.handManager.enableCardInteractivity();
    }

    // Shows invalid turn notification with darkened screen
    showInvalidTurnNotification() {
        // Don't show multiple notifications at once or if pause screen is active
        if (this.scene.invalidTurnActive || this.scene.pauseScreenActive) {
            return;
        }

        console.log("Showing invalid turn notification");
        
        // Clear any selected cards when showing invalid turn notification
        // This ensures cards are deselected both visually and in the game state
        if (this.scene.cardsSelected && this.scene.cardsSelected.length > 0) {
            console.log("Clearing selected cards due to invalid turn attempt");
            
            // Clear the selected cards array
            this.scene.cardsSelected = [];
            
            // Clear visual selection tints from all hand cards
            if (this.scene.gameLogic) {
                this.scene.gameLogic.clearHandSelectionTints();
            }
            
            // Update validation box visibility to hide it
            this.updateValidationBoxVisibility();
        }
        
        // Set invalid turn active flag
        this.scene.invalidTurnActive = true;
        
        // Create semi-transparent overlay (similar to pause screen but slightly less dark)
        this.scene.invalidTurnOverlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.6)
            .setOrigin(0, 0)
            .setDepth(1000); // Ensure it's on top of everything

        // Create "Invalid Turn" text in red
        this.scene.invalidTurnText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2, 'Invalid Turn', {
            fontFamily: 'PressStart2P',
            fontSize: '48px',
            color: '#FF4444',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        // Start the fade out sequence after a brief display
        this.scene.time.delayedCall(1000, () => {
            this.hideInvalidTurnNotification();
        });

        // Play audio feedback if available
        if (this.scene.audioSystem) {
            // Could use a different sound or modify existing one for error feedback
            this.scene.audioSystem.playButtonPress();
        }
    }

    // Hides the invalid turn notification with fade effect
    hideInvalidTurnNotification() {
        if (!this.scene.invalidTurnActive) {
            return;
        }

        console.log("Hiding invalid turn notification");

        // Fade out the overlay and text
        this.scene.tweens.add({
            targets: [this.scene.invalidTurnOverlay, this.scene.invalidTurnText],
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Clean up the notification elements
                if (this.scene.invalidTurnOverlay) {
                    this.scene.invalidTurnOverlay.destroy();
                    this.scene.invalidTurnOverlay = null;
                }
                if (this.scene.invalidTurnText) {
                    this.scene.invalidTurnText.destroy();
                    this.scene.invalidTurnText = null;
                }
                
                // Reset the flag
                this.scene.invalidTurnActive = false;
                
                console.log("Invalid turn notification cleanup complete");
            }
        });
    }
}
