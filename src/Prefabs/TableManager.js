// TableManager.js - Handles table display, card placement, and validation

class TableManager {
    constructor(scene) {
        this.scene = scene;
    }

    // Displays all card groups on the table with proper layout and positioning
    displayTable() {
        this.clearPreviousTableSprites();
        
        // Sort all groups before displaying to ensure proper order
        this.scene.tableCards.forEach(group => {
            if (group.length > 1) {
                this.sortGroup(group);
            }
        });
        
        const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();

        this.scene.tableSprites = [];
        this.scene.tableCards.forEach((group, groupIndex) => {
            // Check if this group has custom positions (from dragging or previous placement)
            const hasCustomPositions = group.some(card => card.customPosition);
            
            if (!hasCustomPositions) {
                // For groups without custom positions, find an available position
                const availablePosition = this.findAvailableGroupPosition(group.length);
                this.displayTableGroup(group, groupIndex, availablePosition.x, availablePosition.y);
                // Custom positions are now set within displayTableGroup method
            } else {
                // Preserve custom positions - just recreate sprites at their existing positions
                this.displayTableGroupAtCustomPositions(group, groupIndex);
            }
        });
        
        // Only check for invalid groups when not in middle of operations that might cause temporary invalid states
        // This prevents inappropriate flashing during card moves, resets, or other temporary operations
        if (!this.scene.resetPressed && 
            !this.scene.gameLogic?.isProcessingMove && 
            !this.scene.drawnCard) {
            this.updateInvalidGroupStates();
        }
    }

    // Removes all existing table sprites and clears references
    clearPreviousTableSprites() {
        if (this.scene.tableSprites) {
            this.scene.tableSprites.forEach((sprite) => {
                if (sprite) {
                    this.scene.tweens.killTweensOf(sprite);
                    sprite.destroy();
                }
            });
            this.scene.tableSprites = [];
        }
        
        // Also clear sprite references and reset state from all table cards
        this.scene.tableCards.forEach(group => {
            group.forEach(card => {
                if (card.sprite) {
                    // Stop any flashing effects
                    this.stopGroupFlash(card);
                    card.sprite = null;
                }
                card.isDragging = false; // Reset drag state
            });
        });
    }

    // Returns the dimensions and boundaries for table layout
    getTableDimensions() {
        const minX = 50;
        const minY = 150;
        const maxX = this.scene.scale.width - 150; // More room for dragging
        const maxY = this.scene.scale.height - 250; // More room above hand
        const rowHeight = 120;
        const colWidth = 60;
        return { minX, minY, maxX, maxY, rowHeight, colWidth };
    }

    // Returns drag boundaries for individual cards to prevent off-screen dragging
    getDragBoundaries() {
        // Allow dragging anywhere on screen with appropriate borders
        // This ensures no part of the card sprites pass the border
        const BORDER_SIZE = 20;
        const CARD_WIDTH = 60 * 2; // Card width * scale
        const CARD_HEIGHT = 92 * 2; // Card height * scale
        
        return {
            minX: BORDER_SIZE,
            minY: BORDER_SIZE,
            maxX: this.scene.scale.width - BORDER_SIZE - CARD_WIDTH,
            maxY: this.scene.scale.height - BORDER_SIZE - CARD_HEIGHT
        };
    }

    // Returns drag boundaries for entire card groups to prevent off-screen dragging
    getGroupDragBoundaries(group) {
        const BORDER_SIZE = 20;
        const CARD_WIDTH = 120; // Card width at scale 2
        const CARD_HEIGHT = 184; // Card height at scale 2
        const CARD_SPACING = 60; // Standard spacing between cards in a group
        
        // Calculate total width needed for the group
        const totalGroupWidth = CARD_WIDTH + (group.length - 1) * CARD_SPACING;
        
        return {
            minX: BORDER_SIZE,
            minY: BORDER_SIZE,
            // Ensure rightmost card of the group stays within bounds
            maxX: Math.max(BORDER_SIZE, this.scene.scale.width - BORDER_SIZE - totalGroupWidth),
            maxY: this.scene.scale.height - BORDER_SIZE - CARD_HEIGHT
        };
    }

    // Displays a single group of cards at specified grid position
    displayTableGroup(group, groupIndex, currentX, currentY) {
        const { colWidth } = this.getTableDimensions();

        group.forEach((card, cardIndex) => {
            const frameIndex = this.scene.cardSystem.getCardFrameIndex(card);
            const cardX = currentX + cardIndex * colWidth;
            const cardY = currentY;

            // Clean up existing sprite if it exists
            if (card.sprite) {
                this.scene.tweens.killTweensOf(card.sprite);
                card.sprite.destroy();
                card.sprite = null;
            }

            // Initialize card properties for animation and dragging
            card.isDragging = false;

            const cardSprite = this.createCardSpriteForTable(
                card,
                frameIndex,
                cardX,
                cardY,
                cardIndex,
                colWidth
            );

            card.sprite = cardSprite;
            this.scene.tableSprites.push(cardSprite);
            
            // Set custom position to ensure cards stay together
            card.customPosition = {
                x: cardX,
                y: cardY
            };
            
            // Pass group and groupIndex so any card can trigger group actions
            this.addCardDragInteractivity(cardSprite, card, group, groupIndex);
        });
    }

    // Displays a group of cards at their custom positions (after being dragged)
    displayTableGroupAtCustomPositions(group, groupIndex) {
        // Find the base position from the first card that has a custom position
        let baseX = 50; // Default fallback
        let baseY = 150; // Default fallback
        const { colWidth } = this.getTableDimensions();
        
        // Find a card with custom position to use as base, preferably the first card
        const cardWithPosition = group.find(card => card.customPosition) || group[0];
        if (cardWithPosition && cardWithPosition.customPosition) {
            baseX = cardWithPosition.customPosition.x;
            baseY = cardWithPosition.customPosition.y;
        } else if (cardWithPosition && cardWithPosition.sprite) {
            // Use sprite position if no custom position is available
            baseX = cardWithPosition.sprite.x;
            baseY = cardWithPosition.sprite.y;
        }
        
        group.forEach((card, cardIndex) => {
            const frameIndex = this.scene.cardSystem.getCardFrameIndex(card);
            
            // Always use proper spacing from base position to keep cards together
            const cardX = baseX + cardIndex * colWidth;
            const cardY = baseY;

            // Clean up existing sprite if it exists
            if (card.sprite) {
                this.scene.tweens.killTweensOf(card.sprite);
                card.sprite.destroy();
                card.sprite = null;
            }

            // Create new sprite at calculated position
            const cardSprite = this.createCardSpriteForTable(
                card,
                frameIndex,
                cardX,
                cardY,
                cardIndex,
                colWidth
            );

            card.sprite = cardSprite;
            this.scene.tableSprites.push(cardSprite);
            
            // Update custom position to match the actual positioned location
            card.customPosition = {
                x: cardX,
                y: cardY
            };
            // Pass group and groupIndex so any card can trigger group actions
            this.addCardDragInteractivity(cardSprite, card, group, groupIndex);
        });
    }

    // Creates a card sprite for table display with proper positioning and effects
    createCardSpriteForTable(
        card,
        frameIndex,
        currentX,
        currentY,
        cardIndex,
        colWidth
    ) {
        const cardSprite = this.scene.add
            .sprite(currentX, currentY, "card_deck", frameIndex)
            .setOrigin(0, 0)
            .setScale(2)
            .setDepth(cardIndex)
            .setInteractive();

        cardSprite.baseY = currentY;
        cardSprite.interactionOffsetY = 0;

        // Initialize properties for drag detection
        cardSprite.dragStartX = 0;
        cardSprite.dragStartY = 0;
        cardSprite.totalDragDistance = 0;
        cardSprite.isDragMode = false;

        // Add hover effects
        cardSprite.on("pointerover", () => {
            if (!card.isDragging) {
                // Only change scale, not Y position to preserve wave animation
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: 2.2,
                    scaleY: 2.2,
                    duration: 200,
                    ease: "Power2",
                });
            }
        });

        cardSprite.on("pointerout", () => {
            if (!card.isDragging) {
                // Only reset scale, not Y position to preserve wave animation
                this.scene.tweens.add({
                    targets: cardSprite,
                    scaleX: 2,
                    scaleY: 2,
                    duration: 200,
                    ease: "Power2",
                });
            }
        });

        return cardSprite;
    }

    // Adds drag and click interactivity to table cards for group manipulation
    addCardDragInteractivity(cardSprite, card, group, groupIndex) {
        let isDragging = false;
        let pointerDownTime = 0;
        let groupStartPositions = [];
        const DRAG_THRESHOLD = 15; // pixels to distinguish between click and drag

        // Handle pointer down - start tracking for drag vs click
        cardSprite.on("pointerdown", (pointer, localX, localY, event) => {
            if (this.scene.drawnCard) {
                return; // Cannot interact with cards after drawing
            }

            event.stopPropagation();
            pointerDownTime = this.scene.time.now;
            cardSprite.dragStartX = pointer.x;
            cardSprite.dragStartY = pointer.y;
            cardSprite.totalDragDistance = 0;
            cardSprite.isDragMode = false;

            // Store initial positions of all cards in the group
            groupStartPositions = group.map(groupCard => ({
                x: groupCard.sprite.x,
                y: groupCard.sprite.y
            }));

            // Create bound methods to avoid context issues
            const boundHandlePointerMove = (pointer) => this.handlePointerMove(pointer, cardSprite, group, groupStartPositions, DRAG_THRESHOLD);
            const boundHandlePointerUp = (pointer) => this.handlePointerUp(pointer, cardSprite, card, group, groupIndex, groupStartPositions);

            // Store bound methods on the sprite for cleanup
            cardSprite.boundHandlePointerMove = boundHandlePointerMove;
            cardSprite.boundHandlePointerUp = boundHandlePointerUp;

            // Start listening for pointer move
            this.scene.input.on('pointermove', boundHandlePointerMove);
            this.scene.input.on('pointerup', boundHandlePointerUp);
        });
    }

    handlePointerMove(pointer, cardSprite, group, groupStartPositions, DRAG_THRESHOLD) {
        if (cardSprite.dragStartX === undefined) return;

        const deltaX = pointer.x - cardSprite.dragStartX;
        const deltaY = pointer.y - cardSprite.dragStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        cardSprite.totalDragDistance = distance;

        // Switch to drag mode if moved beyond threshold
        if (distance > DRAG_THRESHOLD && !cardSprite.isDragMode) {
            cardSprite.isDragMode = true;
            
            // Start drag mode - bring group to front
            group.forEach((groupCard, index) => {
                if (groupCard.sprite) {
                    groupCard.isDragging = true;
                    groupCard.sprite.setDepth(1000 + index);
                }
            });
        }

        // If in drag mode, move the entire group
        if (cardSprite.isDragMode) {
            const groupBoundaries = this.getGroupDragBoundaries(group);
            const CARD_SPACING = 60; // Maintain consistent spacing between cards
            
            // Calculate the new position for the first card (leftmost)
            let newX = groupStartPositions[0].x + deltaX;
            let newY = groupStartPositions[0].y + deltaY;
            
            // Constrain the first card position to group boundaries
            newX = Math.max(groupBoundaries.minX, Math.min(newX, groupBoundaries.maxX));
            newY = Math.max(groupBoundaries.minY, Math.min(newY, groupBoundaries.maxY));
            
            // Position all cards relative to the first card with proper spacing
            group.forEach((groupCard, index) => {
                if (groupCard.sprite) {
                    const cardX = newX + (index * CARD_SPACING);
                    const cardY = newY;
                    
                    // Double-check each card stays within screen bounds to prevent overlap
                    const CARD_WIDTH = 120; // Card width at scale 2
                    const CARD_HEIGHT = 184; // Card height at scale 2
                    const BORDER = 20;
                    
                    const adjustedX = Math.max(BORDER, Math.min(cardX, this.scene.scale.width - BORDER - CARD_WIDTH));
                    const adjustedY = Math.max(BORDER, Math.min(cardY, this.scene.scale.height - BORDER - CARD_HEIGHT));
                    
                    groupCard.sprite.x = adjustedX;
                    groupCard.sprite.y = adjustedY;
                    groupCard.sprite.baseY = adjustedY;
                    
                    // Store custom position to preserve after table refresh
                    groupCard.customPosition = {
                        x: adjustedX,
                        y: adjustedY
                    };
                }
            });
        }
    }

    handlePointerUp(pointer, cardSprite, card, group, groupIndex, groupStartPositions) {
        if (cardSprite.dragStartX === undefined) return;

        // Clean up listeners
        this.scene.input.off('pointermove', cardSprite.boundHandlePointerMove);
        this.scene.input.off('pointerup', cardSprite.boundHandlePointerUp);

        const wasInDragMode = cardSprite.isDragMode;
        
        // Reset drag state
        group.forEach((groupCard, index) => {
            if (groupCard.sprite) {
                groupCard.isDragging = false;
                groupCard.sprite.setDepth(index);
            }
        });

        // If not in drag mode, treat as click
        if (!wasInDragMode) {
            // Reset positions to original since it was just a click
            group.forEach((groupCard, index) => {
                if (groupCard.sprite && groupStartPositions[index]) {
                    groupCard.sprite.x = groupStartPositions[index].x;
                    groupCard.sprite.y = groupStartPositions[index].y;
                }
            });
            this.handleCardClickOnTable(card, group, groupIndex);
        } else {
            // If it was a drag, update the baseY positions so the wave effect works from the new position
            // and mark all cards in the group as having custom positions
            group.forEach((groupCard) => {
                if (groupCard.sprite) {
                    groupCard.sprite.baseY = groupCard.sprite.y;
                    // Store custom position to preserve it during refreshes
                    groupCard.customPosition = {
                        x: groupCard.sprite.x,
                        y: groupCard.sprite.y
                    };
                }
            });
        }

        // Reset tracking variables
        cardSprite.dragStartX = undefined;
        cardSprite.dragStartY = undefined;
        cardSprite.totalDragDistance = 0;
        cardSprite.isDragMode = false;
    }

    // Calculates the bounding box for a group of cards for collision detection
    calculateGroupBounds(group) {
        if (!group || group.length === 0) return null;

        const sprites = group.map(card => card.sprite).filter(sprite => sprite);
        if (sprites.length === 0) return null;

        const minX = Math.min(...sprites.map(s => s.x));
        const maxX = Math.max(...sprites.map(s => s.x + s.width * s.scaleX));
        const minY = Math.min(...sprites.map(s => s.y));
        const maxY = Math.max(...sprites.map(s => s.y + s.height * s.scaleY));

        return { minX, maxX, minY, maxY };
    }

    // Handles clicking on table cards to add hand cards to existing groups or take table cards to hand
    handleCardClickOnTable(card, group, groupIndex) {
        // Special handling for tutorial scene
        if (this.scene.scene.key === "tutorialScene") {
            return this.handleTutorialCardClick(card, group, groupIndex);
        }
        // Play card selection sound for table card interaction
        if (this.scene.audioSystem) {
            this.scene.audioSystem.playCardSelect();
        }
        
        if (this.scene.drawnCard) {
            return;
        }

        // Set processing flag to prevent inappropriate flashing during move operations
        if (this.scene.gameLogic) {
            this.scene.gameLogic.isProcessingMove = true;
        }

        if (this.scene.cardsSelected.length > 0) {
            // Check if selected cards from hand can be added to this group
            const testGroup = [...group, ...this.scene.cardsSelected];
            const result = this.scene.cardSystem.checkValidGroup(testGroup);
            
            if (result) {
                // Before modifying this group, preserve positions of ALL other groups
                this.preserveOtherGroupPositions(groupIndex);
                
                // Store current positions before adding cards
                const currentPositions = group.map(groupCard => ({
                    card: groupCard,
                    x: groupCard.sprite ? groupCard.sprite.x : 0,
                    y: groupCard.sprite ? groupCard.sprite.y : 0,
                    depth: groupCard.sprite ? groupCard.sprite.depth : 0
                }));

                // Stop any red flashing on the group since it's becoming valid
                group.forEach(card => {
                    if (card.isInvalidGroup) {
                        this.stopGroupFlash(card);
                    }
                });

                // Store selected cards for poof effects before clearing the array
                const cardsToAddEffects = [...this.scene.cardsSelected];

                // Move selected cards from hand to this table group
                this.scene.cardsSelected.forEach((selectedCard) => {
                    this.scene.handManager.removeCardFromHand(
                        this.scene.handManager.getCurrentHand(), 
                        selectedCard
                    );
                    group.push(selectedCard);
                    selectedCard.table = true;
                    selectedCard.isDragging = false; // Ensure proper state
                    
                    // Clear any existing custom position to prevent positioning conflicts
                    delete selectedCard.customPosition;
                    
                    // Clear mustReturnToTable flag since card has successfully returned to table
                    if (selectedCard.mustReturnToTable) {
                        delete selectedCard.mustReturnToTable;
                    }
                    
                    // Clear any invalid state (safety check, hand cards shouldn't have this)
                    if (selectedCard.isInvalidGroup) {
                        this.stopGroupFlash(selectedCard);
                        selectedCard.isInvalidGroup = false;
                    }
                    
                    // Don't overwrite originalPosition here - preserve it for reset functionality
                    // The originalPosition will be updated when the turn ends in updateOriginalPositions()
                });
                
                // Clear custom positions since the group is being modified
                group.forEach(card => {
                    delete card.customPosition;
                });
                
                this.scene.cardsSelected = [];
                this.scene.placedCards = true;
                
                // Sort the group to maintain proper order
                this.sortGroup(group);
                
                // Refresh display and then restore/adjust positions
                this.scene.refreshDisplays();
                
                // Maintain positions of existing cards while making room for new ones
                this.adjustGroupPositionsForNewCards(group, currentPositions);
                
                this.scene.updateValidationBoxVisibility();
                
                // Show green flash for successful addition
                this.showGroupFlash(group, 0x00ff00);
                
                // Add poof effect for newly added cards (after display refresh so sprites exist)
                cardsToAddEffects.forEach((selectedCard) => {
                    if (selectedCard.sprite) {
                        this.scene.animationSystem.poofEffect(selectedCard.sprite.x, selectedCard.sprite.y);
                    }
                });
            } else {
                // Don't show red flash for invalid addition attempts - it's just user testing
                // The user will see the validation box doesn't appear, which is sufficient feedback
            }
        } else {
            // No cards selected from hand - move this table card back to hand
            const currentHand = this.scene.handManager.getCurrentHand();
            const cardIndex = group.indexOf(card);
            
            if (cardIndex !== -1) {
                // Store current positions of remaining cards before removal
                const remainingPositions = [];
                group.forEach((groupCard, index) => {
                    if (index !== cardIndex && groupCard.sprite) {
                        remainingPositions.push({
                            card: groupCard,
                            x: groupCard.sprite.x,
                            y: groupCard.sprite.y,
                            depth: groupCard.sprite.depth
                        });
                    }
                });
                
                // Remove card from group
                group.splice(cardIndex, 1);
                
                // Clear custom positions for remaining cards since group structure changed
                group.forEach(card => {
                    delete card.customPosition;
                });
                
                // Add card back to hand
                card.table = false;
                card.isDragging = false; // Reset drag state
                
                // Clear invalid group state and stop any red flashing when moving to hand
                if (card.isInvalidGroup) {
                    this.stopGroupFlash(card);
                    card.isInvalidGroup = false;
                }
                
                // Don't overwrite originalPosition here - preserve it for reset functionality
                // Also preserve mustReturnToTable flag - table cards must return to table by turn end
                // The originalPosition will be updated when the turn ends in updateOriginalPositions()
                currentHand.push(card);
                
                // Add poof effect at card's current position before moving to hand
                if (card.sprite) {
                    this.scene.animationSystem.poofEffect(card.sprite.x, card.sprite.y);
                }
                
                // Remove card from any current selection
                const selectionIndex = this.scene.cardsSelected.indexOf(card);
                if (selectionIndex !== -1) {
                    this.scene.cardsSelected.splice(selectionIndex, 1);
                }
                
                // Clean up empty groups
                if (group.length === 0) {
                    this.scene.tableCards.splice(groupIndex, 1);
                } else {
                    // Check if remaining group is valid
                    const remainingGroupValid = this.scene.cardSystem.checkValidGroup(group);
                    
                    if (!remainingGroupValid) {
                        // Mark cards as invalid for immediate visual feedback
                        group.forEach(card => {
                            if (!card.isInvalidGroup) {
                                card.isInvalidGroup = true;
                            }
                        });
                        // Show red flash for invalid remaining group (continuous)
                        this.showGroupFlash(group, 0xff0000, true);
                    }
                    
                    // Restore positions of remaining cards after display refresh
                    this.preserveGroupPositions(group, remainingPositions);
                }
                
                this.scene.refreshDisplays();
                
                // Apply preserved positions after display refresh
                if (group.length > 0 && remainingPositions.length > 0) {
                    this.applyPreservedPositions(remainingPositions);
                }
                
                this.scene.updateValidationBoxVisibility();
            }
        }
        
        // Clear processing flag and update invalid group states after operation completes
        if (this.scene.gameLogic) {
            this.scene.gameLogic.isProcessingMove = false;
        }
        
        // Force update of invalid group states after the operation completes
        // Use a small delay to ensure all sprite updates are complete
        this.scene.time.delayedCall(10, () => {
            this.updateInvalidGroupStates();
        });
    }

    // Preserves the current positions of all groups except the one being modified
    preserveOtherGroupPositions(excludeGroupIndex) {
        this.scene.tableCards.forEach((group, groupIndex) => {
            if (groupIndex !== excludeGroupIndex) {
                group.forEach(card => {
                    if (card.sprite && card.sprite.x && card.sprite.y) {
                        // Mark this card as having a custom position to preserve it
                        card.customPosition = {
                            x: card.sprite.x,
                            y: card.sprite.y
                        };
                    }
                });
            }
        });
    }

    // Preserves the current positions of all existing groups before adding new groups
    preserveExistingGroupPositions() {
        this.scene.tableCards.forEach(group => {
            group.forEach(card => {
                if (card.sprite && card.sprite.x && card.sprite.y) {
                    // Mark this card as having a custom position to preserve it
                    card.customPosition = {
                        x: card.sprite.x,
                        y: card.sprite.y
                    };
                }
            });
        });
    }

    // Stores positions of remaining cards in a group for preservation during reset
    preserveGroupPositions(group, remainingPositions) {
        // Store positions that we want to preserve
        this.pendingPreservedPositions = remainingPositions;
    }

    // Applies preserved positions to cards after group modifications
    applyPreservedPositions(remainingPositions) {
        // Apply the preserved positions to the sprites
        remainingPositions.forEach(({ card, x, y, depth }) => {
            if (card.sprite) {
                card.sprite.x = x;
                card.sprite.y = y;
                card.sprite.baseY = y; // Update baseY for wave effect
                card.sprite.setDepth(depth);
            }
        });
    }

    // Shows visual feedback (flashing) for card groups - either continuous or one-time
    showGroupFlash(group, color, continuous = false) {
        group.forEach(card => {
            if (card.sprite) {
                // Stop any existing flash animation
                this.stopGroupFlash(card);
                
                if (continuous) {
                    // Store original values for proper cycling
                    const originalAlpha = card.sprite.alpha;
                    card.sprite.originalAlpha = originalAlpha;
                    
                    // Store original tint (if any) before starting animation
                    card.sprite.originalTint = card.sprite.tint || 0xffffff;
                    
                    // Create simple alternating flash for continuous effect
                    const lightColor = this.lightenColor(color, 0.6);
                    
                    card.sprite.flashTween = this.scene.tweens.add({
                        targets: card.sprite,
                        alpha: { from: originalAlpha, to: originalAlpha * 0.4 },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        onStart: () => {
                            // Set target color when animation starts
                            card.sprite.setTint(color);
                        },
                        onYoyo: () => {
                            // Alternate between target color and lighter version
                            const currentTint = card.sprite.tint || 0xffffff;
                            const newTint = currentTint === color ? lightColor : color;
                            card.sprite.setTint(newTint);
                        },
                        onRepeat: () => {
                            // Alternate between target color and lighter version
                            const currentTint = card.sprite.tint || 0xffffff;
                            const newTint = currentTint === color ? lightColor : color;
                            card.sprite.setTint(newTint);
                        }
                    });
                    
                    // Mark as invalid for tracking
                    card.isInvalidGroup = true;
                } else {
                    // One-time simple flash
                    const originalAlpha = card.sprite.alpha;
                    const originalTint = card.sprite.tint || 0xffffff;
                    
                    // Simple flash effect
                    this.scene.tweens.add({
                        targets: card.sprite,
                        duration: 200,
                        yoyo: true,
                        repeat: 1,
                        ease: 'Power2.easeInOut',
                        alpha: { from: originalAlpha, to: originalAlpha * 0.5 },
                        onStart: () => {
                            // Set the flash color
                            card.sprite.setTint(color);
                        },
                        onComplete: () => {
                            // Restore original state
                            card.sprite.setAlpha(originalAlpha);
                            if (originalTint === 0xffffff) {
                                card.sprite.clearTint();
                            } else {
                                card.sprite.setTint(originalTint);
                            }
                        }
                    });
                }
            }
        });
    }

    // Helper function to lighten a color
    lightenColor(color, factor) {
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        return (newR << 16) | (newG << 8) | newB;
    }

    // Stops flashing animation and restores card's original appearance
    stopGroupFlash(card) {
        if (card.sprite) {
            // Stop any existing flash animation
            if (card.sprite.flashTween) {
                if (typeof card.sprite.flashTween === 'object' && card.sprite.flashTween.destroy) {
                    card.sprite.flashTween.destroy();
                }
                card.sprite.flashTween = null;
            }
            
            // Restore original appearance
            if (card.sprite.originalTint !== undefined) {
                if (card.sprite.originalTint === 0xffffff) {
                    card.sprite.clearTint();
                } else {
                    card.sprite.setTint(card.sprite.originalTint);
                }
                card.sprite.originalTint = undefined;
            } else {
                card.sprite.clearTint();
            }
            
            if (card.sprite.originalAlpha !== undefined) {
                card.sprite.setAlpha(card.sprite.originalAlpha);
                card.sprite.originalAlpha = undefined;
            } else {
                card.sprite.setAlpha(1);
            }
        }
        card.isInvalidGroup = false;
    }

    // Updates visual state of all table groups based on their validity
    updateInvalidGroupStates() {
        // Don't update flashing states during temporary operations
        if (this.scene.gameLogic?.isProcessingMove) {
            return;
        }
        
        // Check all groups and update their invalid state
        this.scene.tableCards.forEach((group, groupIndex) => {
            const isValid = this.scene.cardSystem.checkValidGroup(group);
            
            group.forEach(card => {
                if (!isValid && !card.isInvalidGroup) {
                    // Group became invalid - start flashing red
                    this.showGroupFlash([card], 0xff0000, true);
                } else if (isValid && card.isInvalidGroup) {
                    // Group became valid - stop flashing
                    this.stopGroupFlash(card);
                }
            });
        });
    }

    // Updates positions of all cards in a group to maintain proper spacing
    updateGroupCardPositions(group) {
        const { colWidth } = this.getTableDimensions();
        const startX = group[0]?.sprite?.x || 0;
        const startY = group[0]?.sprite?.y || 0;

        group.forEach((card, index) => {
            if (card.sprite) {
                card.sprite.x = startX + index * colWidth;
                card.sprite.y = startY;
                card.sprite.setDepth(index);
            }
        });
    }

    // Moves selected cards from hand to table as a new group
    moveSelectedCardsToTable(currentHand) {
        // Before adding a new group, preserve the current positions of all existing groups
        this.preserveExistingGroupPositions();
        
        // First, destroy any sprites associated with the cards being played
        this.scene.cardsSelected.forEach((card) => {
            if (card.sprite) {
                // Clear any tweens running on this sprite
                this.scene.tweens.killTweensOf(card.sprite);
                // Destroy the sprite
                card.sprite.destroy();
                card.sprite = null;
            }
        });
        
        const newGroup = [];
        this.scene.cardsSelected.forEach((card) => {
            this.scene.handManager.removeCardFromHand(currentHand, card);
            card.table = true;
            
            // Clear any existing custom position to prevent positioning conflicts
            delete card.customPosition;
            
            // Clear mustReturnToTable flag since card has successfully returned to table
            if (card.mustReturnToTable) {
                delete card.mustReturnToTable;
            }
            
            // Don't overwrite originalPosition here - it should be preserved for reset functionality
            // The originalPosition will be updated when the turn ends in updateOriginalPositions()
            newGroup.push(card);
        });
        
        // Sort the new group before adding it to the table
        this.sortGroup(newGroup);
        
        this.scene.tableCards.push(newGroup);
        this.scene.placedCards = true;
        
        // Add poof effects for each card after they're placed on table
        // Need to delay this slightly to ensure sprites are created
        this.scene.time.delayedCall(50, () => {
            newGroup.forEach((card) => {
                if (card.sprite) {
                    this.scene.animationSystem.poofEffect(card.sprite.x, card.sprite.y);
                }
            });
        });
    }

    // Removes a specific card from a hand array
    removeCardFromHand(hand, card) {
        const index = hand.indexOf(card);
        if (index !== -1) {
            hand.splice(index, 1);
        }
    }

    // Checks if all groups on the table are valid according to game rules
    checkTableValidity() {
        return this.scene.tableCards.every((group) =>
            this.scene.cardSystem.checkValidGroup(group)
        );
    }

    // Updates and resorts a group after modifications, then repositions cards
    updateAndSortGroup(group) {
        this.sortGroup(group);
        const currentX = group[0].sprite.x;
        const currentY = group[0].sprite.y;
        const cardWidth = 50;
        this.setGroupCardPositions(group, currentX, currentY, cardWidth);
    }

    // Sorts cards within a group based on whether it's a set, run, or mixed group
    sortGroup(group) {
        if (!group || group.length < 2) return;
        
        // Determine if this is a set or run
        const uniqueRanks = new Set(group.map(card => card.card.rank));
        const uniqueSuits = new Set(group.map(card => card.card.suit));
        
        if (uniqueRanks.size === 1) {
            // This is a set - sort by alternating colors
            this.sortByAlternatingColors(group);
        } else if (uniqueSuits.size === 1) {
            // This is a run - sort by rank order, handling Ace positioning
            this.sortRunByRank(group);
        } else {
            // Mixed group - sort by rank first, then by suit
            group.sort((a, b) => {
                const rankDiff = this.scene.cardSystem.getRankValue(a.card.rank) - this.scene.cardSystem.getRankValue(b.card.rank);
                if (rankDiff !== 0) return rankDiff;
                const suitOrder = ["diamond", "spade", "heart", "club"];
                return suitOrder.indexOf(a.card.suit) - suitOrder.indexOf(b.card.suit);
            });
        }
    }

    // Sorts a run by rank order, handling Ace as either high or low
    sortRunByRank(group) {
        // First, determine if this is a high-ace run (contains ace and king/queen)
        const hasAce = group.some(card => card.card.rank === "A");
        const hasKing = group.some(card => card.card.rank === "K");
        const hasQueen = group.some(card => card.card.rank === "Q");
        
        if (hasAce && (hasKing || hasQueen)) {
            // This might be a high-ace run, let's check the lowest non-ace card
            const nonAceCards = group.filter(card => card.card.rank !== "A");
            const lowestNonAce = Math.min(...nonAceCards.map(card => this.scene.cardSystem.getRankValue(card.card.rank)));
            
            // If the lowest non-ace card is 10 or higher, treat ace as high
            if (lowestNonAce >= 10) {
                group.sort((a, b) => {
                    const aValue = a.card.rank === "A" ? 14 : this.scene.cardSystem.getRankValue(a.card.rank);
                    const bValue = b.card.rank === "A" ? 14 : this.scene.cardSystem.getRankValue(b.card.rank);
                    return aValue - bValue;
                });
                return;
            }
        }
        
        // Default sorting - Ace as low (A=1)
        group.sort((a, b) => {
            return this.scene.cardSystem.getRankValue(a.card.rank) - this.scene.cardSystem.getRankValue(b.card.rank);
        });
    }

    // Sorts cards in a set by alternating red and black colors for visual appeal
    sortByAlternatingColors(group) {
        // For sets (same rank), sort by alternating colors
        const redCards = group.filter(
            (card) => card.card.suit === "heart" || card.card.suit === "diamond"
        );
        const blackCards = group.filter(
            (card) => card.card.suit === "spade" || card.card.suit === "club"
        );

        // Sort within each color group by suit preference
        // For red: diamonds before hearts, for black: spades before clubs
        redCards.sort((a, b) => {
            const redOrder = ["diamond", "heart"];
            return redOrder.indexOf(a.card.suit) - redOrder.indexOf(b.card.suit);
        });
        
        blackCards.sort((a, b) => {
            const blackOrder = ["spade", "club"];
            return blackOrder.indexOf(a.card.suit) - blackOrder.indexOf(b.card.suit);
        });

        const sortedGroup = [];
        let redIndex = 0;
        let blackIndex = 0;
        
        // Determine the starting color based on which has more cards or preference
        let startWithRed = redCards.length > 0;
        
        // If both colors have cards, ensure perfect alternation is possible
        if (redCards.length > 0 && blackCards.length > 0) {
            // Calculate if we can achieve perfect alternation
            const maxDifference = Math.abs(redCards.length - blackCards.length);
            
            // If difference is more than 1, we can't perfectly alternate
            if (maxDifference > 1) {
                // Start with the color that has more cards to minimize clustering
                startWithRed = redCards.length >= blackCards.length;
            }
        }
        
        let useRed = startWithRed;
        
        // Build the alternating sequence
        for (let i = 0; i < group.length; i++) {
            if (useRed && redIndex < redCards.length) {
                // Use red card
                sortedGroup.push(redCards[redIndex]);
                redIndex++;
                useRed = false; // Next should be black
            } else if (!useRed && blackIndex < blackCards.length) {
                // Use black card
                sortedGroup.push(blackCards[blackIndex]);
                blackIndex++;
                useRed = true; // Next should be red
            } else if (redIndex < redCards.length) {
                // No black cards available, must use red
                sortedGroup.push(redCards[redIndex]);
                redIndex++;
                // Don't change useRed since we couldn't alternate
            } else if (blackIndex < blackCards.length) {
                // No red cards available, must use black
                sortedGroup.push(blackCards[blackIndex]);
                blackIndex++;
                // Don't change useRed since we couldn't alternate
            }
        }

        // Reassign sorted cards to the original group array
        for (let i = 0; i < group.length; i++) {
            group[i] = sortedGroup[i];
        }
    }

    // Sets positions for all cards in a group with proper spacing and depth
    setGroupCardPositions(group, startX, startY, cardWidth = 60) {
        group.forEach((card, index) => {
            if (card.sprite) {
                const targetX = startX + index * cardWidth;
                const targetY = startY;
                
                // Update sprite position
                card.sprite.x = targetX;
                card.sprite.y = targetY;
                card.sprite.baseY = targetY; // Update baseY for wave effect
                card.sprite.setDepth(index);
                
                // Store custom position to preserve spacing - ensures all cards stay together
                card.customPosition = {
                    x: targetX,
                    y: targetY
                };
            }
        });
    }

    // Finds an available position on the table for a new group without overlapping existing groups
    findAvailableGroupPosition(groupLength) {
        const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();
        let currentX = minX;
        let currentY = minY;
        let placed = false;

        // Gather bounding boxes of all existing groups that have positions
        const groupBounds = this.scene.tableCards.map(group => {
            if (group.length === 0) return null;
            
            // Check if group has custom positions
            const firstCard = group[0];
            let groupX, groupY;
            
            if (firstCard.customPosition) {
                groupX = firstCard.customPosition.x;
                groupY = firstCard.customPosition.y;
            } else if (firstCard.sprite) {
                groupX = firstCard.sprite.x;
                groupY = firstCard.sprite.y;
            } else {
                return null; // Group has no position yet
            }
            
            return {
                x: groupX - (colWidth / 2), // Account for card center origin
                y: groupY - (rowHeight / 2),
                width: group.length * colWidth,
                height: rowHeight
            };
        }).filter(bounds => bounds !== null);

        while (!placed) {
            // Proposed bounding box for the new group
            const newBounds = {
                x: currentX - (colWidth / 2),
                y: currentY - (rowHeight / 2),
                width: groupLength * colWidth,
                height: rowHeight
            };

            // Check for overlap with any existing group
            const overlaps = groupBounds.some(bounds =>
                bounds.x < newBounds.x + newBounds.width &&
                bounds.x + bounds.width > newBounds.x &&
                bounds.y < newBounds.y + newBounds.height &&
                bounds.y + bounds.height > newBounds.y
            );

            if (!overlaps) {
                return { x: currentX, y: currentY };
            }

            // Move to next row if not enough space in this row
            currentX += colWidth * groupLength + colWidth * 2;
            if (currentX + groupLength * colWidth > maxX) {
                currentX = minX;
                currentY += rowHeight;
            }
        }
    }

    // Adjusts card positions within a group after new cards are added, maintaining proper spacing
    adjustGroupPositionsForNewCards(group, currentPositions) {
        if (!group || group.length === 0) return;
        
        // Find the base position (leftmost card's position)
        const baseX = Math.min(...currentPositions.map(pos => pos.x));
        const baseY = currentPositions[0].y;
        
        // Set positions for all cards in the sorted group
        const { colWidth } = this.getTableDimensions();
        group.forEach((card, index) => {
            if (card.sprite) {
                const targetX = baseX + index * colWidth;
                const targetY = baseY;
                
                // Update sprite position
                card.sprite.x = targetX;
                card.sprite.y = targetY;
                card.sprite.baseY = targetY; // Update baseY for wave effect
                card.sprite.setDepth(index);
                
                // Update custom position to ensure all cards stay together
                card.customPosition = {
                    x: targetX,
                    y: targetY
                };
            }
        });
   }

    // Ensures all groups have proper card spacing to prevent overlap
    ensureProperGroupSpacing() {
        const { colWidth } = this.getTableDimensions();
        
        // First, ensure proper spacing within each group
        this.scene.tableCards.forEach(group => {
            if (group.length > 1) {
                // Find the leftmost card position as the reference point
                let baseX = group[0]?.sprite?.x || 0;
                let baseY = group[0]?.sprite?.y || 0;
                
                // If the group has any custom position, use it as base
                const cardWithPosition = group.find(card => card.customPosition);
                if (cardWithPosition) {
                    baseX = cardWithPosition.customPosition.x;
                    baseY = cardWithPosition.customPosition.y;
                } else if (group[0]?.sprite) {
                    // Use the first card's current sprite position
                    baseX = group[0].sprite.x;
                    baseY = group[0].sprite.y;
                }
                
                // Apply proper spacing to all cards in the group
                group.forEach((card, cardIndex) => {
                    if (card.sprite) {
                        const targetX = baseX + (cardIndex * colWidth);
                        const targetY = baseY;
                        
                        // Update sprite position
                        card.sprite.x = targetX;
                        card.sprite.y = targetY;
                        card.sprite.baseY = targetY;
                        
                        // Update custom position to maintain this spacing
                        card.customPosition = {
                            x: targetX,
                            y: targetY
                        };
                    }
                });
            }
        });
        
        // Second, check for and resolve group overlaps
        this.resolveGroupOverlaps();
    }
    
    // Resolves overlaps between different groups by repositioning overlapping groups
    resolveGroupOverlaps() {
        const { colWidth } = this.getTableDimensions();
        const OVERLAP_THRESHOLD = colWidth * 0.8; // Groups are considered overlapping if closer than this
        
        for (let i = 0; i < this.scene.tableCards.length; i++) {
            const group1 = this.scene.tableCards[i];
            if (group1.length === 0) continue;
            
            for (let j = i + 1; j < this.scene.tableCards.length; j++) {
                const group2 = this.scene.tableCards[j];
                if (group2.length === 0) continue;
                
                // Get the bounds of each group
                const group1Bounds = this.getGroupBounds(group1);
                const group2Bounds = this.getGroupBounds(group2);
                
                // Check if groups overlap
                if (this.doGroupsOverlap(group1Bounds, group2Bounds, OVERLAP_THRESHOLD)) {
                    // Reposition the second group to an available position
                    const availablePosition = this.findAvailableGroupPosition(group2.length);
                    this.repositionGroup(group2, availablePosition.x, availablePosition.y);
                }
            }
        }
    }
    
    // Gets the bounds of a group (leftmost and rightmost card positions)
    getGroupBounds(group) {
        if (group.length === 0) return null;
        
        const { colWidth } = this.getTableDimensions();
        const firstCard = group[0];
        let baseX = firstCard?.sprite?.x || firstCard?.customPosition?.x || 0;
        let baseY = firstCard?.sprite?.y || firstCard?.customPosition?.y || 0;
        
        return {
            minX: baseX,
            maxX: baseX + (group.length - 1) * colWidth,
            minY: baseY,
            maxY: baseY + 92 * 2, // Card height * scale
            centerX: baseX + (group.length - 1) * colWidth / 2,
            centerY: baseY + 92
        };
    }
    
    // Checks if two groups overlap
    doGroupsOverlap(bounds1, bounds2, threshold) {
        if (!bounds1 || !bounds2) return false;
        
        // Check horizontal overlap
        const horizontalOverlap = !(bounds1.maxX < bounds2.minX - threshold || 
                                   bounds2.maxX < bounds1.minX - threshold);
        
        // Check vertical overlap
        const verticalOverlap = !(bounds1.maxY < bounds2.minY - threshold || 
                                 bounds2.maxY < bounds1.minY - threshold);
        
        return horizontalOverlap && verticalOverlap;
    }
    
    // Repositions a group to a new position
    repositionGroup(group, newX, newY) {
        const { colWidth } = this.getTableDimensions();
        
        group.forEach((card, cardIndex) => {
            const targetX = newX + (cardIndex * colWidth);
            const targetY = newY;
            
            if (card.sprite) {
                card.sprite.x = targetX;
                card.sprite.y = targetY;
                card.sprite.baseY = targetY;
            }
            
            // Update custom position
            card.customPosition = {
                x: targetX,
                y: targetY
            };
        });
    }

    // Special handler for tutorial card clicks
    handleTutorialCardClick(card, group, groupIndex) {
        const cardRank = card.card ? card.card.rank : card.rank;
        const cardSuit = card.card ? card.card.suit : card.suit;
        
        // Step 7: Allow taking the 9 of hearts from the table
        if (this.scene.tutorialStep === 7 && cardRank === "9" && cardSuit === "heart") {
            // Remove the clicked card from the table group
            const cardIndex = group.findIndex(c => {
                const cRank = c.card ? c.card.rank : c.rank;
                const cSuit = c.card ? c.card.suit : c.suit;
                return cRank === cardRank && cSuit === cardSuit;
            });
            if (cardIndex !== -1) {
                group.splice(cardIndex, 1);
                
                // Add the card to player's hand
                this.scene.playerHands[0].push(card);
                card.table = false; // Mark as not on table anymore
                
                // Refresh displays
                this.scene.refreshDisplays();
                
                // Check tutorial progression
                this.scene.checkTutorialProgression();
                
                // Play sound
                this.scene.audioSystem.playCardSelect();
                
                return true;
            }
        }
        
        // Step 9: Allow placing the 9 of spades back into the existing group
        if (this.scene.tutorialStep === 9) {
            console.log("Step 9: Tutorial card click detected");
            console.log("cardsSelected:", this.scene.cardsSelected);
            console.log("selectedCards:", this.scene.selectedCards);
            
            // Check both possible selected card arrays for 9 of spades
            const selectedCardsArray = this.scene.cardsSelected.length > 0 ? this.scene.cardsSelected : this.scene.selectedCards;
            const has9OfSpades = selectedCardsArray.some(card => {
                const rank = card.card ? card.card.rank : card.rank;
                const suit = card.card ? card.card.suit : card.suit;
                console.log("Checking card:", rank, "of", suit);
                return rank === "9" && suit === "spade";
            });
            
            console.log("Has 9 of spades selected:", has9OfSpades);
            
            if (has9OfSpades) {
                // Check if this group can accept the 9 of spades
                const testGroup = [...group, ...selectedCardsArray];
                const result = this.scene.cardSystem.checkValidGroup(testGroup);
                
                console.log("Group would be valid:", result);
                console.log("Test group:", testGroup.map(c => `${c.card.rank} of ${c.card.suit}`));
                
                if (result) {
                    // Move selected cards from hand to this table group
                    selectedCardsArray.forEach((selectedCard) => {
                        this.scene.handManager.removeCardFromHand(
                            this.scene.handManager.getCurrentHand(), 
                            selectedCard
                        );
                        group.push(selectedCard);
                        selectedCard.table = true;
                    });
                    
                    // Clear both selected arrays
                    this.scene.cardsSelected = [];
                    this.scene.selectedCards = [];
                    this.scene.placedCards = true;
                    
                    // Refresh displays
                    this.scene.refreshDisplays();
                    
                    // Check tutorial progression
                    this.scene.checkTutorialProgression();
                    
                    // Play sound
                    this.scene.audioSystem.playCardSelect();
                    
                    console.log("Step 9: Card placement completed");
                    return true;
                }
            }
        }
        
        return false;
    }
}
