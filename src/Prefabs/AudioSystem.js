// AudioSystem.js - Handles all audio functionality for the game

class AudioSystem {
	constructor(scene) {
		this.scene = scene;
		this.sounds = {};
		this.volume = this.getStoredVolume() || 0.5; // Load stored volume or default
		this.muted = false;
		
		this.initializeAudio();
	}

	// Initialize all audio objects
	initializeAudio() {
		// Create sound objects for each audio file
		this.sounds.cardSelect = this.scene.sound.add("african1", { volume: this.volume });
		this.sounds.endTurn = this.scene.sound.add("african2", { volume: this.volume });
		this.sounds.buttonPress = this.scene.sound.add("african3", { volume: this.volume });
		this.sounds.playCards = this.scene.sound.add("african4", { volume: this.volume });
		this.sounds.menuButton = this.scene.sound.add("wood_block1", { volume: this.volume });
	}

	// Play card select/deselect sound (African1)
	playCardSelect() {
		if (!this.muted && this.sounds.cardSelect) {
			this.sounds.cardSelect.play();
		}
	}

	// Play end turn sound (African2)
	playEndTurn() {
		if (!this.muted && this.sounds.endTurn) {
			this.sounds.endTurn.play();
		}
	}

	// Play button press sound for sort/reset buttons (African3)
	playButtonPress() {
		if (!this.muted && this.sounds.buttonPress) {
			this.sounds.buttonPress.play();
		}
	}

	// Play cards placement sound (African4)
	playCardsPlacement() {
		if (!this.muted && this.sounds.playCards) {
			this.sounds.playCards.play();
		}
	}

	// Play menu button sound (Wood Block 1)
	playMenuButton() {
		if (!this.muted && this.sounds.menuButton) {
			this.sounds.menuButton.play();
		}
	}

	// Set volume for all sounds
	setVolume(volume) {
		this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
		
		Object.values(this.sounds).forEach(sound => {
			if (sound) {
				sound.setVolume(this.volume);
			}
		});

		// Store the volume setting
		this.storeVolume(this.volume);
	}

	// Get stored volume from localStorage
	getStoredVolume() {
		const stored = localStorage.getItem('gameSettings_sfxVolume');
		return stored ? parseFloat(stored) : null;
	}

	// Store volume to localStorage
	storeVolume(volume) {
		localStorage.setItem('gameSettings_sfxVolume', volume.toString());
	}

	// Toggle mute state
	toggleMute() {
		this.muted = !this.muted;
		return this.muted;
	}

	// Mute all sounds
	mute() {
		this.muted = true;
	}

	// Unmute all sounds
	unmute() {
		this.muted = false;
	}

	// Get current mute state
	isMuted() {
		return this.muted;
	}

	// Get current volume
	getVolume() {
		return this.volume;
	}

	// Stop all currently playing sounds
	stopAll() {
		Object.values(this.sounds).forEach(sound => {
			if (sound && sound.isPlaying) {
				sound.stop();
			}
		});
	}

	// Destroy all sound objects (cleanup)
	destroy() {
		Object.values(this.sounds).forEach(sound => {
			if (sound) {
				sound.destroy();
			}
		});
		this.sounds = {};
	}
}