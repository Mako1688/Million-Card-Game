// Load.js - Handles asset loading and initial game setup

class Load extends Phaser.Scene {
  constructor() {
    super("loadScene");
  }

  init() { }

  // Loads all game assets (sprites, images, sounds)
  preload() {
    //load background
    this.load.spritesheet("play_background", "./assets/SpriteSheets/Million_CG.png", {
      frameWidth: 1688,
      frameHeight: 780,
      startFrame: 0,
      endFrame: 0
    })
    //load card spritesheet
    this.load.spritesheet("card_deck", "./assets/SpriteSheets/Card_Deck-Sheet.png", {
      frameWidth: 60,
      frameHeight: 92,
      startFrame: 0,
      endFrame: 53,
    });

    this.load.spritesheet("end_turn", "./assets/SpriteSheets/End_Turn.png", {
      frameWidth: 48,
      frameHeight: 16,
      startFrame: 0,
      endFrame: 2,
    });

    this.load.spritesheet("restart", "./assets/SpriteSheets/Restart.png", {
      frameWidth: 20,
      frameHeight: 23,
      startFrame: 0,
      endFrame: 2,
    });

    this.load.spritesheet("sort_rank", "./assets/SpriteSheets/Sort_Rank.png", {
      frameWidth: 48,
      frameHeight: 16,
      startFrame: 0,
      endFrame: 2,
    });

    this.load.spritesheet("sort_suit", "./assets/SpriteSheets/Sort_Suit.png", {
      frameWidth: 48,
      frameHeight: 16,
      startFrame: 0,
      endFrame: 2,
    });

    this.load.image("poof", "./assets/Particles/Pixel.png");
  }

  // Creates animations and sets up initial configurations
  create() {
    //create animations
    this.anims.create({
      key: "shuffle",
      frames: this.anims.generateFrameNumbers("card_deck", {
        start: 0,
        end: 53,
        first: 0,
      }),
      frameRate: 12,
    });
  }

  // Transitions to the title scene
  update() {
    this.scene.start("titleScene");
  }
}
