// AnimationSystem.js - Handles wave effects, particles, and visual feedback

class AnimationSystem {
    constructor(scene) {
        this.scene = scene;
        this.waveTime = 0;
        this.WAVE_AMPLITUDE = 10;
        this.WAVE_FREQUENCY = 1.5;
    }

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

    poofEffect(x, y) {
        console.log(`Poof effect at (${x}, ${y})`);
        if (this.scene.poofEmitter) {
            this.scene.poofEmitter.emitParticleAt(x, y, 32);
        }
    }

    update(time, delta) {
        this.waveTime += delta / 1000; // Convert ms to seconds
        this.applyHandWaveEffect();
        this.applyTableWaveEffect();
    }

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

    startWaveTint(cardSprite, color, duration = 600, repeat = -1) {
        // Stop any existing tint animation
        this.stopWaveTint(cardSprite);
        
        // Set a static tint instead of animating it
        cardSprite.setTint(color);
        
        // Create a subtle scale pulse effect instead of tint animation
        cardSprite.waveTintTween = this.scene.tweens.add({
            targets: cardSprite,
            scaleX: { from: cardSprite.scaleX, to: cardSprite.scaleX * 1.05 },
            scaleY: { from: cardSprite.scaleY, to: cardSprite.scaleY * 1.05 },
            duration: duration,
            yoyo: true,
            repeat: repeat,
            ease: 'Sine.easeInOut'
        });
    }

    stopWaveTint(cardSprite) {
        if (cardSprite.waveTintTween) {
            cardSprite.waveTintTween.destroy();
            cardSprite.waveTintTween = null;
        }
        cardSprite.clearTint();
        // Reset scale to what it should be based on whether it's selected or not
        const targetScale = cardSprite.isSelected ? 2.2 : 2;
        cardSprite.setScale(targetScale);
    }
}
