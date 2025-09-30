// AnimationSystem.js - Handles wave effects, particles, and visual feedback

class AnimationSystem {
	constructor(scene) {
		this.scene = scene;
		this.waveTime = 0;
		this.WAVE_AMPLITUDE = 10;
		this.WAVE_FREQUENCY = 1.5;
	}

	// Initializes particle system for poof effects when drawing cards
	initializeParticles() {
		this.scene.poofEmitter = this.scene.add.particles(0, 0, 'poof', {
			speed: { min: 100, max: 500 },
			angle: { min: 0, max: 360 },
			scale: { start: 2, end: 0 },
			alpha: { start: 1, end: 0 },
			lifespan: 500,
			quantity: 100,
			blendMode: 'ADD',
			tint: [0xffffff, 0xffe066, 0xff6666, 0x66ccff],
			emitting: false // Only emit when triggered
		});
		this.scene.poofEmitter.setDepth(10);
	}

	// Triggers a particle poof effect at the specified coordinates
	poofEffect(x, y) {
		if (this.scene.poofEmitter) {
			this.scene.poofEmitter.emitParticleAt(x, y, 32);
		}
	}

	// Updates all animation systems - called every frame
	update(time, delta) {
		this.waveTime += delta / 1000; // Convert ms to seconds
		this.applyHandWaveEffect();
		this.applyTableWaveEffect();
	}

	// Applies gentle wave motion to cards in the player's hand
	applyHandWaveEffect() {
		if (this.scene.handSelected) {
			this.scene.handSelected.forEach((cardSprite, i) => {
				if (cardSprite && !cardSprite.input?.dragState) {
					const baseY = cardSprite.baseY ?? (this.scene.scale.height - this.scene.borderUISize * 2);
					const interactionOffsetY = cardSprite.interactionOffsetY ?? 0;
					const waveOffset = Math.sin(
						this.waveTime * this.WAVE_FREQUENCY + i * 0.5
					) * this.WAVE_AMPLITUDE;
					cardSprite.y = baseY + interactionOffsetY + waveOffset;
				}
			});
		}
	}

	// Applies synchronized wave motion to cards on the table
	applyTableWaveEffect() {
		if (!this.scene.tableCards) return;
		this.scene.tableCards.forEach((group, groupIndex) => {
			// Check if any card in the group is being dragged
			const groupIsDragging = group.some(card => card.isDragging);
			
			if (!groupIsDragging && group.length > 0) {
				// Calculate the synchronous wave offset for this group
				const waveOffset = Math.sin(
					this.waveTime * this.WAVE_FREQUENCY + groupIndex * 0.5
				) * this.WAVE_AMPLITUDE * 0.7;
				
				group.forEach((card, cardIndex) => {
					const sprite = card.sprite;
					if (sprite) {
						// Each card uses its own baseY position but applies the same wave offset
						const baseY = sprite.baseY ?? sprite.y;
						const interactionOffsetY = sprite.interactionOffsetY ?? 0;
						
						// Apply the same wave motion to all cards in the group
						sprite.y = baseY + interactionOffsetY + waveOffset;
					}
				});
			}
		});
	}

	// Starts a pulsing tint effect on a card sprite for visual feedback
	startWaveTint(cardSprite, color, duration = 600, repeat = -1) {
		// Stop any existing tint animation
		this.stopWaveTint(cardSprite);
		
		// Store original values for restoration
		const originalAlpha = cardSprite.alpha;
		cardSprite.originalAlpha = originalAlpha;
		
		// Create a smooth color breathing effect using simpler approach
		cardSprite.waveTintTween = this.scene.tweens.add({
			targets: cardSprite,
			duration: duration,
			yoyo: true,
			repeat: repeat,
			ease: 'Sine.easeInOut',
			alpha: { from: originalAlpha, to: originalAlpha * 0.7 },
			onStart: () => {
				// Set the target color tint at start
				cardSprite.setTint(color);
			},
			onUpdate: (tween) => {
				// Create a breathing effect by varying the color intensity
				const progress = tween.progress;
				const intensity = Math.sin(progress * Math.PI); // Creates a wave from 0 to 1 and back
				
				// Extract RGB components from target color
				const targetR = (color >> 16) & 0xff;
				const targetG = (color >> 8) & 0xff;
				const targetB = color & 0xff;
				
				// Mix white (255, 255, 255) with target color based on intensity
				const r = Math.floor(255 * (1 - intensity * 0.8) + targetR * intensity * 0.8);
				const g = Math.floor(255 * (1 - intensity * 0.8) + targetG * intensity * 0.8);
				const b = Math.floor(255 * (1 - intensity * 0.8) + targetB * intensity * 0.8);
				
				const mixedColor = (r << 16) | (g << 8) | b;
				
				cardSprite.setTint(mixedColor);
			}
		});
	}

	// Stops the wave tint effect and restores the card to normal appearance
	stopWaveTint(cardSprite) {
		if (cardSprite.waveTintTween) {
			cardSprite.waveTintTween.destroy();
			cardSprite.waveTintTween = null;
		}
		
		// Restore original appearance
		cardSprite.clearTint();
		
		// Restore original alpha if it was stored
		if (cardSprite.originalAlpha !== undefined) {
			cardSprite.setAlpha(cardSprite.originalAlpha);
			cardSprite.originalAlpha = undefined;
		} else {
			cardSprite.setAlpha(1);
		}
		
		// Reset scale to what it should be based on whether it's selected or not
		const targetScale = cardSprite.isSelected ? 2.2 : 2;
		cardSprite.setScale(targetScale);
	}
}
