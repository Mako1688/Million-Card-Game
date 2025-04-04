// Helper function to get the value of a rank, considering Aces high or low
export function getRankValue(rank) {
    if (rank === "A") {
        return 1; // For low Ace
    }
    if (rank === "2") {
        return 2;
    }
    if (rank === "3") {
        return 3;
    }
    if (rank === "4") {
        return 4;
    }
    if (rank === "5") {
        return 5;
    }
    if (rank === "6") {
        return 6;
    }
    if (rank === "7") {
        return 7;
    }
    if (rank === "8") {
        return 8;
    }
    if (rank === "9") {
        return 9;
    }
    if (rank === "10") {
        return 10;
    }
    if (rank === "J") {
        return 11;
    }
    if (rank === "Q") {
        return 12;
    }
    if (rank === "K") {
        return 13;
    }
}

export function checkValidGroup(cards = []) {
    if (cards.length < 3) {
        return false;
    }

    const ranks = cards.map((card) => card.card.rank);
    const suits = cards.map((card) => card.card.suit);
    const uniqueRanks = new Set(ranks);
    const uniqueSuits = new Set(suits);

    if (uniqueRanks.size === 1 && uniqueSuits.size === cards.length) {
        return true;
    }

    if (uniqueSuits.size === 1) {
        const sortedRanks = cards
            .map((card) => this.getRankValue(card.card.rank))
            .sort((a, b) => a - b);

        for (let i = 1; i < sortedRanks.length; i++) {
            if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
                return false;
            }
        }
        return true;
    }

    return false;
}