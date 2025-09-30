// Load.js - Handles asset loading and initial game setup

class Load extends Phaser.Scene {
	constructor() {
		super("loadScene");
	}

	init() { 
		// Add comprehensive error handling for asset loading
		this.load.on('loaderror', (file) => {
			console.error('Failed to load file:', file.src);
			console.error('File key:', file.key);
			console.error('File type:', file.type);
		});
		
		this.load.on('complete', () => {
			console.log('All assets loaded successfully');
		});
		
		this.load.on('progress', (progress) => {
			console.log('Loading progress:', Math.round(progress * 100) + '%');
		});
	}

	// Loads all game assets (sprites, images, sounds)
	preload() {
		// Use relative paths from the index.html location
		// Since Electron loads from the root directory, we can use relative paths
		
		//load background
		this.load.spritesheet("play_background", "assets/SpriteSheets/Million_CG.png", {
			frameWidth: 1688,
			frameHeight: 780,
			startFrame: 0,
			endFrame: 0
		});
		
		//load card spritesheet
		this.load.spritesheet("card_deck", "assets/SpriteSheets/Card_Deck-Sheet.png", {
			frameWidth: 60,
			frameHeight: 92,
			startFrame: 0,
			endFrame: 53,
		});

		this.load.spritesheet("end_turn", "assets/SpriteSheets/End_Turn.png", {
			frameWidth: 48,
			frameHeight: 16,
			startFrame: 0,
			endFrame: 2,
		});

		this.load.spritesheet("restart", "assets/SpriteSheets/Restart.png", {
			frameWidth: 20,
			frameHeight: 23,
			startFrame: 0,
			endFrame: 2,
		});

		this.load.spritesheet("sort_rank", "assets/SpriteSheets/Sort_Rank.png", {
			frameWidth: 48,
			frameHeight: 16,
			startFrame: 0,
			endFrame: 2,
		});

		this.load.spritesheet("sort_suit", "assets/SpriteSheets/Sort_Suit.png", {
			frameWidth: 48,
			frameHeight: 16,
			startFrame: 0,
			endFrame: 2,
		});

		this.load.image("poof", "assets/Particles/Pixel.png");

		// Load audio files
		this.load.audio("african1", "assets/Sounds/MP3/African1.mp3");
		this.load.audio("african2", "assets/Sounds/MP3/African2.mp3");
		this.load.audio("african3", "assets/Sounds/MP3/African3.mp3");
		this.load.audio("african4", "assets/Sounds/MP3/African4.mp3");
		this.load.audio("wood_block1", "assets/Sounds/MP3/Wood Block1.mp3");
	}

	// Creates animations and sets up initial configurations
	create() {
		try {
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
			
			// Transition to title scene after assets are loaded
			this.scene.start("titleScene");
		} catch (error) {
			console.error("Error in Load scene create method:", error);
			// Try to continue anyway
			this.scene.start("titleScene");
		}
	}

	// No longer needed - transition happens in create()
	update() {
		// Empty update method
	}
}
