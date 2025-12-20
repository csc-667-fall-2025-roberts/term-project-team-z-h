import { Card, Color, Value } from "./cards";
import {randomUUID} from "crypto";

const COLORS: Color[] = ["red", "yellow", "green", "blue"];
const NUMBER_VALUES: Value[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const ACTION_VALUES: Value[] = ["skip", "reverse", "draw2"]

export function createShuffledDeck(): Card[] {
    const deck: Card[] = [];

    for (const color of COLORS) {
        deck.push({ id: randomUUID(), color, value: "0" });
        
        for (let i = 1; i <= 9; i++) {
            const value = String(i) as Value;
            deck.push({ id: randomUUID(), color, value });
            deck.push({ id: randomUUID(), color, value });
        }
    }

    for (const color of COLORS) {
        for (const action of ACTION_VALUES) {
            deck.push({ id: randomUUID(), color, value: action });
            deck.push({ id: randomUUID(), color, value: action });
        }
    }

    // for wilds
    for (let i = 0; i < 4; i++) {
        deck.push({ id: randomUUID(), color: "wild", value: "wild" });
        deck.push({ id: randomUUID(), color: "wild", value: "wild_draw4" });
    }

    return shuffle(deck);
}

function shuffle(deck: Card[]): Card[] {
    for(let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        const temp = deck[i]!;
        deck[i] = deck[j]!;
        deck[j] = temp;
    }
    return deck;
}