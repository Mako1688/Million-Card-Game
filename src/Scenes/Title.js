// Title.js - Main menu scene with game title and start functionality

class Title extends Phaser.Scene {
  constructor() {
    super("titleScene");
  }

  init() { }

  preload() { }

  // Creates the title screen with game name and start functionality
  create() {
    // Initialize audio system
    this.audioSystem = new AudioSystem(this);
    
    //add any button to start text
    // Menu config
    let menuConfig = {
      fontFamily: "PressStart2P", // Restore original font
      fontSize: "40px",
      backgroundColor: "#000000",
      color: "#FFFFFF",
      align: "center",
      padding: {
        top: 5,
        bottom: 5,
      },
      fixedWidth: 0,
    };
    this.add
      .text(
        centerX,
        h / 3,
        "MILLION CARD GAME\nDedicated to Lois <3",
        menuConfig
      )
      .setOrigin(0.5, 0.5);
    this.add
      .text(centerX, h / 3 + 100, "CLICK the CARD to START", menuConfig)
      .setOrigin(0.5, 0.5);

    // Settings button
    const settingsButton = this.add.text(centerX, h / 3 + 180, "SETTINGS", {
      fontFamily: "PressStart2P", // Restore original font
      fontSize: "24px",
      backgroundColor: "#444444",
      color: "#FFFFFF",
      align: "center",
      padding: {
        x: 15,
        y: 8,
      }
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    // Settings button interaction
    settingsButton.on('pointerover', () => {
      settingsButton.setStyle({ backgroundColor: '#666666' });
    });

    settingsButton.on('pointerout', () => {
      settingsButton.setStyle({ backgroundColor: '#444444' });
    });

    settingsButton.on('pointerdown', () => {
      if (this.audioSystem) {
        this.audioSystem.playMenuButton();
      }
      this.scene.start("settingsScene", { callingScene: "titleScene" });
    });

    this.card = this.add
      .sprite(centerX, (h / 4) * 3 + 10, "card_deck", 53)
      .setOrigin(0.5, 0.5)
      .setScale(2);

    // Make the card clickable
    this.card.setInteractive();

    // Add pointerover event listener for hovering
    this.card.on("pointerover", () => {
      // Scale the card slightly larger
      this.tweens.add({
        targets: this.card,
        scaleX: 2.1,
        scaleY: 2.1,
        duration: 200,
        ease: "Linear",
      });
    });

    // Add pointerout event listener for when hovering ends
    this.card.on("pointerout", () => {
      // Restore the card to its original scale
      this.tweens.add({
        targets: this.card,
        scaleX: 2,
        scaleY: 2,
        duration: 200,
        ease: "Linear",
      });
    });

    // Listen for pointerdown event on the card
    this.card.on("pointerdown", () => {
      // Play menu button sound
      if (this.audioSystem) {
        this.audioSystem.playMenuButton();
      }
      // Code to execute when the card is clicked
      console.log("Card clicked!");
      this.scene.start("playScene");
    });
  }

  update() { }
}
