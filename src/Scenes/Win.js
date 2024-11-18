class Win extends Phaser.Scene {
  constructor() {
    super("winScene");
  }

  init(data) {
    this.p1Win = data.p1Win;
  }

  preload() { }

  create() {
    if (this.p1Win) {
      console.log("Player 1 Wins");
    } else {
      console.log("Player 2 Wins");
    }

  }

  update() { }
}
