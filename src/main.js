"use strict";

let config = {
	type: Phaser.CANVAS,
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
		powerPreference: "default"
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
	physics: {
		default: "arcade",
		arcade: {
			debug: false,
			gravity: {
				x: 0,
				y: 0,
			},
		},
	},
	input: {
		gamepad: true, // Enable gamepad support
	},
	scene: [Load, Title, PlayerSelection, Play, Win, Settings, Credits, Tutorial],
};

let game = new Phaser.Game(config);

const storedFullscreen = localStorage.getItem('gameSettings_fullscreen');

document.addEventListener('keydown', function(event) {
	if (event.key === 'Escape' && (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)) {
		event.preventDefault();
		event.stopPropagation();
	}
});

let { width, height } = game.config;

const centerX = game.config.width / 2;
const centerY = game.config.height / 2;
const w = game.config.width;
const h = game.config.height;
const borderPadding = 20;

const suits = ["diamond", "spade", "heart", "club"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let cursors = null;
