// HandManager.js - Handles hand display, sorting, and interactions

class HandManager {
    constructor(scene) {
        this.scene = scene;
    }

    displayHand(newCard = null) {
        const currentHand = this.getCurrentHand();
        this.clearExistingHandSprites();
        this.layoutHand(currentHand);

        if (newCard && newCard.sprite) {
            this.scene.animationSystem.poofEffect(newCard.sprite.x, newCard.sprite.y - 100);
        }
    }

    layoutHand(currentHand) {
        const spacing = this.calculateCardSpacing(currentHand.length);
        const startX = this.calculateStartX(currentHand.length, spacing);
        this.createHandSprites(currentHand, startX, spacing);
    }

    getCurrentHand() {
        return this.scene.p1Turn ? this.scene.p1Hand : this.scene.p2Hand;
    }

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

    calculateCardSpacing(handLength) {
        const baseSpacing = 60;
        const minSpacing = 30;
        const maxWidth = this.scene.scale.width - 200;
        const requiredWidth = handLength * baseSpacing;

        if (requiredWidth > maxWidth) {
            return Math.max(minSpacing, maxWidth / handLength);
        }
        return baseSpacing;
    }

    calculateStartX(handLength, spacing) {
        return (this.scene.scale.width - (handLength - 1) * spacing) / 2;
    }

    createHandSprites(currentHand, startX, spacing) {
        this.scene.handSelected = [];
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
            
            const cardSprite = this.createCardSprite(xPosition, frameIndex);

            card.sprite = cardSprite;
            this.scene.handSelected.push(cardSprite);
            this.addCardInteractivity(cardSprite, card, i);
        }
    }

    createCardSprite(xPosition, frameIndex) {
        // Ensure frameIndex is valid
        if (frameIndex < 0 || frameIndex > 53) {
            console.warn(`Invalid card frame index: ${frameIndex}, using 0`);
            frameIndex = 0;
        }
        
        const cardSprite = this.scene.add
            .sprite(
                xPosition,
                this.scene.scale.height - this.scene.borderUISize * 2,
                "card_deck",
                frameIndex
            )
            .setOrigin(0.5, 1)
            .setScale(2)
            .setDepth(1);

        // Initialize sprite properties
        cardSprite.baseY = this.scene.scale.height - this.scene.borderUISize * 2;
        cardSprite.interactionOffsetY = 0;
        cardSprite.isSelected = false;
        cardSprite.waveTintTween = null;

        return cardSprite;
    }

    addCardInteractivity(cardSprite, card, index) {
        cardSprite.setInteractive();
        cardSprite.on("pointerover", () => this.handlePointerOver(cardSprite));
        cardSprite.on("pointerout", () => this.handlePointerOut(cardSprite, card));
        cardSprite.on("pointerdown", () =>
            this.handlePointerDown(card, index, cardSprite)
        );
    }

    handlePointerOver(cardSprite) {
        if (!cardSprite.isSelected) {
            cardSprite.interactionOffsetY = -40;
            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: 2.2,
                scaleY: 2.2,
                duration: 200,
                ease: "Power2",
            });
        }
    }

    handlePointerOut(cardSprite, card) {
        if (!cardSprite.isSelected) {
            cardSprite.interactionOffsetY = 0;
            this.scene.tweens.add({
                targets: cardSprite,
                scaleX: 2,
                scaleY: 2,
                duration: 200,
                ease: "Power2",
            });
        }
    }

    handlePointerDown(card, index, cardSprite) {
        if (this.scene.drawnCard) {
            console.log("Cannot select card after drawing");
            return;
        }

        const currentHand = this.getCurrentHand();
        if (cardSprite.isSelected) {
            this.deselectCard(card, cardSprite);
        } else {
            this.selectCard(index, currentHand, cardSprite);
        }
        this.scene.updateValidationBoxVisibility();
    }

    selectCard(index, hand, cardSprite) {
        const card = hand[index];
        this.selectCardForPlay(card, cardSprite);
        this.scene.cardsSelected.push(card);
        console.log(`Card selected: ${card.card.suit} ${card.card.rank}`);
    }

    deselectCard(card, cardSprite) {
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
        console.log(`Card deselected: ${card.card.suit} ${card.card.rank}`);
    }

    selectCardForPlay(card, cardSprite) {
        // Clear any existing tint before applying new one
        this.clearCardTint(cardSprite);
        
        // Set selected state first
        cardSprite.isSelected = true;
        
        // Move card up
        cardSprite.interactionOffsetY = -80;
        
        // Scale the card slightly larger for selected state
        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: 2.2,
            scaleY: 2.2,
            duration: 200,
            ease: "Power2",
        });
        
        // Apply tint effect
        this.tintCard(cardSprite);
    }

    clearCardTint(cardSprite) {
        // Stop any flashing tween
        if (cardSprite.flashTween) {
            cardSprite.flashTween.destroy();
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

    moveCardToOriginalPosition(cardSprite) {
        cardSprite.interactionOffsetY = 0;
        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            ease: "Power2",
        });
    }

    tintCard(cardSprite) {
        // Create a smooth breathing effect using color interpolation from white to green
        this.showCardSelectionFlash(cardSprite);
        
        // Store original values for restoration
        const originalAlpha = cardSprite.alpha;
        cardSprite.originalAlpha = originalAlpha;
        
        // Remove any existing tint tween
        if (cardSprite.flashTween) {
            cardSprite.flashTween.stop();
            cardSprite.flashTween = null;
        }
        
        // Animate the tint using color interpolation
        cardSprite.flashTween = this.scene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: tween => {
                // Calculate smooth interpolation between white and green
                const t = tween.getValue() / 100;
                const r = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(0xffffff),
                    Phaser.Display.Color.ValueToColor(0x00ff00),
                    1,
                    t
                );
                cardSprite.setTint(Phaser.Display.Color.GetColor(r.r, r.g, r.b));
                // Also animate alpha for additional breathing effect
                cardSprite.setAlpha(originalAlpha - (t * 0.4));
            }
        });
    }

    showCardSelectionFlash(cardSprite) {
        // Create a brief pulse effect to indicate selection
        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: 2.4,
            scaleY: 2.4,
            duration: 150,
            yoyo: true,
            ease: "Power2"
        });
    }

    // Function to sort hand by rank
    sortHandByRank(hand) {
        hand.sort((a, b) => {
            const rankA = this.scene.cardSystem.getRankValue(a.card.rank);
            const rankB = this.scene.cardSystem.getRankValue(b.card.rank);
            return rankA - rankB;
        });
    }

    sortRankHand() {
        if (this.scene.p1Turn) {
            this.sortHandByRank(this.scene.p1Hand);
        } else {
            this.sortHandByRank(this.scene.p2Hand);
        }
    }

    // Function to sort hand by suit
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

    removeCardFromHand(hand, card) {
        const index = hand.indexOf(card);
        if (index !== -1) {
            hand.splice(index, 1);
        }
    }

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

    // Function to enable card interactivity
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
