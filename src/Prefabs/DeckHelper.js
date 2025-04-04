export function createDeck() {
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push(this.createCard(suit, rank));
            deck.push(this.createCard(suit, rank));
        }
    }
    return deck;
}

export function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function dealCards() {
    for (let i = 0; i < 7; i++) {
        this.dealCardToPlayer(this.p1Hand);
        this.dealCardToPlayer(this.p2Hand);
    }
}

export function createCard(suit, rank) {
    return { card: { suit, rank }, table: false };
}



export function dealCardToPlayer(hand) {
    const card = this.deck.pop();
    card.originalPosition = { type: "hand" };
    hand.push(card);
}