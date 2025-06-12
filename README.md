# Million Card Game
by Marco Ogaz-Vega in dedication to Lois Million Zerai <3

## Overview

**Million Card Game** is a card game built with [Phaser 3](https://phaser.io/), JavaScript, and HTML5. The game features interactive card play, animated effects, and a responsive interface. Players compete to be the first to empty their hand by forming valid groups on the table.

---

## Rules

- The game uses two standard decks of cards.
- Each player starts with 7 cards in their hand.
- Players take turns. On their turn, a player may:
  - Draw a card from the deck **or**
  - Place a group of cards from their hand onto the table.
- **Groups** must be:
  - At least 3 cards.
  - Either a **set** (all cards of the same rank, different suits) or a **run** (consecutive ranks, same suit; Ace can be high or low).
- Players can temporarily take cards from the table into their hand to make new valid groups, but all cards taken must be placed back on the table during the same turn (not necessarily in the same spot).
- Only one card can be drawn per turn, and you cannot draw after placing cards.
- The table must always contain only valid groups.
- The first player to have no cards left in their hand wins.

---

## Gameplay Features

- **Interactive Hand:** Select, hover, and drag cards with smooth animations and wave effects.
- **Table Groups:** Place, drag, and rearrange groups of cards on the table. Groups are validated in real time.
- **Validation:** When a valid group is selected, a confirmation box appears.
- **Turn System:** Clearly displays whose turn it is.
- **Sorting:** Sort your hand by rank or suit with a single click.
- **Reset:** Reset the table and hand (if no card has been drawn this turn).
- **Visual Feedback:** Cards flash green when selected, red when invalid, and wave gently for a lively feel.
- **Responsive Design:** Works on different screen sizes.

---

## Technologies Used

- **Phaser 3** (game engine)
- **JavaScript** (game logic)
- **HTML5** (canvas and UI)
- **CSS** (styling, if applicable)
- **Audio** (to be added)

---

## Code Structure & Functionality

- **Scenes:** Modular scene system (Play, Win, Title, Credits planned).
- **Card Logic:** Card and group validation, drag-and-drop, and animated effects.
- **UI:** Buttons for sorting, ending turn, resetting, and drawing cards.
- **Animations:** Wave motion for cards, animated color feedback for selection and validation.
- **Game State:** Turn management, win detection, and reset logic.

---

## TODO

- [ ] **Credits Scene:** Display game credits and acknowledgments.
- [ ] **Win Scene:** Show the winner and allow restarting the game.
- [ ] **Title Scene:** Main menu with start, instructions, and credits.
- [ ] **Audio:** Add sound effects and background music for actions and feedback.
- [ ] **Polish:** Additional visual effects, bug fixes, and performance improvements.
- [ ] **Appification:** Make game instalable on an iphone on the home screen.
- [ ] **Multiplayer:** Add multiplayer functionality (communication between devices)

---

## License

This project is for educational and entertainment purposes.

---

## Acknowledgments

- Built with [Phaser 3](https://phaser.io/).
- Backend and Frontend Implementation by Marco
- Art assets from Lois <3
- Special thanks to open-source contributors and the Phaser community.

---