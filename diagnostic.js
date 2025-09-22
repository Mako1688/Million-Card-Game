// Simple diagnostic script to test Phaser configuration

console.log('=== PHASER CONFIGURATION DIAGNOSTIC ===');

// Check if Phaser is available
if (typeof Phaser !== 'undefined') {
    console.log('✓ Phaser is available, version:', Phaser.VERSION);
    console.log('✓ Available renderers:', {
        AUTO: Phaser.AUTO,
        CANVAS: Phaser.CANVAS,
        WEBGL: Phaser.WEBGL
    });
} else {
    console.error('✗ Phaser is not available');
}

// Test Canvas renderer specifically
const testConfig = {
    type: Phaser.CANVAS,
    width: 400,
    height: 300,
    parent: document.createElement('div'),
    scene: {
        create() {
            console.log('✓ Canvas renderer test scene created successfully');
            this.add.text(200, 150, 'Test', { fontFamily: 'Arial' }).setOrigin(0.5);
        }
    },
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
        transparent: false,
        clearBeforeRender: true,
        preserveDrawingBuffer: false,
        premultipliedAlpha: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "default"
    }
};

try {
    console.log('Testing Canvas renderer configuration...');
    const testGame = new Phaser.Game(testConfig);
    
    setTimeout(() => {
        if (testGame.renderer) {
            console.log('✓ Canvas renderer initialized successfully');
            console.log('  Renderer type:', testGame.renderer.type);
            console.log('  Canvas element:', testGame.canvas);
            testGame.destroy(true);
            console.log('✓ Test game destroyed successfully');
        } else {
            console.error('✗ Canvas renderer failed to initialize');
        }
    }, 500);
    
} catch (error) {
    console.error('✗ Error creating test game:', error);
}

console.log('=== END DIAGNOSTIC ===');