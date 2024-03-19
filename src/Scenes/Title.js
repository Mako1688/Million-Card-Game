class Title extends Phaser.Scene {
    constructor() {
        super('titleScene')
    }

    init() {

    }

    preload() {
        
    }

    create() {
         //add any button to start text
        // Menu config
        let menuConfig = {
            fontFamily: 'PressStart2P',
            fontSize: '40px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            align: 'center',
            padding: {
                top: 5,
                bottom: 5,
            },
            fixedWidth: 0,
        }
        this.add.text(centerX, h/3, 'MILLION CARD GAME\nDedicated to Lois <3', menuConfig).setOrigin(0.5, 0.5)
        this.add.text(centerX, h/3 + 100, 'CLICK the CARD to START', menuConfig).setOrigin(0.5, 0.5)

        this.card = this.add.sprite(centerX, h / 4 * 3 + 10, 'card_deck', 53).setOrigin(0.5, 0.5).setScale(2)

        // Make the card clickable
        this.card.setInteractive()

        // Add pointerover event listener for hovering
        this.card.on('pointerover', () => {
            // Scale the card slightly larger
            this.tweens.add({
                targets: this.card,
                scaleX: 2.1,
                scaleY: 2.1,
                duration: 200,
                ease: 'Linear'
            })
        })

        // Add pointerout event listener for when hovering ends
        this.card.on('pointerout', () => {
            // Restore the card to its original scale
            this.tweens.add({
                targets: this.card,
                scaleX: 2,
                scaleY: 2,
                duration: 200,
                ease: 'Linear'
            })
        })

        // Listen for pointerdown event on the card
        this.card.on('pointerdown', () => {
            // Code to execute when the card is clicked
            console.log('Card clicked!')
            this.scene.start('playScene')
        })
        
    }

    update() {
       

    }
}