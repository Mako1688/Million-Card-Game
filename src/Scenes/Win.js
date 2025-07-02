// Win.js - Displays the winner and handles game completion

class Win extends Phaser.Scene {
  constructor() {
    super("winScene");
  }

  // Receives data about which player won
  init(data) {
    this.p1Win = data.p1Win;
  }

  preload() { }

  // Creates the win screen display
  create() {
    if (this.p1Win) {
      console.log("Player 1 Wins");
    } else {
      console.log("Player 2 Wins");
    }

  }

  update() { }
}
