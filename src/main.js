// Game: Million Card Game
// Name: Marco Ogaz-Vega
// Date: 3/14/24
/*
Approx hours: 
*/

/*TO DO LIST:
    - get hand interacting working
    - get background table asset
    - get selectable player count working (scene)
    - credits scene
    - win scene
    - dragging and clicking with cards played working
    - draging cards in hand
    - Display each player hand count
    - add sound effects to load (already in folder)
    - get some vibey musica
    - get iphone port working
*/
"use strict";

// Game configuration object
let config = {
  type: Phaser.CANVAS, // Use Canvas renderer instead of AUTO to avoid WebGL issues
  canvas: null,
  canvasStyle: null,
  context: null,
  width: 1688,
  height: 780,
  pixelArt: true,
  mode: Phaser.Scale.FIT,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    transparent: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "default",
    batchSize: 4096,
    maxLights: 10
  },
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    min: {
      width: 800,
      height: 600
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  frameRate: 60,
  // Remove physics for now to simplify debugging
  // physics: {
  //   default: "arcade",
  //   arcade: {
  //     debug: false,
  //     gravity: {
  //       x: 0,
  //       y: 0,
  //     },
  //   },
  // },
  scene: [Load, Title, Play, Win, Settings, Credits],
};

let game = new Phaser.Game(config);

// Comment out automatic fullscreen for now - it's causing issues
// const storedFullscreen = localStorage.getItem('gameSettings_fullscreen');
// if (storedFullscreen === 'true') {
//   game.scale.startFullscreen();
// }

// Prevent ESC key from exiting fullscreen
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape' && (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)) {
    event.preventDefault();
    event.stopPropagation();
  }
});

let { width, height } = game.config;

// Global constants for screen dimensions and layout
const centerX = game.config.width / 2;
const centerY = game.config.height / 2;
const w = game.config.width;
const h = game.config.height;
const borderPadding = 20;

// Define card suits and ranks
const suits = ["diamond", "spade", "heart", "club"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// Global cursor keys variable
let cursors = null;
