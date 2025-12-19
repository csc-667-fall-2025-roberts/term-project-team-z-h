import { setGame, getGame } from "./gameState";
import { Card } from "./cards";
import db from "../db/connection";
import { createShuffledDeck } from "./deck";
import { error } from "console";
import { canPlayCard } from "./unoRules";

export async function initializeGame(gameId: number) {
    const players = await db.any(
        `SELECT user_id FROM game_players WHERE game_id = $1`,
        [gameId]
    );

    const playerIds: number[] = players.map((p: any) => Number(p.user_id));
    if(playerIds.some(n=> Number.isNaN(n))) {
        throw new Error("Bad player ids in database!");
    }

    if(players.length < 2) {
        throw new Error("Not enough players!");
    }

    const deck = createShuffledDeck();
    const hands: Record<number, Card[]> = {};

    for(const p of playerIds) {
        hands[p] = deck.splice(0,7);
    }

    let topCard = deck.pop()!;
    while(topCard.value === "wild_draw4" || topCard.value === "wild"){
        deck.unshift(topCard);
        topCard = deck.pop()!;
    }

    setGame(gameId, {
        gameId,
        players: playerIds,
        hands,
        deck,
        discard: [topCard],
        currentTurn: 0,
        direction: 1,
        pendingDraw: 0,
        currentColor: topCard.color
    });
}


export async function startGame(gameId: number, userId: number) {
    // validate game 
    const gameRow = await db.oneOrNone(
        `SELECT id, created_by, state FROM games WHERE id = $1`,
        [gameId]
    );
    if(!gameRow) throw new Error("Game not found");
    if (gameRow.state !== "waiting") throw new Error("Game already started");

    // validate the user is in the game
    const member = await db.oneOrNone(
        `SELECT 1 FROM game_players WHERE game_id = $1 AND user_id = $2`,
        [gameId, userId]
    );
    if(!member) throw new Error("Not a player in the game");

    // only the creator can start the game
    if (Number(gameRow.created_by) !== userId) throw new Error("Only Host Can Start!");

    // Move state to tplaying 
    await db.none(`UPDATE games SET state = 'playing' WHERE id = $1`,
        [gameId]
    );

    // init memory state
    await initializeGame(gameId);

    // return the created state
    return getGame(gameId);
}

function nextPlayerIndex(game: ReturnType<typeof getGame>, steps = 1){
    const n = game.players.length;
    const dir = game.direction;
    return (game.currentTurn + dir * steps + n * 10) % n;
}


export async function playCard(
    userId: number, 
    gameId: number, 
    cardId: string,
    chosenColor?: "red" | "yellow" | "green" | "blue"
) {

    const gameRow = await db.oneOrNone(`SELECT state FROM games WHERE id=$1`,[gameId]);
    if(gameRow?.state == "finished") throw new Error("Game is finished!");
    
    const game = getGame(gameId);

    const member = await db.oneOrNone(
        `SELECT 1 
        FROM game_players 
        WHERE game_id = $1 AND user_id = $2`,
        [gameId, userId]
    );
    if(!member) throw new Error("Not a player");

    // turn check
    const currentPlayerId = game.players[game.currentTurn];
    if(currentPlayerId !== userId) throw new Error("Not your turn!");

    // find the card in users hand
    const hand = game.hands[userId] ?? [];
    const idx = hand.findIndex(c => c.id === cardId);
    if(idx === -1) throw new Error("Card not in your hand!");

    const card = hand.find(c => c.id === cardId);

    if(!card) throw new Error("Card not in your hand");

    const top = game.discard[game.discard.length-1]!;
    const currentColor = game.currentColor;

    if (!canPlayCard(card, top, currentColor)) {
        throw new Error (`Cannot play that card ${card.color} ${card.value}`);
    }

    if (card.color === "wild" && !chosenColor) {
        throw new Error("Must choose a color for Wild card");
    }

    // remove from hand place on discard

    game.hands[userId] = hand.filter(c=> c.id !== cardId);
    game.discard.push(card);

    if(card.color === "wild"){
        if(!chosenColor) throw new Error("Must be a color for wild");
        game.currentColor = chosenColor;
    } else {
        game.currentColor = card.color;
    }

    // apply 
    if(card.value === "reverse") {
        game.direction = (game.direction === 1 ? -1 : 1);
        game.currentTurn = nextPlayerIndex(game, 1);

    } else if (card.value === "skip") {
        game.currentTurn = nextPlayerIndex(game, 2);

    } else if (card.value === "draw2") {
        const targetId = game.players[nextPlayerIndex(game, 1)]!;

        const targetHand = game.hands[targetId];
        if(!targetHand) throw new Error("Target hand missing (state corrupt)");
        targetHand.push(...game.deck.splice(0,2));

        game.currentTurn = nextPlayerIndex(game, 2);
    } else if (card.value === "wild_draw4") {
        const targetId = game.players[nextPlayerIndex(game,1)]!;
        const targetHand = game.hands[targetId];
        if(!targetHand) throw new Error("Target hand missing state");

        targetHand.push(...game.deck.splice(0, 4));
        game.currentTurn = nextPlayerIndex(game, 2);
    } else if (card.value === "wild") {
        game.currentTurn = nextPlayerIndex(game, 1);
    } else {
        // number card
        game.currentTurn = nextPlayerIndex(game,1);
    }
    // check for a win
    if( game.hands[userId]?.length === 0 ) {
        await db.none(
            `UPDATE games SET state='finished' WHERE id=$1`,
            [gameId]
        );
        (game as any).winner = userId;
    }
    return game;
}



export async function drawCard(userId: number, gameId: number) {
  const game = getGame(gameId);

  const member = await db.oneOrNone(
    `SELECT 1 FROM game_players WHERE game_id=$1 AND user_id=$2`,
    [gameId, userId]
  );
  if (!member) throw new Error("Not a player");

  const currentPlayerId = game.players[game.currentTurn];
  if (currentPlayerId !== userId) throw new Error("Not your turn");

  if(game.deck.length === 0) {
    console.log("Deck is empty, reshuffling the pile ");

    if(game.discard.length <= 1){
        throw new Error ("No cards left to draw!");
    }

    const topCard = game.discard.pop()!;
    game.deck = [...game.discard];
    game.discard = [topCard];

    for (let i = game.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [game.deck[i], game.deck[j]] = [game.deck[j]!, game.deck[i]!];
    }
  }

/*
  // If deck empty, reshuffle discard into deck (keep top card)
  if (game.deck.length === 0 && game.discard.length > 1) {
    const top = game.discard.pop()!;
    game.deck = game.discard;
    game.discard = [top];
    // shuffle
    for (let i = game.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = game.deck[i]!;
      game.deck[i] = game.deck[j]!;
      game.deck[j] = tmp;
    }

    console.log("Deck has been reshuffled")
  }
*/

  const drawn = game.deck.shift();
  if (!drawn) throw new Error("No cards left to draw");

  game.hands[userId]?.push(drawn);

  // MVP rule: drawing ends your turn immediately
  game.currentTurn = nextPlayerIndex(game, 1);

  return game;
}


export async function callUno(userId: number, gameId: number) {
    const game = getGame(gameId);
    
    const member = await db.oneOrNone(
        `SELECT 1 FROM game_players WHERE game_id=$1 AND user_id=$2`,
        [gameId, userId]
    );
    if (!member) throw new Error("Not a player");
    
    const hand = game.hands[userId];
    if (!hand || hand.length !== 1) {
        throw new Error("Can only call UNO with exactly 1 card!");
    }
    
    console.log(`🎉 Player ${userId} called UNO!`);
    
    return game;
}