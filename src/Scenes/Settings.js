// Settings.js - Settings menu with fullscreen and audio controls

class Settings extends Phaser.Scene {
	constructor() {
		super("settingsScene");
	}

	init(data) {
		// Store the scene that called this settings menu
		this.callingScene = data.callingScene || "titleScene";
	}

	preload() { }

	create() {
		// Initialize audio system
		this.audioSystem = new AudioSystem(this);

		// Add background
		this.add.sprite(0, 0, "play_background", 0).setOrigin(0, 0);

		// Create semi-transparent overlay
		const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0, 0);

		// Settings panel background
		const panelWidth = 600;
		const panelHeight = 500;
		const panelX = centerX - panelWidth / 2;
		const panelY = centerY - panelHeight / 2;

		const settingsPanel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x333333)
			.setStrokeStyle(4, 0xffffff);

		// Title
		this.add.text(centerX, panelY + 50, "SETTINGS", {
			fontFamily: 'PressStart2P',
			fontSize: '32px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 3
		}).setOrigin(0.5);

		// Create settings controls
		this.createFullscreenToggle(centerX, panelY + 120);
		this.createAudioControls(centerX, panelY + 200);
		this.createButtons(centerX, panelY + 380);
	}

	createFullscreenToggle(x, y) {
		// Fullscreen label
		this.add.text(x - 150, y, "Fullscreen:", {
			fontFamily: 'PressStart2P',
			fontSize: '18px',
			color: '#FFFFFF'
		}).setOrigin(0, 0.5);

		// Checkbox background
		const checkboxSize = 30;
		this.fullscreenCheckbox = this.add.rectangle(x + 100, y, checkboxSize, checkboxSize, 0x666666)
			.setStrokeStyle(2, 0xffffff)
			.setInteractive({ useHandCursor: true });

		// Checkmark (initially hidden)
		this.fullscreenCheckmark = this.add.text(x + 100, y, "✓", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#00ff00'
		}).setOrigin(0.5).setVisible(false);

		// Set initial state
		this.isFullscreen = this.scale.isFullscreen;
		this.fullscreenCheckmark.setVisible(this.isFullscreen);

		// Click handler
		this.fullscreenCheckbox.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playButtonPress();
			}
			this.toggleFullscreen();
		});

		// Hover effects
		this.fullscreenCheckbox.on('pointerover', () => {
			this.fullscreenCheckbox.setFillStyle(0x777777);
		});

		this.fullscreenCheckbox.on('pointerout', () => {
			this.fullscreenCheckbox.setFillStyle(0x666666);
		});
	}

	createAudioControls(x, y) {
		// SFX Volume
		this.add.text(x - 260, y, "SFX Volume:", {
			fontFamily: 'PressStart2P',
			fontSize: '14px',
			color: '#FFFFFF'
		}).setOrigin(0, 0.5);

		this.createVolumeSlider(x, y, 'sfx');

		// Music Volume (for future implementation)
		this.add.text(x - 260, y + 60, "Music Volume:", {
			fontFamily: 'PressStart2P',
			fontSize: '14px',
			color: '#FFFFFF'
		}).setOrigin(0, 0.5);

		this.createVolumeSlider(x, y + 60, 'music');
	}

	createVolumeSlider(x, y, type) {
		const sliderWidth = 200;
		const sliderHeight = 10;

		// Slider background
		const sliderBg = this.add.rectangle(x + 50, y, sliderWidth, sliderHeight, 0x444444)
			.setStrokeStyle(2, 0xffffff);

		// Slider fill
		const sliderFill = this.add.rectangle(x + 50 - sliderWidth/2, y, 0, sliderHeight, 0x00ff00)
			.setOrigin(0, 0.5);

		// Slider handle
		const handle = this.add.circle(x + 50 - sliderWidth/2, y, 12, 0xffffff)
			.setStrokeStyle(2, 0x000000)
			.setInteractive({ useHandCursor: true });

		// Volume text
		const volumeText = this.add.text(x + 170, y, "50%", {
			fontFamily: 'PressStart2P',
			fontSize: '14px',
			color: '#FFFFFF'
		}).setOrigin(0, 0.5);

		// Get initial volume
		let currentVolume;
		if (type === 'sfx') {
			// Try to get volume from existing audio system in play scene
			currentVolume = this.getStoredVolume('sfx') || 0.5;
			this.sfxVolume = currentVolume;
		} else {
			currentVolume = this.getStoredVolume('music') || 0.5;
			this.musicVolume = currentVolume;
		}

		// Set initial positions
		const handleX = x + 50 - sliderWidth/2 + (currentVolume * sliderWidth);
		handle.setX(handleX);
		sliderFill.setSize(currentVolume * sliderWidth, sliderHeight);
		volumeText.setText(Math.round(currentVolume * 100) + "%");

		// Store references
		if (type === 'sfx') {
			this.sfxSlider = { bg: sliderBg, fill: sliderFill, handle: handle, text: volumeText };
		} else {
			this.musicSlider = { bg: sliderBg, fill: sliderFill, handle: handle, text: volumeText };
		}

		// Make slider interactive
		this.setupSliderInteraction(handle, sliderFill, volumeText, sliderWidth, x, type);
	}

	setupSliderInteraction(handle, fill, text, sliderWidth, centerX, type) {
		let isDragging = false;

		handle.on('pointerdown', () => {
			isDragging = true;
			if (this.audioSystem) {
				this.audioSystem.playButtonPress();
			}
		});

		this.input.on('pointermove', (pointer) => {
			if (isDragging) {
				const minX = centerX + 50 - sliderWidth/2;
				const maxX = centerX + 50 + sliderWidth/2;
				const newX = Phaser.Math.Clamp(pointer.x, minX, maxX);
				
				handle.setX(newX);
				
				const fillWidth = newX - minX;
				fill.setSize(fillWidth, fill.height);
				
				const volume = fillWidth / sliderWidth;
				text.setText(Math.round(volume * 100) + "%");
				
				// Update volume
				if (type === 'sfx') {
					this.sfxVolume = volume;
					this.updateSFXVolume(volume);
				} else {
					this.musicVolume = volume;
					this.updateMusicVolume(volume);
				}
			}
		});

		this.input.on('pointerup', () => {
			isDragging = false;
		});
	}

	createButtons(x, y) {
		// Back button
		const backButton = this.add.text(x - 150, y, "BACK", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#666666',
			padding: { x: 12, y: 6 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Apply button
		const applyButton = this.add.text(x - 20, y, "APPLY", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#4CAF50',
			padding: { x: 12, y: 6 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Exit Game button
		const exitButton = this.add.text(x + 150, y, "EXIT GAME", {
			fontFamily: 'PressStart2P',
			fontSize: '20px',
			color: '#FFFFFF',
			stroke: '#000000',
			strokeThickness: 2,
			backgroundColor: '#f44336',
			padding: { x: 12, y: 6 }
		}).setOrigin(0.5).setInteractive({ useHandCursor: true });

		// Button interactions
		this.setupButtonInteraction(backButton, () => {
			this.closeSettings();
		});

		this.setupButtonInteraction(applyButton, () => {
			this.applySettings();
		});

		this.setupButtonInteraction(exitButton, () => {
			this.exitGame();
		});
	}

	setupButtonInteraction(button, callback) {
		const originalBg = button.style.backgroundColor;
		
		button.on('pointerover', () => {
			button.setStyle({ backgroundColor: '#777777' });
		});

		button.on('pointerout', () => {
			button.setStyle({ backgroundColor: originalBg });
		});

		button.on('pointerdown', () => {
			if (this.audioSystem) {
				this.audioSystem.playMenuButton();
			}
			callback();
		});
	}

	toggleFullscreen() {
		this.isFullscreen = !this.isFullscreen;
		this.fullscreenCheckmark.setVisible(this.isFullscreen);
	}

	updateSFXVolume(volume) {
		// Store volume for retrieval by other scenes
		this.storeVolume('sfx', volume);
		
		// Update current audio system
		if (this.audioSystem) {
			this.audioSystem.setVolume(volume);
		}
	}

	updateMusicVolume(volume) {
		// Store volume for future music implementation
		this.storeVolume('music', volume);
	}

	storeVolume(type, volume) {
		// Use localStorage to persist settings
		localStorage.setItem(`gameSettings_${type}Volume`, volume.toString());
	}

	getStoredVolume(type) {
		const stored = localStorage.getItem(`gameSettings_${type}Volume`);
		return stored ? parseFloat(stored) : null;
	}

	applySettings() {
		// Apply fullscreen setting
		if (this.isFullscreen !== this.scale.isFullscreen) {
			if (this.isFullscreen) {
				this.scale.startFullscreen();
			} else {
				this.scale.stopFullscreen();
			}
		}

		// Store fullscreen preference
		localStorage.setItem('gameSettings_fullscreen', this.isFullscreen.toString());

		this.closeSettings();
	}

	closeSettings() {
		if (this.callingScene === "playScene") {
			// Resume the play scene instead of starting it
			this.scene.stop();
			this.scene.resume("playScene");
		} else {
			this.scene.start(this.callingScene);
		}
	}

	exitGame() {
		if (this.audioSystem) {
			this.audioSystem.playMenuButton();
		}
		
		// Close the game window (works in Electron)
		if (typeof window !== 'undefined' && window.require) {
			try {
				const { remote } = window.require('electron');
				const win = remote.getCurrentWindow();
				win.close();
			} catch (e) {
				// Fallback for web browser
				window.close();
			}
		} else {
			// Fallback for web browser
			window.close();
		}
	}

	update() {
		// Update method without ESC key handling
	}
}