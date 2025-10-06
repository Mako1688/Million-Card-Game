// ControllerSystem.js - Handles gamepad input and virtual mouse cursor

class ControllerSystem {
	constructor(scene) {
		this.scene = scene;
		this.gamepad = null;
		this.cursorSpeed = 400; // pixels per second
		this.deadzone = 0.2; // analog stick deadzone
		this.cursorVisible = false;
		this.botTurnActive = false; // Flag to disable controller during bot turns
		
		// Input mode management
		this.inputMode = 'mouse'; // 'mouse' or 'controller'
		this.lastMouseX = 0;
		this.lastMouseY = 0;
		this.mouseInactivityTime = 0;
		this.MOUSE_INACTIVITY_THRESHOLD = 2000; // 2 seconds without mouse movement
		
		// Virtual cursor position - center of screen
		this.cursorX = this.scene.scale.width / 2;
		this.cursorY = this.scene.scale.height / 2;
		
		// Button state tracking for edge detection
		this.previousButtonStates = {};
		this.buttonRepeatTimers = {};
		
		// A button state tracking for click vs drag detection
		this.aButtonPressed = false;
		this.aButtonPressTime = 0;
		this.aButtonStartPos = { x: 0, y: 0 };
		
		// Currently hovered object
		this.hoveredObject = null;
		
		console.log('Initializing ControllerSystem for scene:', this.scene.scene.key);
		
		this.initializeController();
		this.createVirtualCursor();
		this.setupMouseDetection();
		
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
			// Don't automatically show cursor - wait for controller input
		} else {
			console.log('No gamepad detected, total controllers:', this.scene.input.gamepad.total);
			// Keep checking periodically if no gamepad is found
			this.hideCursor();
		}
	}

	setupMouseDetection() {
		// Store initial mouse position
		if (this.scene.input.activePointer) {
			this.lastMouseX = this.scene.input.activePointer.x;
			this.lastMouseY = this.scene.input.activePointer.y;
		}
		
		// Listen for mouse movement
		this.scene.input.on('pointermove', (pointer) => {
			this.onMouseMove(pointer.x, pointer.y);
		});
		
		// Listen for mouse clicks to immediately switch to mouse mode
		this.scene.input.on('pointerdown', () => {
			this.switchToMouseMode();
		});
	}

	onMouseMove(x, y) {
		// Check if mouse actually moved significantly
		const deltaX = Math.abs(x - this.lastMouseX);
		const deltaY = Math.abs(y - this.lastMouseY);
		
		if (deltaX > 5 || deltaY > 5) { // Threshold to avoid tiny movements
			this.lastMouseX = x;
			this.lastMouseY = y;
			this.mouseInactivityTime = 0;
			this.switchToMouseMode();
		}
	}

	switchToMouseMode() {
		if (this.inputMode !== 'mouse') {
			console.log('Switching to mouse mode');
			this.inputMode = 'mouse';
			this.hideCursor();
			
			// Re-enable mouse interactions for all objects
			this.enableMouseInteractions();
		}
	}

	switchToControllerMode() {
		if (this.inputMode !== 'controller') {
			console.log('Switching to controller mode');
			this.inputMode = 'controller';
			this.showCursor();
			
			// Disable mouse interactions to prevent conflicts
			this.disableMouseInteractions();
		}
	}

	enableMouseInteractions() {
		// Re-enable mouse cursor
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('default');
		}
	}

	disableMouseInteractions() {
		// Hide mouse cursor when controller is active
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('none');
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
			this.switchToMouseMode(); // Switch back to mouse when controller disconnects
			return;
		}

		// Skip controller processing during bot turns to prevent player interference
		if (this.botTurnActive) {
			// Keep cursor visible but don't process inputs during bot turns
			return;
		}

		// Handle input mode management
		this.updateInputMode(delta);

		// Only process controller inputs if we're in controller mode
		if (this.inputMode === 'controller') {
			this.updateCursorPosition(delta);
			this.handleButtonInputs();
			this.updateHoverState();
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
				console.log('Input mode:', this.inputMode, 'Controller active, cursor visible:', this.cursorVisible, 'cursor exists:', !!this.cursor);
			} catch (e) {
				console.warn('Error checking button states:', e);
			}
		}
	}

	updateInputMode(delta) {
		// Track mouse inactivity
		if (this.inputMode === 'mouse') {
			this.mouseInactivityTime += delta;
		}

		// Check for controller input to switch modes
		if (this.gamepad && this.inputMode === 'mouse') {
			// Check for any significant controller input
			const leftStick = this.gamepad.leftStick;
			const hasStickInput = Math.abs(leftStick.x) > this.deadzone || Math.abs(leftStick.y) > this.deadzone;
			
			// Check for any button presses
			let hasButtonInput = false;
			try {
				for (let i = 0; i < this.gamepad.buttons.length; i++) {
					if (this.gamepad.buttons[i].pressed) {
						hasButtonInput = true;
						break;
					}
				}
			} catch (e) {
				// Ignore button check errors
			}

			// Switch to controller mode if we detect input
			if (hasStickInput || hasButtonInput) {
				this.switchToControllerMode();
			}
		}
	}

	updateCursorPosition(delta) {
		if (!this.gamepad || !this.cursorVisible || this.inputMode !== 'controller') return;

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
		if (!this.gamepad || this.inputMode !== 'controller') return;

		// A button (primary action) - Handle click vs drag detection
		const aButton = this.gamepad.buttons[0];
		if (aButton && aButton.pressed && !this.aButtonPressed) {
			// Button just pressed - start timing for click vs drag detection
			this.aButtonPressed = true;
			this.aButtonPressTime = Date.now();
			this.aButtonStartPos = { x: this.cursor.x, y: this.cursor.y };
			console.log('A button pressed!');
			this.simulatePointerDown();
		} else if (aButton && !aButton.pressed && this.aButtonPressed) {
			// Button just released
			this.aButtonPressed = false;
			const pressDuration = Date.now() - this.aButtonPressTime;
			const moveDistance = Phaser.Math.Distance.Between(
				this.aButtonStartPos.x, 
				this.aButtonStartPos.y,
				this.cursor.x, 
				this.cursor.y
			);
			
			// If it was a quick press with minimal movement, treat as click
			if (pressDuration < 300 && moveDistance < 10) {
				console.log('A button click detected - sending clean click sequence!');
				// For a clean click, send a small pointermove at the same position
				// This ensures the table card system recognizes it as a click (not drag)
				this.simulateClickPointermove();
			} else {
				console.log('A button drag ended!');
			}
			// Always send pointerup to complete the interaction
			this.simulatePointerUp();
		} else if (aButton && aButton.pressed && this.aButtonPressed) {
			// Button held down - check if we should be dragging
			const pressDuration = Date.now() - this.aButtonPressTime;
			const moveDistance = Phaser.Math.Distance.Between(
				this.aButtonStartPos.x, 
				this.aButtonStartPos.y,
				this.cursor.x, 
				this.cursor.y
			);
			
			// If button held for a while or moved significantly, send pointermove for dragging
			if (pressDuration > 100 || moveDistance > 3) {
				this.simulatePointerMove();
			}
		}

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

		// L2 button for debug info - Use index 6 for L2
		this.handleButtonByIndex(6, () => {
			console.log('L2 button pressed - Debug info!');
			this.debugCursorObjects();
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
		if (!this.cursorVisible || this.inputMode !== 'controller') return;

		// Get all interactive objects from multiple sources
		let interactiveObjects = [];
		
		// Get objects from input manager
		if (this.scene.input && this.scene.input.manager && this.scene.input.manager.list) {
			interactiveObjects = [...this.scene.input.manager.list];
		}
		
		// Also check scene children for interactive objects (some might not be in input manager)
		if (this.scene.children && this.scene.children.list) {
			const sceneInteractives = this.scene.children.list.filter(obj => 
				obj.input && obj.input.enabled && obj.active && obj.visible
			);
			// Add to array, avoiding duplicates
			sceneInteractives.forEach(obj => {
				if (!interactiveObjects.includes(obj)) {
					interactiveObjects.push(obj);
				}
			});
		}

		// IMPORTANT: Also check objects inside containers that might not be in the main lists
		// Specifically check for validation box
		if (this.scene.validationBox && 
			this.scene.validationBoxContainer && 
			this.scene.validationBoxContainer.visible &&
			this.scene.validationBox.input && 
			this.scene.validationBox.input.enabled &&
			!interactiveObjects.includes(this.scene.validationBox)) {
			interactiveObjects.push(this.scene.validationBox);
		}

		// Sort by depth (highest depth first) to properly handle overlapping objects
		interactiveObjects.sort((a, b) => {
			let depthA = a.depth || 0;
			let depthB = b.depth || 0;
			
			// If object is in a container, add container's depth
			if (a.parentContainer) depthA += a.parentContainer.depth || 0;
			if (b.parentContainer) depthB += b.parentContainer.depth || 0;
			
			return depthB - depthA;
		});

		let newHoveredObject = null;

		// Check each interactive object to see if cursor is over it
		for (let i = 0; i < interactiveObjects.length; i++) {
			const obj = interactiveObjects[i];
			
			// Skip objects that aren't properly active/visible
			if (!obj.input || !obj.input.enabled || !obj.active || !obj.visible) {
				continue;
			}
			
			// Skip objects in containers that aren't visible
			if (obj.parentContainer && !obj.parentContainer.visible) {
				continue;
			}
			
			let bounds = this.getObjectBounds(obj);

			if (bounds && this.cursorX >= bounds.x && 
				this.cursorX <= bounds.x + bounds.width &&
				this.cursorY >= bounds.y && 
				this.cursorY <= bounds.y + bounds.height) {
				newHoveredObject = obj;
				break; // Take the first (topmost by depth) object found
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
				console.log('New hovered object:', newHoveredObject.constructor.name);
				newHoveredObject.emit('pointerover');
			}

			this.hoveredObject = newHoveredObject;
		}
	}

	// Helper method to get proper bounds for any object, accounting for containers
	getObjectBounds(obj) {
		try {
			// Try Phaser's built-in getBounds first
			if (obj.getBounds) {
				return obj.getBounds();
			}

			// Calculate bounds manually
			const width = obj.displayWidth || obj.width || 0;
			const height = obj.displayHeight || obj.height || 0;
			const originX = obj.originX !== undefined ? obj.originX : 0.5;
			const originY = obj.originY !== undefined ? obj.originY : 0.5;
			
			// Get world position by traversing up the container hierarchy
			let worldX = obj.x;
			let worldY = obj.y;
			let parent = obj.parentContainer;
			
			while (parent) {
				worldX += parent.x;
				worldY += parent.y;
				parent = parent.parentContainer;
			}
			
			return {
				x: worldX - (width * originX),
				y: worldY - (height * originY),
				width: width,
				height: height
			};
		} catch (e) {
			console.warn('Error calculating bounds for object:', e);
			return null;
		}
	}

	simulatePointerDown() {
		console.log('simulatePointerDown called, hoveredObject:', this.hoveredObject?.constructor?.name); 
		console.log('Cursor position:', this.cursorX, this.cursorY);
		
		if (!this.hoveredObject) {
			console.log('No hovered object found at cursor position');
			return;
		}

		console.log('Simulating click on object:', this.hoveredObject.constructor.name);

		// Create a realistic fake pointer event that matches Phaser's pointer structure
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
			isDown: false, // Start as not down
			primaryDown: false,
			dragState: 0,
			clickTime: this.scene.time.now,
			downTime: this.scene.time.now,
			time: this.scene.time.now,
			identifier: 1,
			pointerId: 1,
			active: true,
			wasTouch: false,
			wasCanceled: false,
			movementX: 0,
			movementY: 0,
			velocity: { x: 0, y: 0 },
			angle: 0,
			distance: 0
		};

		// Create a realistic DOM event object
		const eventObject = {
			button: 0,
			buttons: 1,
			clientX: this.cursorX,
			clientY: this.cursorY,
			screenX: this.cursorX,
			screenY: this.cursorY,
			pageX: this.cursorX,
			pageY: this.cursorY,
			offsetX: this.cursorX,
			offsetY: this.cursorY,
			target: this.scene.game.canvas,
			currentTarget: this.scene.game.canvas,
			timeStamp: this.scene.time.now,
			type: 'pointerdown',
			stopPropagation: () => {},
			preventDefault: () => {},
			stopImmediatePropagation: () => {}
		};

		// Calculate local coordinates relative to the object
		const bounds = this.getObjectBounds(this.hoveredObject);
		const localX = bounds ? (this.cursorX - bounds.x) : 0;
		const localY = bounds ? (this.cursorY - bounds.y) : 0;

		// Emit events in proper sequence to match mouse behavior exactly
		if (this.hoveredObject.emit) {
			// Phase 1: Pointer down
			fakePointer.isDown = true;
			fakePointer.primaryDown = true;
			fakePointer.downTime = this.scene.time.now;
			console.log('Emitting pointerdown event');
			this.hoveredObject.emit('pointerdown', fakePointer, localX, localY, eventObject);
			
			// Note: pointermove and pointerup are now handled separately based on actual button state
			// This allows for proper click vs drag detection
		}

		// Special handling for specific object types
		this.handleSpecificObjectTypes(this.hoveredObject, fakePointer, localX, localY, eventObject);
	}

	// Handle specific object types that need special treatment
	handleSpecificObjectTypes(obj, fakePointer, localX, localY, eventObject) {
		// Special handling for validation box
		if (obj === this.scene.validationBox) {
			console.log('Special handling for validation box click');
			// The validation box click should be handled by its pointerdown event
			// which calls this.scene.gameLogic.handleValidPlay()
		}
		
		// Special handling for table cards - ensure they get proper drag detection
		if (obj.isTableCard && obj.cardData) {
			console.log('Special handling for table card click');
			// Table cards need the drag threshold detection to work properly
			// The pointerdown -> pointermove -> pointerup sequence handles this
			// The TableManager.handleCardClickOnTable method should be called
		}
		
		// Special handling for hand cards
		if (obj.isHandCard) {
			console.log('Special handling for hand card click');
			// Hand cards should be handled by their standard events
		}
		
		// Special handling for deck sprite
		if (obj === this.scene.deckSprite) {
			console.log('Special handling for deck click');
			// Deck clicks should trigger card drawing
		}
		
		// Special handling for UI buttons
		if (obj === this.scene.endTurnButton || 
			obj === this.scene.restart || 
			obj === this.scene.sortRankButton || 
			obj === this.scene.sortSuitButton) {
			console.log('Special handling for UI button click');
			// UI buttons should be handled by their standard events
		}
	}

	simulatePointerUp() {
		if (!this.hoveredObject) return;

		const localX = this.cursor.x;
		const localY = this.cursor.y;

		// Create fake pointer event
		const fakePointer = {
			x: this.cursor.x,
			y: this.cursor.y,
			worldX: this.cursor.x,
			worldY: this.cursor.y,
			isDown: false,
			primaryDown: false,
			upTime: this.scene.time.now,
			downTime: this.aButtonPressTime || this.scene.time.now,
			button: 0,
			leftButtonDown: false,
			rightButtonDown: false,
			middleButtonDown: false,
			velocity: { x: 0, y: 0 }
		};

		const eventObject = {
			x: this.cursor.x,
			y: this.cursor.y,
			type: 'pointerup',
			event: fakePointer
		};

		console.log('simulatePointerUp called for object:', this.hoveredObject);
		
		// Emit pointerup event to the specific object
		if (this.hoveredObject && this.hoveredObject.emit) {
			this.hoveredObject.emit('pointerup', fakePointer, localX, localY, eventObject);
		}

		// IMPORTANT: Also emit to scene input for global up detection
		// This is critical for table card click/drag detection cleanup
		this.scene.input.emit('pointerup', fakePointer);
	}

	simulatePointerMove() {
		if (!this.hoveredObject) return;

		const localX = this.cursor.x;
		const localY = this.cursor.y;

		// Create fake pointer event for movement
		const fakePointer = {
			x: this.cursor.x,
			y: this.cursor.y,
			worldX: this.cursor.x,
			worldY: this.cursor.y,
			isDown: this.aButtonPressed,
			primaryDown: this.aButtonPressed,
			downTime: this.aButtonPressTime || this.scene.time.now,
			button: 0,
			leftButtonDown: this.aButtonPressed,
			rightButtonDown: false,
			middleButtonDown: false,
			velocity: { x: 0, y: 0 }
		};

		const eventObject = {
			x: this.cursor.x,
			y: this.cursor.y,
			type: 'pointermove',
			event: fakePointer
		};

		console.log('simulatePointerMove called for object:', this.hoveredObject);
		
		// Emit pointermove event to object if it has emit method
		if (this.hoveredObject && this.hoveredObject.emit) {
			const bounds = this.getObjectBounds(this.hoveredObject);
			const localX = bounds ? (this.cursor.x - bounds.x) : 0;
			const localY = bounds ? (this.cursor.y - bounds.y) : 0;
			this.hoveredObject.emit('pointermove', fakePointer, localX, localY, eventObject);
		}

		// IMPORTANT: Also emit to scene input for global move detection
		// This is critical for table card drag detection
		this.scene.input.emit('pointermove', fakePointer);
	}

	simulateClickPointermove() {
		// Send a pointermove event at the exact same position to simulate a clean click
		// This is important for table cards to detect it as a click (not drag)
		if (!this.hoveredObject) return;

		// Create fake pointer event with no actual movement
		const fakePointer = {
			x: this.aButtonStartPos.x, // Use the original press position
			y: this.aButtonStartPos.y,
			worldX: this.aButtonStartPos.x,
			worldY: this.aButtonStartPos.y,
			isDown: false, // Button is being released
			primaryDown: false,
			downTime: this.aButtonPressTime || this.scene.time.now,
			button: 0,
			leftButtonDown: false,
			rightButtonDown: false,
			middleButtonDown: false,
			velocity: { x: 0, y: 0 }
		};

		console.log('simulateClickPointermove - sending minimal move for click detection');
		
		// Emit to scene input for global move detection (table cards listen to this)
		this.scene.input.emit('pointermove', fakePointer);
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

	// Debug method to check what's under the cursor
	debugCursorObjects() {
		console.log('=== CURSOR DEBUG INFO ===');
		console.log('Input mode:', this.inputMode);
		console.log('Cursor position:', this.cursorX, this.cursorY);
		console.log('Cursor visible:', this.cursorVisible);
		console.log('Current hovered object:', this.hoveredObject?.constructor?.name);
		console.log('Current scene:', this.scene.scene.key);
		console.log('Mouse inactivity time:', this.mouseInactivityTime);
		
		// Check game state
		if (this.scene.scene.key === 'playScene') {
			console.log('Game state:');
			console.log('- Current player:', this.scene.currentPlayerIndex);
			console.log('- Cards selected:', this.scene.cardsSelected?.length || 0);
			console.log('- Drawn card:', this.scene.drawnCard);
			console.log('- Turn valid:', this.scene.turnValid);
		}
		
		// Check validation box specifically with detailed info
		if (this.scene.validationBox && this.scene.validationBoxContainer) {
			const container = this.scene.validationBoxContainer;
			const box = this.scene.validationBox;
			const bounds = this.getObjectBounds(box);
			console.log('=== VALIDATION BOX DETAILED INFO ===');
			console.log('- Container visible:', container.visible);
			console.log('- Container position:', container.x, container.y);
			console.log('- Container depth:', container.depth);
			console.log('- Box local position:', box.x, box.y);
			console.log('- Box size:', box.width, box.height);
			console.log('- Box displaySize:', box.displayWidth, box.displayHeight);
			console.log('- Box origin:', box.originX, box.originY);
			console.log('- Box interactive:', box.input?.enabled);
			console.log('- Box active:', box.active);
			console.log('- Box visible:', box.visible);
			console.log('- Calculated bounds:', bounds);
			console.log('- Cursor in bounds:', bounds && 
				this.cursorX >= bounds.x && this.cursorX <= bounds.x + bounds.width &&
				this.cursorY >= bounds.y && this.cursorY <= bounds.y + bounds.height);
			
			// Manual calculation check
			if (container.visible && box.input?.enabled) {
				const manualWorldX = container.x + box.x;
				const manualWorldY = container.y + box.y;
				const manualBounds = {
					x: manualWorldX - (box.width * box.originX),
					y: manualWorldY - (box.height * box.originY),
					width: box.width,
					height: box.height
				};
				console.log('- Manual calculation bounds:', manualBounds);
				console.log('- Manual cursor in bounds:', 
					this.cursorX >= manualBounds.x && this.cursorX <= manualBounds.x + manualBounds.width &&
					this.cursorY >= manualBounds.y && this.cursorY <= manualBounds.y + manualBounds.height);
			}
		}
		
		// List all interactive objects
		let interactiveObjects = [];
		if (this.scene.input?.manager?.list) {
			interactiveObjects = this.scene.input.manager.list;
		}
		
		console.log('Interactive objects:', interactiveObjects.length);
		interactiveObjects.forEach((obj, i) => {
			if (obj.active && obj.visible && obj.input?.enabled) {
				const bounds = this.getObjectBounds(obj);
				const inBounds = bounds && 
					this.cursorX >= bounds.x && this.cursorX <= bounds.x + bounds.width &&
					this.cursorY >= bounds.y && this.cursorY <= bounds.y + bounds.height;
				
				let objType = obj.constructor.name;
				if (obj.isTableCard) objType += ' (Table Card)';
				if (obj.isHandCard) objType += ' (Hand Card)';
				if (obj === this.scene.validationBox) objType += ' (Validation Box)';
				if (obj === this.scene.deckSprite) objType += ' (Deck)';
				
				console.log(`${i}: ${objType} - In bounds: ${inBounds}${bounds ? ` - Bounds: (${bounds.x},${bounds.y},${bounds.width}x${bounds.height})` : ''}`);
			}
		});
		console.log('========================');
	}

	// Destroy the controller system
	destroy() {
		if (this.cursor) {
			this.cursor.destroy();
		}
		
		// Clean up mouse event listeners
		if (this.scene.input) {
			this.scene.input.off('pointermove');
			this.scene.input.off('pointerdown');
		}
		
		// Restore default cursor
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('default');
		}
	}
}