// TableManager.js - Handles table display, card placement, and validation

class TableManager {
    constructor(scene) {
        this.scene = scene;
    }

    displayTable() {
        this.clearPreviousTableSprites();
        const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();
        let currentX = minX;
        let currentY = minY;

        this.scene.tableSprites = [];
        this.scene.tableCards.forEach((group, groupIndex) => {
            // Check if this group has custom positions (from dragging)
            const hasCustomPositions = group.some(card => card.customPosition);
            
            if (!hasCustomPositions) {
                // Only apply grid layout if group doesn't have custom positions
                if (currentX + group.length * colWidth > maxX) {
                    currentX = minX;
                    currentY += rowHeight;
                }
                this.displayTableGroup(group, groupIndex, currentX, currentY);
                currentX += group.length * colWidth + colWidth * 2;
            } else {
                // Preserve custom positions - just recreate sprites at their existing positions
                this.displayTableGroupAtCustomPositions(group, groupIndex);
            }
        });
        
        // After displaying, check for invalid groups and apply red flashing
        this.updateInvalidGroupStates();
    }

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

    getTableDimensions() {
        const minX = 50;
        const minY = 150;
        const maxX = this.scene.scale.width - 150; // More room for dragging
        const maxY = this.scene.scale.height - 250; // More room above hand
        const rowHeight = 120;
        const colWidth = 60;
        return { minX, minY, maxX, maxY, rowHeight, colWidth };
    }

    getDragBoundaries() {
        // Allow dragging anywhere on screen with just a 20-pixel border
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
            // Pass group and groupIndex so any card can trigger group actions
            this.addCardDragInteractivity(cardSprite, card, group, groupIndex);
        });
    }

    displayTableGroupAtCustomPositions(group, groupIndex) {
        group.forEach((card, cardIndex) => {
            const frameIndex = this.scene.cardSystem.getCardFrameIndex(card);
            
            // Use custom position if available, otherwise fall back to a default
            const cardX = card.customPosition ? card.customPosition.x : 50 + cardIndex * 60;
            const cardY = card.customPosition ? card.customPosition.y : 150;

            // Clean up existing sprite if it exists
            if (card.sprite) {
                this.scene.tweens.killTweensOf(card.sprite);
                card.sprite.destroy();
                card.sprite = null;
            }

            // Create new sprite at custom position
            const cardSprite = this.createCardSpriteForTable(
                card,
                frameIndex,
                cardX,
                cardY,
                cardIndex,
                60 // colWidth
            );

            card.sprite = cardSprite;
            this.scene.tableSprites.push(cardSprite);
            // Pass group and groupIndex so any card can trigger group actions
            this.addCardDragInteractivity(cardSprite, card, group, groupIndex);
        });
    }

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

    addCardDragInteractivity(cardSprite, card, group, groupIndex) {
        let isDragging = false;
        let pointerDownTime = 0;
        let groupStartPositions = [];
        const DRAG_THRESHOLD = 15; // pixels to distinguish between click and drag

        // Handle pointer down - start tracking for drag vs click
        cardSprite.on("pointerdown", (pointer, localX, localY, event) => {
            if (this.scene.drawnCard) {
                console.log("Cannot interact with cards after drawing");
                return;
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
            const { minX, minY, maxX, maxY } = this.getDragBoundaries();
            
            group.forEach((groupCard, index) => {
                if (groupCard.sprite && groupStartPositions[index]) {
                    // Calculate new position
                    let newX = groupStartPositions[index].x + deltaX;
                    let newY = groupStartPositions[index].y + deltaY;
                    
                    // Constrain to drag boundaries (20-pixel border from screen edges)
                    newX = Math.max(minX, Math.min(newX, maxX));
                    newY = Math.max(minY, Math.min(newY, maxY));
                    
                    groupCard.sprite.x = newX;
                    groupCard.sprite.y = newY;
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

    handleCardClickOnTable(card, group, groupIndex) {
        if (this.scene.drawnCard) {
            return;
        }

        if (this.scene.cardsSelected.length > 0) {
            // Check if selected cards from hand can be added to this group
            const testGroup = [...group, ...this.scene.cardsSelected];
            const result = this.scene.cardSystem.checkValidGroup(testGroup);
            
            if (result) {
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
                    selectedCard.originalPosition = { 
                        type: "table", 
                        groupIndex, 
                        cardIndex: group.length - 1 
                    };
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
                console.log("Cards added to table group");
                
                // Show green flash for successful addition
                this.showGroupFlash(group, 0x00ff00);
                
                // Add poof effect for newly added cards (after display refresh so sprites exist)
                cardsToAddEffects.forEach((selectedCard) => {
                    if (selectedCard.sprite) {
                        this.scene.animationSystem.poofEffect(selectedCard.sprite.x, selectedCard.sprite.y);
                    }
                });
            } else {
                console.log("Invalid group combination");
                // Show red flash for invalid addition
                this.showGroupFlash(group, 0xff0000);
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
                card.originalPosition = { type: "hand" };
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
                        // Show red flash for invalid remaining group (continuous)
                        console.log("Remaining group is now invalid - flashing red continuously");
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
                console.log(`Moved ${card.card.suit} ${card.card.rank} back to hand`);
            }
        }
    }

    preserveGroupPositions(group, remainingPositions) {
        // Store positions that we want to preserve
        this.pendingPreservedPositions = remainingPositions;
    }

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

    showGroupFlash(group, color, continuous = false) {
        group.forEach(card => {
            if (card.sprite) {
                // Stop any existing flash animation
                this.stopGroupFlash(card);
                
                if (continuous) {
                    // Store original values for proper cycling
                    const originalAlpha = card.sprite.alpha;
                    card.sprite.originalAlpha = originalAlpha;
                    
                    // Start continuous smooth breathing effect for invalid groups
                    card.sprite.flashTween = this.scene.tweens.addCounter({
                        from: 0,
                        to: 100,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut',
                        onUpdate: tween => {
                            // Calculate smooth interpolation between white and target color
                            const t = tween.getValue() / 100;
                            const r = Phaser.Display.Color.Interpolate.ColorWithColor(
                                Phaser.Display.Color.ValueToColor(0xffffff),
                                Phaser.Display.Color.ValueToColor(color),
                                1,
                                t
                            );
                            card.sprite.setTint(Phaser.Display.Color.GetColor(r.r, r.g, r.b));
                            // Also animate alpha for additional breathing effect
                            card.sprite.setAlpha(originalAlpha - (t * 0.4));
                        }
                    });
                    // Mark as invalid for tracking
                    card.isInvalidGroup = true;
                } else {
                    // One-time smooth flash
                    const originalAlpha = card.sprite.alpha;
                    
                    // Create a smooth flash sequence using color interpolation
                    this.scene.tweens.addCounter({
                        from: 0,
                        to: 100,
                        duration: 200,
                        yoyo: true,
                        repeat: 1,
                        ease: 'Power2.easeInOut',
                        onUpdate: tween => {
                            // Calculate smooth interpolation between white and target color
                            const t = tween.getValue() / 100;
                            const r = Phaser.Display.Color.Interpolate.ColorWithColor(
                                Phaser.Display.Color.ValueToColor(0xffffff),
                                Phaser.Display.Color.ValueToColor(color),
                                1,
                                t
                            );
                            card.sprite.setTint(Phaser.Display.Color.GetColor(r.r, r.g, r.b));
                            // Also animate alpha
                            card.sprite.setAlpha(originalAlpha - (t * 0.3));
                        },
                        onComplete: () => {
                            // Restore original state
                            card.sprite.setAlpha(originalAlpha);
                            card.sprite.clearTint();
                        }
                    });
                }
            }
        });
    }

    stopGroupFlash(card) {
        if (card.sprite && card.sprite.flashTween) {
            card.sprite.flashTween.destroy();
            card.sprite.flashTween = null;
            
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

    updateInvalidGroupStates() {
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

    moveSelectedCardsToTable(currentHand) {
        const newGroup = [];
        this.scene.cardsSelected.forEach((card) => {
            this.scene.handManager.removeCardFromHand(currentHand, card);
            card.table = true;
            card.originalPosition = { type: "table", groupIndex: this.scene.tableCards.length, cardIndex: newGroup.length };
            newGroup.push(card);
        });
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

    removeCardFromHand(hand, card) {
        const index = hand.indexOf(card);
        if (index !== -1) {
            hand.splice(index, 1);
        }
    }

    checkTableValidity() {
        return this.scene.tableCards.every((group) =>
            this.scene.cardSystem.checkValidGroup(group)
        );
    }

    updateAndSortGroup(group) {
        this.sortGroup(group);
        const currentX = group[0].sprite.x;
        const currentY = group[0].sprite.y;
        const cardWidth = 50;
        this.setGroupCardPositions(group, currentX, currentY, cardWidth);
    }

    sortGroup(group) {
        if (!group || group.length < 2) return;
        
        // Determine if this is a set or run
        const uniqueRanks = new Set(group.map(card => card.card.rank));
        const uniqueSuits = new Set(group.map(card => card.card.suit));
        
        if (uniqueRanks.size === 1) {
            // This is a set - sort by suit order
            const suitOrder = ["diamond", "spade", "heart", "club"];
            group.sort((a, b) => {
                return suitOrder.indexOf(a.card.suit) - suitOrder.indexOf(b.card.suit);
            });
        } else if (uniqueSuits.size === 1) {
            // This is a run - sort by rank order
            group.sort((a, b) => {
                return this.scene.cardSystem.getRankValue(a.card.rank) - this.scene.cardSystem.getRankValue(b.card.rank);
            });
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

    sortByAlternatingColors(group) {
        // Sort the group by rank first
        group.sort(
            (a, b) => this.scene.cardSystem.getRankValue(a.card.rank) - this.scene.cardSystem.getRankValue(b.card.rank)
        );

        const redCards = group.filter(
            (card) => card.card.suit === "heart" || card.card.suit === "diamond"
        );
        const blackCards = group.filter(
            (card) => card.card.suit === "spade" || card.card.suit === "club"
        );

        const sortedGroup = [];
        let useRed = redCards.length >= blackCards.length; // Start with the color group that has more cards

        while (redCards.length > 0 || blackCards.length > 0) {
            if (useRed && redCards.length > 0) {
                sortedGroup.push(redCards.shift());
            } else if (!useRed && blackCards.length > 0) {
                sortedGroup.push(blackCards.shift());
            }
            useRed = !useRed; // Alternate color for the next card
        }

        // Reassign sorted cards to the original group array
        for (let i = 0; i < group.length; i++) {
            group[i] = sortedGroup[i];
        }
    }

    setGroupCardPositions(group, startX, startY, cardWidth) {
        group.forEach((card, index) => {
            if (card.sprite) {
                card.sprite.x = startX + index * cardWidth;
                card.sprite.y = startY;
                card.sprite.baseY = startY; // Update baseY for wave effect
                card.sprite.setDepth(index);
            }
        });
    }

    findAvailableGroupPosition(groupLength) {
        const { minX, minY, maxX, rowHeight, colWidth } = this.getTableDimensions();
        let currentX = minX;
        let currentY = minY;
        let placed = false;

        // Gather bounding boxes of all existing groups
        const groupBounds = this.scene.tableCards.map(group => {
            return {
                x: group[0]?.sprite?.x ?? 0,
                y: group[0]?.sprite?.y ?? 0,
                width: group.length * colWidth,
                height: rowHeight
            };
        });

        while (!placed) {
            // Proposed bounding box for the new group
            const newBounds = {
                x: currentX,
                y: currentY,
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

    adjustGroupPositionsForNewCards(group, currentPositions) {
        if (!group || group.length === 0) return;
        
        // Find the base position (leftmost card's position)
        const baseX = Math.min(...currentPositions.map(pos => pos.x));
        const baseY = currentPositions[0].y;
        
        // Set positions for all cards in the sorted group
        const { colWidth } = this.getTableDimensions();
        group.forEach((card, index) => {
            if (card.sprite) {
                card.sprite.x = baseX + index * colWidth;
                card.sprite.y = baseY;
                card.sprite.baseY = baseY; // Update baseY for wave effect
                card.sprite.setDepth(index);
            }
        });
    }
}
