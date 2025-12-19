import { stat } from "fs";
import { GameState } from "./gameState";

export function sanitizePublic(state: GameState) {
    const  topCard = state.discard[state.discard.length-1]!;

    return {
        gameId: state.gameId, topCard,
        deckCount: state.deck.length,
        direction: state.direction,
        currentTurnPlayerId: state.players[state.currentTurn],
        players: state.players.map((pid) => ({
            userId: pid,
            handCount: state.hands[pid]?.length ?? 0
        })),
    };
}

export function sanitizePrivate(state: GameState, viewerId: number) {
    return {
        gameId: state.gameId,
        yourHand: state.hands[viewerId] ?? []
    };
}