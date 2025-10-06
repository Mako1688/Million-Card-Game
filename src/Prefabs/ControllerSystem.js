// ControllerSystem.js - Handles gamepad input and virtual mouse cursor

class ControllerSystem {
	constructor(scene) {
		this.scene = scene;
		this.gamepad = null;
		this.cursorSpeed = 400; // pixels per second
		this.deadzone = 0.2; // analog stick deadzone
		this.cursorVisible = false;
		
		// Virtual cursor position - center of screen
		this.cursorX = this.scene.scale.width / 2;
		this.cursorY = this.scene.scale.height / 2;
		
		// Button state tracking for edge detection
		this.previousButtonStates = {};
		this.buttonRepeatTimers = {};
		
		// Currently hovered object
		this.hoveredObject = null;
		
		console.log('Initializing ControllerSystem for scene:', this.scene.scene.key);
		
		this.initializeController();
		this.createVirtualCursor();
		
		// Initial detection
		this.detectGamepad();
	}

	initializeController() {
		// Check for existing gamepads
		this.detectGamepad();
		
		// Listen for gamepad connection events
		this.scene.input.gamepad.on('connected', (pad) => {
			console.log('Gamepad connected:', pad.id);
			this.gamepad = pad;
			this.showCursor();
		});

		this.scene.input.gamepad.on('disconnected', (pad) => {
			console.log('Gamepad disconnected:', pad.id);
			if (this.gamepad === pad) {
				this.gamepad = null;
				this.hideCursor();
			}
		});
	}

	detectGamepad() {
		if (this.scene.input.gamepad.total > 0) {
			this.gamepad = this.scene.input.gamepad.getPad(0);
			console.log('Gamepad detected:', this.gamepad.id, 'Buttons:', this.gamepad.buttons.length);
			this.showCursor();
		} else {
			console.log('No gamepad detected, total controllers:', this.scene.input.gamepad.total);
			// Keep checking periodically if no gamepad is found
			this.hideCursor();
		}
	}

	createVirtualCursor() {
		try {
			// Create a simple cursor sprite
			this.cursor = this.scene.add.graphics();
			this.cursor.setDepth(10000); // Always on top
			
			// Clear previous graphics
			this.cursor.clear();
			
			// Draw a crosshair cursor with better visibility
			this.cursor.lineStyle(3, 0xffffff, 1);
			this.cursor.strokeCircle(0, 0, 10);
			this.cursor.moveTo(-8, 0);
			this.cursor.lineTo(8, 0);
			this.cursor.moveTo(0, -8);
			this.cursor.lineTo(0, 8);
			
			// Add a colored glow effect for better visibility
			this.cursor.lineStyle(6, 0x00ff00, 0.4);
			this.cursor.strokeCircle(0, 0, 15);
			
			// Add a center dot
			this.cursor.fillStyle(0xffffff, 1);
			this.cursor.fillCircle(0, 0, 2);
			
			this.cursor.setPosition(this.cursorX, this.cursorY);
			this.cursor.setVisible(false);
			
			console.log('Virtual cursor created at:', this.cursorX, this.cursorY);
		} catch (e) {
			console.error('Failed to create virtual cursor:', e);
		}
	}

	showCursor() {
		console.log('Showing cursor');
		this.cursorVisible = true;
		if (this.cursor) {
			this.cursor.setVisible(true);
			console.log('Cursor visibility set to true');
		} else {
			console.log('Cursor object not found');
		}
		
		// Hide the system mouse cursor when controller is active
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('none');
		}
	}

	hideCursor() {
		console.log('Hiding cursor');
		this.cursorVisible = false;
		if (this.cursor) {
			this.cursor.setVisible(false);
		}
		
		// Restore system mouse cursor
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('default');
		}
	}

	update(time, delta) {
		// Always try to detect gamepad if we don't have one
		if (!this.gamepad) {
			this.detectGamepad();
			return;
		}

		// Check if gamepad is still connected
		if (!this.gamepad.connected) {
			console.log('Gamepad disconnected');
			this.gamepad = null;
			this.hideCursor();
			return;
		}

		// Debug: Log button states occasionally (but safely)
		if (time && time % 2000 < 16) { // Every ~2 seconds to reduce spam
			const pressedButtons = [];
			try {
				for (let i = 0; i < this.gamepad.buttons.length; i++) {
					if (this.gamepad.buttons[i].pressed) {
						pressedButtons.push(i);
					}
				}
				if (pressedButtons.length > 0) {
					console.log('Pressed buttons:', pressedButtons);
				}
				console.log('Controller active, cursor visible:', this.cursorVisible, 'cursor exists:', !!this.cursor);
			} catch (e) {
				console.warn('Error checking button states:', e);
			}
		}

		this.updateCursorPosition(delta);
		this.handleButtonInputs();
		this.updateHoverState();
	}

	updateCursorPosition(delta) {
		if (!this.gamepad || !this.cursorVisible) return;

		// Get left stick input
		const leftStick = this.gamepad.leftStick;
		
		// Apply deadzone
		let x = Math.abs(leftStick.x) > this.deadzone ? leftStick.x : 0;
		let y = Math.abs(leftStick.y) > this.deadzone ? leftStick.y : 0;

		// Apply non-linear scaling for better control
		x = Math.sign(x) * Math.pow(Math.abs(x), 1.5);
		y = Math.sign(y) * Math.pow(Math.abs(y), 1.5);

		// Update cursor position
		const deltaTime = delta / 1000;
		this.cursorX += x * this.cursorSpeed * deltaTime;
		this.cursorY += y * this.cursorSpeed * deltaTime;

		// Clamp to screen bounds
		this.cursorX = Phaser.Math.Clamp(this.cursorX, 0, this.scene.scale.width);
		this.cursorY = Phaser.Math.Clamp(this.cursorY, 0, this.scene.scale.height);

		// Update cursor sprite position
		if (this.cursor) {
			this.cursor.setPosition(this.cursorX, this.cursorY);
		}
	}

	handleButtonInputs() {
		if (!this.gamepad) return;

		// A button (primary action - like left click) - Use index 0 for A button
		this.handleButtonByIndex(0, () => {
			console.log('A button pressed!'); // Debug log
			this.simulatePointerDown();
		});

		// B button (secondary action - like right click or cancel) - Use index 1 for B button
		this.handleButtonByIndex(1, () => {
			console.log('B button pressed!'); // Debug log
			this.simulateRightClick();
		});

		// X button (could be used for special actions) - Use index 2 for X button
		this.handleButtonByIndex(2, () => {
			console.log('X button pressed!'); // Debug log
			this.simulateSpecialAction();
		});

		// Y button (could be used for context actions) - Use index 3 for Y button
		this.handleButtonByIndex(3, () => {
			console.log('Y button pressed!'); // Debug log
			this.simulateContextAction();
		});

		// Shoulder buttons for quick actions - Use index 4 and 5 for L1/R1
		this.handleButtonByIndex(4, () => {
			console.log('L1 button pressed!'); // Debug log
			this.handleQuickSort('rank');
		});

		this.handleButtonByIndex(5, () => {
			console.log('R1 button pressed!'); // Debug log
			this.handleQuickSort('suit');
		});

		// D-pad navigation using axes or buttons (depends on gamepad)
		this.handleDPadInputs();
	}

	handleButtonByIndex(buttonIndex, callback) {
		if (!this.gamepad || !this.gamepad.buttons || !this.gamepad.buttons[buttonIndex]) return;

		try {
			const button = this.gamepad.buttons[buttonIndex];
			const isPressed = button.pressed;
			const wasPressed = this.previousButtonStates[buttonIndex] || false;

			// Button just pressed (edge detection)
			if (isPressed && !wasPressed) {
				console.log(`Button ${buttonIndex} pressed!`); // Debug log
				callback();
			}

			this.previousButtonStates[buttonIndex] = isPressed;
		} catch (e) {
			console.warn(`Error handling button ${buttonIndex}:`, e);
		}
	}

	// Keep the old method for backward compatibility but make it work with button indices
	handleButton(buttonName, callback) {
		// Map button names to indices for standard gamepads
		const buttonMap = {
			'A': 0, 'a': 0,
			'B': 1, 'b': 1,
			'X': 2, 'x': 2,
			'Y': 3, 'y': 3,
			'L1': 4, 'l1': 4, 'LB': 4, 'lb': 4,
			'R1': 5, 'r1': 5, 'RB': 5, 'rb': 5,
			'L2': 6, 'l2': 6, 'LT': 6, 'lt': 6,
			'R2': 7, 'r2': 7, 'RT': 7, 'rt': 7,
			'select': 8, 'back': 8,
			'start': 9,
			'L3': 10, 'l3': 10, 'LS': 10, 'ls': 10,
			'R3': 11, 'r3': 11, 'RS': 11, 'rs': 11,
			'up': 12,
			'down': 13,
			'left': 14,
			'right': 15
		};

		const buttonIndex = buttonMap[buttonName];
		if (buttonIndex !== undefined) {
			this.handleButtonByIndex(buttonIndex, callback);
		}
	}

	handleDPadInputs() {
		// Handle D-pad using button indices 12-15 (standard gamepad layout)
		this.handleButtonByIndex(12, () => { // D-pad up
			console.log('D-pad up pressed!');
			this.handleDPadNavigation('up');
		});

		this.handleButtonByIndex(13, () => { // D-pad down
			console.log('D-pad down pressed!');
			this.handleDPadNavigation('down');
		});

		this.handleButtonByIndex(14, () => { // D-pad left
			console.log('D-pad left pressed!');
			this.handleDPadNavigation('left');
		});

		this.handleButtonByIndex(15, () => { // D-pad right
			console.log('D-pad right pressed!');
			this.handleDPadNavigation('right');
		});
	}

	updateHoverState() {
		if (!this.cursorVisible) return;

		// Get all interactive objects in the scene using a safer approach
		let interactiveObjects = [];
		
		// Try different ways to get interactive objects
		if (this.scene.input && this.scene.input.manager && this.scene.input.manager.list) {
			interactiveObjects = this.scene.input.manager.list;
		} else if (this.scene.children && this.scene.children.list) {
			// Fallback: filter scene children for interactive objects
			interactiveObjects = this.scene.children.list.filter(obj => 
				obj.input && obj.input.enabled && obj.active && obj.visible
			);
		}

		let newHoveredObject = null;

		// Check each interactive object to see if cursor is over it
		for (let i = 0; i < interactiveObjects.length; i++) {
			const obj = interactiveObjects[i];
			if (obj.input && obj.input.enabled && obj.active && obj.visible) {
				// Check if cursor is within object bounds
				let bounds;
				
				// Try to get bounds using different methods
				if (obj.getBounds) {
					bounds = obj.getBounds();
				} else {
					// Calculate bounds manually
					const width = obj.displayWidth || obj.width || 0;
					const height = obj.displayHeight || obj.height || 0;
					const originX = obj.originX !== undefined ? obj.originX : 0.5;
					const originY = obj.originY !== undefined ? obj.originY : 0.5;
					
					bounds = {
						x: obj.x - (width * originX),
						y: obj.y - (height * originY),
						width: width,
						height: height
					};
				}

				if (this.cursorX >= bounds.x && 
					this.cursorX <= bounds.x + bounds.width &&
					this.cursorY >= bounds.y && 
					this.cursorY <= bounds.y + bounds.height) {
					newHoveredObject = obj;
					break; // Take the first (topmost) object found
				}
			}
		}

		// Handle hover state changes
		if (this.hoveredObject !== newHoveredObject) {
			// Remove hover from previous object
			if (this.hoveredObject && this.hoveredObject.emit) {
				this.hoveredObject.emit('pointerout');
			}

			// Add hover to new object
			if (newHoveredObject && newHoveredObject.emit) {
				newHoveredObject.emit('pointerover');
			}

			this.hoveredObject = newHoveredObject;
		}
	}

	simulatePointerDown() {
		console.log('simulatePointerDown called, hoveredObject:', this.hoveredObject); // Debug log
		console.log('Cursor position:', this.cursorX, this.cursorY);
		
		if (!this.hoveredObject) {
			console.log('No hovered object found at cursor position:', this.cursorX, this.cursorY);
			// Let's also check if there are any interactive objects in the scene
			if (this.scene.children && this.scene.children.list) {
				const interactiveObjects = this.scene.children.list.filter(obj => 
					obj.input && obj.input.enabled && obj.active && obj.visible
				);
				console.log('Interactive objects in scene:', interactiveObjects.length);
				interactiveObjects.forEach((obj, index) => {
					console.log(`Object ${index}:`, obj.constructor.name, 'at', obj.x, obj.y);
				});
			}
			return;
		}

		console.log('Simulating click on object:', this.hoveredObject.constructor.name, 'at', this.hoveredObject.x, this.hoveredObject.y);

		// Create a more complete fake pointer event
		const fakePointer = {
			x: this.cursorX,
			y: this.cursorY,
			worldX: this.cursorX,
			worldY: this.cursorY,
			downX: this.cursorX,
			downY: this.cursorY,
			upX: this.cursorX,
			upY: this.cursorY,
			button: 0,
			buttons: 1,
			isDown: true,
			primaryDown: true,
			dragState: 0,
			clickTime: this.scene.time.now,
			event: {
				button: 0,
				buttons: 1,
				clientX: this.cursorX,
				clientY: this.cursorY
			}
		};

		// Emit pointer events in the correct order
		if (this.hoveredObject.emit) {
			console.log('Emitting pointerdown event');
			this.hoveredObject.emit('pointerdown', fakePointer, this.hoveredObject);
			
			// Small delay before pointerup to simulate realistic clicking
			this.scene.time.delayedCall(50, () => {
				if (this.hoveredObject && this.hoveredObject.emit) {
					console.log('Emitting pointerup event');
					fakePointer.isDown = false;
					fakePointer.primaryDown = false;
					this.hoveredObject.emit('pointerup', fakePointer, this.hoveredObject);
				}
			});
		}
	}

	simulateRightClick() {
		// Could be used for context menus or alternate actions
		console.log('Right click simulated at:', this.cursorX, this.cursorY);
	}

	simulateSpecialAction() {
		// X button - could be used for special game actions
		if (this.scene.scene.key === 'playScene') {
			// In play scene, X could be "draw card"
			if (this.scene.deckSprite && this.scene.cardSystem.canDrawCard()) {
				this.scene.cardSystem.drawCard();
			}
		}
	}

	simulateContextAction() {
		// Y button - could be used for context actions
		if (this.scene.scene.key === 'playScene') {
			// In play scene, Y could be "end turn"
			if (this.scene.gameLogic) {
				this.scene.gameLogic.endTurn();
			}
		}
	}

	handleQuickSort(type) {
		if (this.scene.scene.key === 'playScene' && this.scene.handManager) {
			if (type === 'rank') {
				this.scene.handManager.sortByRank();
			} else if (type === 'suit') {
				this.scene.handManager.sortBySuit();
			}
		}
	}

	handleDPadNavigation(direction) {
		// Could be used for menu navigation or quick selection
		console.log('D-pad pressed:', direction);
	}

	// Get current cursor position
	getCursorPosition() {
		return { x: this.cursorX, y: this.cursorY };
	}

	// Check if controller is connected
	isConnected() {
		return this.gamepad !== null;
	}

	// Destroy the controller system
	destroy() {
		if (this.cursor) {
			this.cursor.destroy();
		}
		
		// Restore default cursor
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('default');
		}
	}
}