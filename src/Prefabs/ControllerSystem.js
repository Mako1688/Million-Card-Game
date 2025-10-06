class ControllerSystem {
	constructor(scene) {
		this.scene = scene;
		this.gamepad = null;
		this.cursorSpeed = 600;
		this.deadzone = 0.2;
		this.cursorVisible = false;
		this.botTurnActive = false;
		
		this.inputMode = 'mouse';
		this.lastMouseX = 0;
		this.lastMouseY = 0;
		this.mouseInactivityTime = 0;
		this.MOUSE_INACTIVITY_THRESHOLD = 2000;
		
		this.cursorX = this.scene.scale.width / 2;
		this.cursorY = this.scene.scale.height / 2;
		
		this.previousButtonStates = {};
		this.buttonRepeatTimers = {};
		
		this.aButtonPressed = false;
		this.aButtonPressTime = 0;
		this.aButtonStartPos = { x: 0, y: 0 };
		
		this.hoveredObject = null;
		
		this.initializeController();
		this.createVirtualCursor();
		this.setupMouseDetection();
		this.detectGamepad();
	}

	initializeController() {
		this.detectGamepad();
		
		this.scene.input.gamepad.on('connected', (pad) => {
			this.gamepad = pad;
			this.showCursor();
		});

		this.scene.input.gamepad.on('disconnected', (pad) => {
			if (this.gamepad === pad) {
				this.gamepad = null;
				this.hideCursor();
			}
		});
	}

	detectGamepad() {
		if (this.scene.input.gamepad.total > 0) {
			this.gamepad = this.scene.input.gamepad.getPad(0);
		} else {
			this.hideCursor();
		}
	}

	setupMouseDetection() {
		if (this.scene.input.activePointer) {
			this.lastMouseX = this.scene.input.activePointer.x;
			this.lastMouseY = this.scene.input.activePointer.y;
		}
		
		this.scene.input.on('pointermove', (pointer) => {
			this.onMouseMove(pointer.x, pointer.y);
		});
		
		this.scene.input.on('pointerdown', () => {
			this.switchToMouseMode();
		});
	}

	onMouseMove(x, y) {
		const deltaX = Math.abs(x - this.lastMouseX);
		const deltaY = Math.abs(y - this.lastMouseY);
		
		if (deltaX > 5 || deltaY > 5) {
			this.lastMouseX = x;
			this.lastMouseY = y;
			this.mouseInactivityTime = 0;
			this.switchToMouseMode();
		}
	}

	switchToMouseMode() {
		if (this.inputMode !== 'mouse') {
			this.inputMode = 'mouse';
			this.hideCursor();
			this.enableMouseInteractions();
		}
	}

	switchToControllerMode() {
		if (this.inputMode !== 'controller') {
			this.inputMode = 'controller';
			this.showCursor();
			this.disableMouseInteractions();
		}
	}

	enableMouseInteractions() {
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('default');
		}
	}

	disableMouseInteractions() {
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('none');
		}
	}

	createVirtualCursor() {
		try {
			this.cursor = this.scene.add.graphics();
			this.cursor.setDepth(10000);
			
			this.cursor.clear();
			
			this.cursor.lineStyle(3, 0xffffff, 1);
			this.cursor.strokeCircle(0, 0, 10);
			this.cursor.moveTo(-8, 0);
			this.cursor.lineTo(8, 0);
			this.cursor.moveTo(0, -8);
			this.cursor.lineTo(0, 8);
			
			this.cursor.lineStyle(6, 0x00ff00, 0.4);
			this.cursor.strokeCircle(0, 0, 15);
			
			this.cursor.fillStyle(0xffffff, 1);
			this.cursor.fillCircle(0, 0, 2);
			
			this.cursor.setPosition(this.cursorX, this.cursorY);
			this.cursor.setVisible(false);
		} catch (e) {
			console.error('Failed to create virtual cursor:', e);
		}
	}

	showCursor() {
		this.cursorVisible = true;
		if (this.cursor) {
			this.cursor.setVisible(true);
		}
		
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('none');
		}
	}

	hideCursor() {
		this.cursorVisible = false;
		if (this.cursor) {
			this.cursor.setVisible(false);
		}
		
		if (this.scene.input) {
			this.scene.input.setDefaultCursor('default');
		}
	}

	update(time, delta) {
		if (!this.gamepad) {
			this.detectGamepad();
			return;
		}

		if (!this.gamepad.connected) {
			this.gamepad = null;
			this.switchToMouseMode();
			return;
		}

		if (this.botTurnActive) {
			return;
		}

		this.updateInputMode(delta);

		if (this.inputMode === 'controller') {
			this.updateCursorPosition(delta);
			this.handleButtonInputs();
			this.updateHoverState();
		}
	}

	updateInputMode(delta) {
		if (this.inputMode === 'mouse') {
			this.mouseInactivityTime += delta;
		}

		if (this.gamepad && this.inputMode === 'mouse') {
			const leftStick = this.gamepad.leftStick;
			const hasStickInput = Math.abs(leftStick.x) > this.deadzone || Math.abs(leftStick.y) > this.deadzone;
			
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

			if (hasStickInput || hasButtonInput) {
				this.switchToControllerMode();
			}
		}
	}

	updateCursorPosition(delta) {
		if (!this.gamepad || !this.cursorVisible || this.inputMode !== 'controller') return;

		const leftStick = this.gamepad.leftStick;
		
		let x = Math.abs(leftStick.x) > this.deadzone ? leftStick.x : 0;
		let y = Math.abs(leftStick.y) > this.deadzone ? leftStick.y : 0;

		x = Math.sign(x) * Math.pow(Math.abs(x), 1.5);
		y = Math.sign(y) * Math.pow(Math.abs(y), 1.5);

		const deltaTime = delta / 1000;
		this.cursorX += x * this.cursorSpeed * deltaTime;
		this.cursorY += y * this.cursorSpeed * deltaTime;

		this.cursorX = Phaser.Math.Clamp(this.cursorX, 0, this.scene.scale.width);
		this.cursorY = Phaser.Math.Clamp(this.cursorY, 0, this.scene.scale.height);

		if (this.cursor) {
			this.cursor.setPosition(this.cursorX, this.cursorY);
		}
	}

	handleButtonInputs() {
		if (!this.gamepad || this.inputMode !== 'controller') return;

		const aButton = this.gamepad.buttons[0];
		if (aButton && aButton.pressed && !this.aButtonPressed) {
			this.aButtonPressed = true;
			this.aButtonPressTime = Date.now();
			this.aButtonStartPos = { x: this.cursor.x, y: this.cursor.y };
			this.simulatePointerDown();
		} else if (aButton && !aButton.pressed && this.aButtonPressed) {
			this.aButtonPressed = false;
			const pressDuration = Date.now() - this.aButtonPressTime;
			const moveDistance = Phaser.Math.Distance.Between(
				this.aButtonStartPos.x, 
				this.aButtonStartPos.y,
				this.cursor.x, 
				this.cursor.y
			);
			
			if (pressDuration < 300 && moveDistance < 10) {
				this.simulateClickPointermove();
			}
			this.simulatePointerUp();
		} else if (aButton && aButton.pressed && this.aButtonPressed) {
			const pressDuration = Date.now() - this.aButtonPressTime;
			const moveDistance = Phaser.Math.Distance.Between(
				this.aButtonStartPos.x, 
				this.aButtonStartPos.y,
				this.cursor.x, 
				this.cursor.y
			);
			
			if (pressDuration > 100 || moveDistance > 3) {
				this.simulatePointerMove();
			}
		}

		this.handleButtonByIndex(1, () => this.simulateRightClick());
		this.handleButtonByIndex(2, () => this.simulateSpecialAction());
		this.handleButtonByIndex(3, () => this.simulateContextAction());
		this.handleButtonByIndex(4, () => this.handleQuickSort('rank'));
		this.handleButtonByIndex(5, () => this.handleQuickSort('suit'));

		this.handleDPadInputs();
	}

	handleButtonByIndex(buttonIndex, callback) {
		if (!this.gamepad || !this.gamepad.buttons || !this.gamepad.buttons[buttonIndex]) return;

		try {
			const button = this.gamepad.buttons[buttonIndex];
			const isPressed = button.pressed;
			const wasPressed = this.previousButtonStates[buttonIndex] || false;

			if (isPressed && !wasPressed) {
				callback();
			}

			this.previousButtonStates[buttonIndex] = isPressed;
		} catch (e) {
			console.warn(`Error handling button ${buttonIndex}:`, e);
		}
	}

	handleButton(buttonName, callback) {
		const buttonMap = {
			'A': 0, 'a': 0, 'B': 1, 'b': 1, 'X': 2, 'x': 2, 'Y': 3, 'y': 3,
			'L1': 4, 'l1': 4, 'LB': 4, 'lb': 4, 'R1': 5, 'r1': 5, 'RB': 5, 'rb': 5,
			'L2': 6, 'l2': 6, 'LT': 6, 'lt': 6, 'R2': 7, 'r2': 7, 'RT': 7, 'rt': 7,
			'select': 8, 'back': 8, 'start': 9,
			'L3': 10, 'l3': 10, 'LS': 10, 'ls': 10, 'R3': 11, 'r3': 11, 'RS': 11, 'rs': 11,
			'up': 12, 'down': 13, 'left': 14, 'right': 15
		};

		const buttonIndex = buttonMap[buttonName];
		if (buttonIndex !== undefined) {
			this.handleButtonByIndex(buttonIndex, callback);
		}
	}

	handleDPadInputs() {
		this.handleButtonByIndex(12, () => this.handleDPadNavigation('up'));
		this.handleButtonByIndex(13, () => this.handleDPadNavigation('down'));
		this.handleButtonByIndex(14, () => this.handleDPadNavigation('left'));
		this.handleButtonByIndex(15, () => this.handleDPadNavigation('right'));
	}

	updateHoverState() {
		if (!this.cursorVisible || this.inputMode !== 'controller') return;

		let interactiveObjects = [];
		
		if (this.scene.input && this.scene.input.manager && this.scene.input.manager.list) {
			interactiveObjects = [...this.scene.input.manager.list];
		}
		
		if (this.scene.children && this.scene.children.list) {
			const sceneInteractives = this.scene.children.list.filter(obj => 
				obj.input && obj.input.enabled && obj.active && obj.visible
			);
			sceneInteractives.forEach(obj => {
				if (!interactiveObjects.includes(obj)) {
					interactiveObjects.push(obj);
				}
			});
		}

		if (this.scene.validationBox && 
			this.scene.validationBoxContainer && 
			this.scene.validationBoxContainer.visible &&
			this.scene.validationBox.input && 
			this.scene.validationBox.input.enabled &&
			!interactiveObjects.includes(this.scene.validationBox)) {
			interactiveObjects.push(this.scene.validationBox);
		}

		interactiveObjects.sort((a, b) => {
			let depthA = a.depth || 0;
			let depthB = b.depth || 0;
			
			if (a.parentContainer) depthA += a.parentContainer.depth || 0;
			if (b.parentContainer) depthB += b.parentContainer.depth || 0;
			
			return depthB - depthA;
		});

		let newHoveredObject = null;

		for (let i = 0; i < interactiveObjects.length; i++) {
			const obj = interactiveObjects[i];
			
			if (!obj.input || !obj.input.enabled || !obj.active || !obj.visible) {
				continue;
			}
			
			if (obj.parentContainer && !obj.parentContainer.visible) {
				continue;
			}
			
			let bounds = this.getObjectBounds(obj);

			if (bounds && this.cursorX >= bounds.x && 
				this.cursorX <= bounds.x + bounds.width &&
				this.cursorY >= bounds.y && 
				this.cursorY <= bounds.y + bounds.height) {
				newHoveredObject = obj;
				break;
			}
		}

		if (this.hoveredObject !== newHoveredObject) {
			if (this.hoveredObject && this.hoveredObject.emit) {
				this.hoveredObject.emit('pointerout');
			}

			if (newHoveredObject && newHoveredObject.emit) {
				newHoveredObject.emit('pointerover');
			}

			this.hoveredObject = newHoveredObject;
		}
	}

	getObjectBounds(obj) {
		try {
			if (obj.getBounds) {
				return obj.getBounds();
			}

			const width = obj.displayWidth || obj.width || 0;
			const height = obj.displayHeight || obj.height || 0;
			const originX = obj.originX !== undefined ? obj.originX : 0.5;
			const originY = obj.originY !== undefined ? obj.originY : 0.5;
			
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
		if (!this.hoveredObject) {
			return;
		}

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
			isDown: false,
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

		const bounds = this.getObjectBounds(this.hoveredObject);
		const localX = bounds ? (this.cursorX - bounds.x) : 0;
		const localY = bounds ? (this.cursorY - bounds.y) : 0;

		if (this.hoveredObject.emit) {
			fakePointer.isDown = true;
			fakePointer.primaryDown = true;
			fakePointer.downTime = this.scene.time.now;
			this.hoveredObject.emit('pointerdown', fakePointer, localX, localY, eventObject);
		}

		this.handleSpecificObjectTypes(this.hoveredObject, fakePointer, localX, localY, eventObject);
	}

	handleSpecificObjectTypes(obj, fakePointer, localX, localY, eventObject) {
		// Special cases are handled by their respective event listeners
		// No specific handling needed here as the pointerdown events will trigger the correct behaviors
	}

	simulatePointerUp() {
		if (!this.hoveredObject) return;

		const localX = this.cursor.x;
		const localY = this.cursor.y;

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

		if (this.hoveredObject && this.hoveredObject.emit) {
			this.hoveredObject.emit('pointerup', fakePointer, localX, localY, eventObject);
		}

		this.scene.input.emit('pointerup', fakePointer);
	}

	simulatePointerMove() {
		if (!this.hoveredObject) return;

		const localX = this.cursor.x;
		const localY = this.cursor.y;

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

		if (this.hoveredObject && this.hoveredObject.emit) {
			const bounds = this.getObjectBounds(this.hoveredObject);
			const localX = bounds ? (this.cursor.x - bounds.x) : 0;
			const localY = bounds ? (this.cursor.y - bounds.y) : 0;
			this.hoveredObject.emit('pointermove', fakePointer, localX, localY, eventObject);
		}

		this.scene.input.emit('pointermove', fakePointer);
	}

	simulateClickPointermove() {
		if (!this.hoveredObject) return;

		const fakePointer = {
			x: this.aButtonStartPos.x,
			y: this.aButtonStartPos.y,
			worldX: this.aButtonStartPos.x,
			worldY: this.aButtonStartPos.y,
			isDown: false,
			primaryDown: false,
			downTime: this.aButtonPressTime || this.scene.time.now,
			button: 0,
			leftButtonDown: false,
			rightButtonDown: false,
			middleButtonDown: false,
			velocity: { x: 0, y: 0 }
		};

		this.scene.input.emit('pointermove', fakePointer);
	}

	simulateRightClick() {
		// Could be used for context menus or alternate actions
	}

	simulateSpecialAction() {
		if (this.scene.scene.key === 'playScene') {
			if (this.scene.deckSprite && this.scene.cardSystem.canDrawCard()) {
				this.scene.cardSystem.drawCard();
			}
		}
	}

	simulateContextAction() {
		if (this.scene.scene.key === 'playScene') {
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
	}

	getCursorPosition() {
		return { x: this.cursorX, y: this.cursorY };
	}

	isConnected() {
		return this.gamepad !== null;
	}

	destroy() {
		if (this.cursor) {
			this.cursor.destroy();
		}
		
		if (this.scene.input) {
			this.scene.input.off('pointermove');
			this.scene.input.off('pointerdown');
			this.scene.input.setDefaultCursor('default');
		}
	}
}