import './chat';
import './game-chat';

console.log('App initialized!');



// src/frontend/entrypoint.ts

declare const io: any;

type PublicState = {
  gameId: number;
  topCard: { color: string; value: string };
  deckCount: number;
  direction: 1 | -1;
  currentTurnPlayerId: number;
  players: { userId: number; handCount: number }[];
};

type PrivateState = {
  gameId: number;
  yourHand: { id: string; color: string; value: string }[];
};

const gameId: number = (window as any).GAME_ID;
const socket = io();

let publicState: PublicState | null = null;
let privateState: PrivateState | null = null;


function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

// rendering 
function render() {
  if (!publicState) return;

  // status
  $("status").textContent =
    `Turn: Player ${publicState.currentTurnPlayerId} ` +
    `| Direction: ${publicState.direction === 1 ? "→" : "←"}`;

  // top card
  const top = $("topCard");
  top.className = `card card-${publicState.topCard.color}`;
  top.textContent = publicState.topCard.value.toUpperCase();

  // deck count
  $("deckCount").textContent = String(publicState.deckCount);

  // players
  const players = $("players");
  players.innerHTML = "";
  for (const p of publicState.players) {
    const div = document.createElement("div");
    div.className = "opponent-hand";
    div.textContent = `Player ${p.userId} — ${p.handCount} cards` +
      (p.userId === publicState.currentTurnPlayerId ? " (TURN)" : "");
    players.appendChild(div);
  }

  // player hand
  const hand = $("hand");
  hand.innerHTML = "";
  for (const c of privateState?.yourHand ?? []) {
    const card = document.createElement("div");
    card.className = `card card-${c.color}`;
    card.textContent = c.value.toUpperCase();
    card.onclick = () => {
      socket.emit("game:playCard", { gameId, cardId: c.id });
    };
    hand.appendChild(card);
  }
}

// socket
socket.on("connect", () => {
  socket.emit("game:join", { gameId });
});

socket.on("game:public", (state: PublicState) => {
  publicState = state;
  render();
});

socket.on("game:private", (state: PrivateState) => {
  privateState = state;
  render();
});

socket.on("game:state", (payload: any) => {
  $("status").textContent =
    payload?.status === "waiting"
      ? "Waiting for host to start the game…"
      : "Loading…";
});

socket.on("game:error", (err: any) => {
  const msg =
    typeof err === "string"
      ? err
      : err?.message ?? JSON.stringify(err);
  alert(msg);
  console.error("game:error", err);
});

// buttons
$("startBtn").addEventListener("click", () => {
  socket.emit("game:start", { gameId });
});

$("drawBtn").addEventListener("click", () => {
  socket.emit("game:draw", { gameId });
});
