class Load extends Phaser.Scene {
	constructor() {
		super("loadScene");
	}

	init() { }

	preload() {
		this.loadSprites();
		this.loadAudio();
	}

	loadSprites() {
		this.load.spritesheet("play_background", "assets/SpriteSheets/Million_CG.png", {
			frameWidth: 1688,
			frameHeight: 780,
			startFrame: 0,
			endFrame: 0
		});
		
		this.load.spritesheet("card_deck", "assets/SpriteSheets/Card_Deck.png", {
			frameWidth: 60,
			frameHeight: 92,
			startFrame: 0,
			endFrame: 53
		});

		this.load.spritesheet("end_turn", "assets/SpriteSheets/End_Turn.png", {
			frameWidth: 48,
			frameHeight: 16,
			startFrame: 0,
			endFrame: 2
		});

		this.load.spritesheet("restart", "assets/SpriteSheets/Restart.png", {
			frameWidth: 20,
			frameHeight: 23,
			startFrame: 0,
			endFrame: 2
		});

		this.load.spritesheet("sort_rank", "assets/SpriteSheets/Sort_Rank.png", {
			frameWidth: 48,
			frameHeight: 16,
			startFrame: 0,
			endFrame: 2
		});

		this.load.spritesheet("sort_suit", "assets/SpriteSheets/Sort_Suit.png", {
			frameWidth: 48,
			frameHeight: 16,
			startFrame: 0,
			endFrame: 2
		});

		this.load.image("poof", "assets/Particles/Pixel.png");
	}

	loadAudio() {
		this.load.audio("african1", "assets/Sounds/MP3/African1.mp3");
		this.load.audio("african2", "assets/Sounds/MP3/African2.mp3");
		this.load.audio("african3", "assets/Sounds/MP3/African3.mp3");
		this.load.audio("african4", "assets/Sounds/MP3/African4.mp3");
		this.load.audio("wood_block1", "assets/Sounds/MP3/Wood Block1.mp3");
	}

	create() {
		this.createAnimations();
		this.scene.start("titleScene");
	}

	createAnimations() {
		this.anims.create({
			key: "shuffle",
			frames: this.anims.generateFrameNumbers("card_deck", {
				start: 0,
				end: 53,
				first: 0
			}),
			frameRate: 12
		});
	}

	update() { }
}
