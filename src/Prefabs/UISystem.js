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
        this.scene.validationBox = this.scene.add
            .rectangle(centerX, centerY + 100, 200, 100, 0x00ff00)
            .setOrigin(0.5)
            .setInteractive()
            .setVisible(false);
        this.scene.validationBox.on("pointerdown", () => {
            this.scene.gameLogic.handleValidPlay();
            this.scene.turnValid = true;
        });
    }

    // Adds interactive behavior to all UI buttons and elements
    addInteractivity() {
        this.addButtonInteractivity(
            this.scene.endTurnButton,
            this.scene.gameLogic.endTurn.bind(this.scene.gameLogic),
            this.scene.handManager.displayHand.bind(this.scene.handManager)
        );
        this.addButtonInteractivity(
            this.scene.restart, 
            this.scene.gameLogic.resetHandToTable.bind(this.scene.gameLogic)
        );
        this.addDeckInteractivity(this.scene.deckSprite);
        this.addButtonInteractivity(
            this.scene.sortRank,
            this.scene.handManager.sortRankHand.bind(this.scene.handManager),
            this.scene.handManager.displayHand.bind(this.scene.handManager)
        );
        this.addButtonInteractivity(
            this.scene.sortSuit,
            this.scene.handManager.sortSuitHand.bind(this.scene.handManager),
            this.scene.handManager.displayHand.bind(this.scene.handManager)
        );
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
            this.scene.cardSystem.drawCard();
            this.scene.handManager.displayHand();
            // Remove displayTable() call - deck click should not reset table positions
        });
    }

    // Shows or hides the validation box based on selected cards validity
    updateValidationBoxVisibility() {
        const isValid = this.scene.cardSystem.checkValidGroup(this.scene.cardsSelected);
        this.scene.validationBox.setVisible(
            this.scene.cardsSelected.length >= 3 && isValid
        );
        if (this.scene.validationBox.visible) {
            this.positionValidationBox();
        }
    }

    // Positions the validation box at the center of the screen
    positionValidationBox() {
        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;
        this.scene.validationBox.setPosition(centerX, centerY + 100);
    }

    // Updates the turn display text to show which player's turn it is
    displayTurn() {
        if (this.scene.p1Turn) {
            this.scene.turnText.setText("Turn:\nP1");
        } else {
            this.scene.turnText.setText("Turn:\nP2");
        }
    }
}
