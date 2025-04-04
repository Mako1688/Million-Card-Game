export function createButton(x, y, texture, scale, originX, originY) {
    return this.add
        .sprite(x, y, texture, 0)
        .setOrigin(originX, originY)
        .setScale(scale);
}

export function createDeckSprite(x, y, scale, depth) {
    const deckSprite = this.add
        .sprite(x, y, "card_deck", 53)
        .setOrigin(1, 0.5)
        .setScale(scale)
        .setDepth(depth);
    for (let i = 1; i <= 4; i++) {
        this.add
            .sprite(deckSprite.x - 4 * i, deckSprite.y + 4 * i, "card_deck", 53)
            .setOrigin(1, 0.5)
            .setScale(scale)
            .setDepth(depth - i);
    }
    return deckSprite;
}

export function createValidationBox() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    this.validationBox = this.add
        .rectangle(centerX, centerY + 100, 200, 100, 0x00ff00)
        .setOrigin(0.5)
        .setInteractive()
        .setVisible(false);
    this.validationBox.on("pointerdown", () => {
        this.handleValidPlay();
        this.turnValid = true;
    });
}