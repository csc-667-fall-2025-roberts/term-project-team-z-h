import { Card, Color } from "./cards";

export type GameState = {
    gameId: number;
    players: number[];
    hands: Record<number, Card[]>;
    deck: Card[];
    discard: Card[];
    currentTurn: number;
    direction: 1 | -1;
    pendingDraw: number;
    currentColor: Color;
};

const games = new Map<number, GameState>();

export function getGame(gameId: number): GameState {
    const game = games.get(gameId);
    if(!game){
        throw new Error("Game not found!");
    }
    return game;
}

export function setGame(gameId: number, state: GameState) {
    games.set(gameId, state);
}
