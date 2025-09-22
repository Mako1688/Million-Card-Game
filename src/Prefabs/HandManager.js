// HandManager.js - Handles hand display, sorting, and interactions

class HandManager {
    constructor(scene) {
        this.scene = scene;
    }    // Displays the current player's hand with proper layout and effects
    displayHand(newCard = null) {
        const currentHand = this.getCurrentHand();
        this.clearExistingHandSprites();
        this.layoutHand(currentHand);

        // If a new card was added, trigger poof effect at its position
        if (newCard) {
            // Find the sprite for the new card (it should be the last one in the hand)
            const newCardIndex = currentHand.indexOf(newCard);
            if (newCardIndex !== -1 && this.scene.handSelected && this.scene.handSelected[newCardIndex]) {
                const cardSprite = this.scene.handSelected[newCardIndex];
                // Trigger poof effect slightly above the card
                this.scene.poofEffect(cardSprite.x, cardSprite.y - 50);
            }
        }
    }

    // Arranges cards in the hand with proper spacing and positioning
    layoutHand(currentHand) {
        const spacing = this.calculateCardSpacing(currentHand.length);
        const startX = this.calculateStartX(currentHand.length, spacing);
        this.createHandSprites(currentHand, startX, spacing);
    }

    // Returns the current player's hand array
    getCurrentHand() {
        return this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
    }

    // Removes all existing hand sprites and clears references
    clearExistingHandSprites() {
        if (this.scene.handSelected) {
            this.scene.handSelected.forEach((sprite) => {
                if (sprite) {
                    // Clear any tweens that might be running on this sprite
                    this.scene.tweens.killTweensOf(sprite);
                    sprite.destroy();
                }
            });
            this.scene.handSelected = [];
        }
        
        // Also clear sprite references from the current hand cards
        const currentHand = this.getCurrentHand();
        currentHand.forEach(card => {
            if (card.sprite) {
                card.sprite = null;
            }
        });
    }

    // Calculates optimal spacing between cards based on hand size and screen width
    calculateCardSpacing(handLength) {
        const baseSpacing = 60;
        const minSpacing = 20; // Minimum spacing for tighter packing
        
        // Calculate available width considering UI elements on the sides
        // Leave more space for UI elements (deck, buttons, etc.)
        const uiSafeZone = 400; // Safe zone for UI elements on both sides
        const maxWidth = this.scene.scale.width - uiSafeZone;
        const requiredWidth = handLength * baseSpacing;

        if (requiredWidth > maxWidth) {
            // Calculate the spacing needed to fit all cards within safe zone
            const calculatedSpacing = maxWidth / handLength;
            
            // Ensure we don't go below minimum spacing
            return Math.max(minSpacing, calculatedSpacing);
        }
        return baseSpacing;
    }

    // Calculates the starting X position for centering the hand
    calculateStartX(handLength, spacing) {
        return (this.scene.scale.width - (handLength - 1) * spacing) / 2;
    }

    // Creates sprite objects for all cards in hand with proper positioning and scale
    createHandSprites(currentHand, startX, spacing) {
        this.scene.handSelected = [];
        
        // No scale adjustment - let cards overlap naturally when needed
        // This is more visually appealing and common in card games
        const scaleAdjustment = 1.0;
        
        for (let i = 0; i < currentHand.length; i++) {
            const card = currentHand[i];
            const frameIndex = this.scene.cardSystem.getCardFrameIndex(card);
            const xPosition = startX + i * spacing;
            
            // Ensure any existing sprite is properly cleaned up
            if (card.sprite) {
                this.scene.tweens.killTweensOf(card.sprite);
                card.sprite.destroy();
                card.sprite = null;
            }
            
            const cardSprite = this.createCardSprite(xPosition, frameIndex, scaleAdjustment);
            card.sprite = cardSprite;
            this.scene.handSelected.push(cardSprite);
            this.addCardInteractivity(cardSprite, card, i);
            
            // Add visual indicator for cards that must return to table
            if (card.mustReturnToTable) {
                // Add a subtle yellow tint to indicate this card came from the table
                cardSprite.setTint(0xffffcc);
            }
        }
    }

    // Creates a single card sprite with proper configuration
    createCardSprite(xPosition, frameIndex, scaleAdjustment = 1.0) {
        // Ensure frameIndex is valid
        if (frameIndex < 0 || frameIndex > 53) {
            console.warn(`Invalid card frame index: ${frameIndex}, using 0`);
            frameIndex = 0;
        }
        
        const finalScale = 2 * scaleAdjustment; // Base scale of 2, adjusted for tight spacing
        
        const cardSprite = this.scene.add
            .sprite(
                xPosition,
                this.scene.scale.height - this.scene.borderUISize * 2,
                "card_deck",
                frameIndex
            )
            .setOrigin(0.5, 1)
            .setScale(finalScale)
            .setDepth(1);

        // Initialize sprite properties
        cardSprite.baseY = this.scene.scale.height - this.scene.borderUISize * 2;
        cardSprite.interactionOffsetY = 0;
        cardSprite.isSelected = false;
        cardSprite.waveTintTween = null;
        cardSprite.baseScale = finalScale; // Store base scale for selection scaling

        return cardSprite;
    }

    // Adds mouse interaction events to a card sprite
    addCardInteractivity(cardSprite, card, index) {
        cardSprite.setInteractive();
        cardSprite.on("pointerover", () => this.handlePointerOver(cardSprite));
        cardSprite.on("pointerout", () => this.handlePointerOut(cardSprite, card));
        cardSprite.on("pointerdown", () =>
            this.handlePointerDown(card, index, cardSprite)
        );
    }

    // Handles mouse hover over a card - scales up and moves slightly
    handlePointerOver(cardSprite) {
        if (!cardSprite.isSelected) {
            cardSprite.interactionOffsetY = -40;
            // Scale based on the card's base scale for consistency
            const targetScale = (cardSprite.baseScale || 2) * 1.1;
            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: targetScale,
                scaleY: targetScale,
                duration: 200,
                ease: "Power2",
            });
        }
    }

    // Handles mouse leaving a card - returns to normal state
    handlePointerOut(cardSprite, card) {
        if (!cardSprite.isSelected) {
            cardSprite.interactionOffsetY = 0;
            // Return to the card's base scale
            const targetScale = cardSprite.baseScale || 2;
            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: targetScale,
                scaleY: targetScale,
                duration: 200,
                ease: "Power2",
            });
        }
    }

    // Handles clicking on a card - toggles selection state
    handlePointerDown(card, index, cardSprite) {
        if (this.scene.drawnCard) {
            return; // Cannot select card after drawing
        }

        const currentHand = this.getCurrentHand();
        if (cardSprite.isSelected) {
            this.deselectCard(card, cardSprite);
        } else {
            this.selectCard(index, currentHand, cardSprite);
        }
        this.scene.updateValidationBoxVisibility();
    }

    // Selects a card for playing and adds it to the selected cards array
    selectCard(index, hand, cardSprite) {
        const card = hand[index];
        this.selectCardForPlay(card, cardSprite);
        this.scene.cardsSelected.push(card);
    }

    // Deselects a card and removes it from the selected cards array
    deselectCard(card, cardSprite) {
        // Play card deselection sound
        if (this.scene.audioSystem) {
            this.scene.audioSystem.playCardSelect();
        }
        
        // Clear tint first
        this.clearCardTint(cardSprite);
        
        // Set selected state to false
        cardSprite.isSelected = false;
        
        // Move card back to original position
        this.moveCardToOriginalPosition(cardSprite);

        const index = this.scene.cardsSelected.indexOf(card);
        if (index !== -1) {
            this.scene.cardsSelected.splice(index, 1);
        }
    }

    // Visually marks a card as selected with position, scale, and tint changes
    selectCardForPlay(card, cardSprite) {
        // Play card selection sound
        if (this.scene.audioSystem) {
            this.scene.audioSystem.playCardSelect();
        }
        
        // Clear any existing tint before applying new one
        this.clearCardTint(cardSprite);
        
        // Set selected state first
        cardSprite.isSelected = true;
        
        // Move card up
        cardSprite.interactionOffsetY = -80;
        
        // Scale the card slightly larger for selected state, considering its base scale
        const targetScale = cardSprite.baseScale * 1.1; // Scale up by 10% from base scale
        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 200,
            ease: "Power2",
        });
        
        // Apply tint effect
        this.tintCard(cardSprite);
    }

    // Removes tint and animation effects from a card sprite
    clearCardTint(cardSprite) {
        // Stop any flashing tween
        if (cardSprite.flashTween) {
            if (typeof cardSprite.flashTween === 'object' && cardSprite.flashTween.destroy) {
                cardSprite.flashTween.destroy();
            }
            cardSprite.flashTween = null;
        }
        
        // Restore original appearance
        if (cardSprite.originalTint !== undefined) {
            if (cardSprite.originalTint === 0xffffff) {
                cardSprite.clearTint();
            } else {
                cardSprite.setTint(cardSprite.originalTint);
            }
            cardSprite.originalTint = undefined;
        } else {
            cardSprite.clearTint();
        }
        
        if (cardSprite.originalAlpha !== undefined) {
            cardSprite.setAlpha(cardSprite.originalAlpha);
            cardSprite.originalAlpha = undefined;
        } else {
            cardSprite.setAlpha(1);
        }
    }

    // Returns a card sprite to its normal position and scale
    moveCardToOriginalPosition(cardSprite) {
        cardSprite.interactionOffsetY = 0;
        // Scale back to base scale rather than hardcoded 2
        const targetScale = cardSprite.baseScale || 2;
        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 200,
            ease: "Power2",
        });
    }

    // Applies a breathing tint effect to selected cards
    tintCard(cardSprite) {
        // Clear any existing effects first
        this.clearCardTint(cardSprite);
        
        // Store original values for restoration
        const originalAlpha = cardSprite.alpha;
        cardSprite.originalAlpha = originalAlpha;
        
        // Store original tint for restoration
        cardSprite.originalTint = cardSprite.tint || 0xffffff;
        
        // Create a simple pulsing color effect using alpha and tint
        cardSprite.flashTween = this.scene.tweens.add({
            targets: cardSprite,
            alpha: { from: originalAlpha, to: originalAlpha * 0.6 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onStart: () => {
                cardSprite.setTint(0x00ff00); // Bright green
            },
            onUpdate: (tween) => {
                // Create breathing effect by modulating tint intensity
                const progress = tween.progress;
                const intensity = Math.sin(progress * Math.PI * 2); // Wave from -1 to 1
                
                // Blend between green and white based on intensity
                const greenIntensity = (intensity + 1) / 2; // Convert to 0-1 range
                const red = Math.floor(255 * (1 - greenIntensity * 0.8));
                const green = 255;
                const blue = Math.floor(255 * (1 - greenIntensity * 0.8));
                
                const color = (red << 16) | (green << 8) | blue;
                cardSprite.setTint(color);
            }
        });
    }

    // Creates a brief pulse effect when a card is selected
    showCardSelectionFlash(cardSprite) {
        // Create a brief pulse effect to indicate selection
        const baseScale = cardSprite.baseScale || 2;
        const targetScale = baseScale * 1.2;
        
        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: targetScale,
            scaleY: targetScale,
            duration: 150,
            yoyo: true,
            ease: "Power2"
        });
    }

    // Sorts hand by rank (A=1, 2-10=face value, J-K=11-13)
    sortHandByRank(hand) {
        hand.sort((a, b) => {
            const rankA = this.scene.cardSystem.getRankValue(a.card.rank);
            const rankB = this.scene.cardSystem.getRankValue(b.card.rank);
            return rankA - rankB;
        });
    }

    // Sorts the current player's hand by rank
    sortRankHand() {
        if (this.scene.p1Turn) {
            this.sortHandByRank(this.scene.p1Hand);
        } else {
            this.sortHandByRank(this.scene.p2Hand);
        }
    }

    // Sorts the current player's hand by suit, then by rank within each suit
    sortSuitHand() {
        const currentHand = this.getCurrentHand();
        currentHand.sort((a, b) => {
            const suitA = suits.indexOf(a.card.suit);
            const suitB = suits.indexOf(b.card.suit);
            if (suitA !== suitB) {
                return suitA - suitB;
            }
            const rankA = this.scene.cardSystem.getRankValue(a.card.rank);
            const rankB = this.scene.cardSystem.getRankValue(b.card.rank);
            return rankA - rankB;
        });
    }

    // Removes a specific card from a hand array
    removeCardFromHand(hand, card) {
        const index = hand.indexOf(card);
        if (index !== -1) {
            hand.splice(index, 1);
        }
    }

    // Disables interactivity for all hand and table card sprites
    disableCardInteractivity() {
        if (this.scene.handSelected) {
            this.scene.handSelected.forEach((sprite) => {
                if (sprite) sprite.disableInteractive();
            });
        }
        if (this.scene.tableSprites) {
            this.scene.tableSprites.forEach((sprite) => {
                if (sprite) sprite.disableInteractive();
            });
        }
    }

    // Enables interactivity for all hand and table card sprites
    enableCardInteractivity() {
        if (this.scene.handSelected) {
            this.scene.handSelected.forEach((sprite) => {
                if (sprite) sprite.setInteractive();
            });
        }
        if (this.scene.tableSprites) {
            this.scene.tableSprites.forEach((sprite) => {
                if (sprite) sprite.setInteractive();
            });
        }
    }
}
