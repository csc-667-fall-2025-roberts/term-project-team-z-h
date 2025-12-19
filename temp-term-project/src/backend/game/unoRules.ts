import { Card, Color } from "./cards";



export function canPlayCard(
    card: Card,
    topCard: Card,
    currentColor: Card["color"]): boolean {
    if (card.color === "wild") return true;
    return card.color === currentColor || card.value === topCard.value;
}