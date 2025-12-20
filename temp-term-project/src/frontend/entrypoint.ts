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
const currentUserId: number = (window as any).CURRENT_USER_ID;
const socket = io();

let publicState: PublicState | null = null;
let privateState: PrivateState | null = null;
let playerNames: Record<number, string> = {}; 


function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
}

function formatCardValue(value: string): string {
  const valueMap: Record<string, string> = {
      'wild': 'WILD',
      'wild_draw4': '+4',
      'draw2': '+2',
      'skip': 'SKIP',
      'reverse': 'REV',
    };
  return valueMap[value.toLowerCase()] || value.toUpperCase();
}

function showColorPicker(cardId: string): Promise<string> {
  return new Promise((resolve) => {
    const modal = $("colorPickerModal");
    modal.style.display = "flex";

    const buttons = modal.querySelectorAll(".color-btn");
    
    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const color = target.getAttribute("data-color");
      
      if (color) {
        modal.style.display = "none";
        
        buttons.forEach(btn => {
            btn.removeEventListener("click", clickHandler);
        });
        
        resolve(color);
      }
    };

    buttons.forEach(btn => {
      btn.addEventListener("click", clickHandler);
    });
  });
}


async function loadPlayerNames() {
  try {
    const response = await fetch(`/games/${gameId}/players`);
    const players = await response.json();
    players.forEach((p: any) => {
    playerNames[p.user_id] = p.username;
    });
  } catch (err) {
    console.error("❌ Failed to load player names:", err);
  }
}

// rendering 
function render() {
  if (!publicState) return;

  const isMyTurn = publicState.currentTurnPlayerId === currentUserId;
  const directionArrow = publicState.direction === 1 ? '-->' : '<--';
  const currentPlayerName = playerNames[publicState.currentTurnPlayerId] || `Player ${publicState.currentTurnPlayerId}`;

  // status
  $("status").textContent =
  `Turn: ${currentPlayerName} | Direction: ${directionArrow}`;
  
  // top card
  const top = $("topCard");
  top.className = `card card-${publicState.topCard.color}`;
  top.textContent = formatCardValue(publicState.topCard.value);

  // deck count
  $("deckCount").textContent = String(publicState.deckCount);

  // players
  const players = $("players");
  players.innerHTML = "";
  for (const p of publicState.players) {
    if (p.userId === currentUserId) continue; 
    const div = document.createElement("div");
    div.className = "opponent-hand";
    const playerName = playerNames[p.userId] || `Player ${p.userId}`;
    const turnIndicator = p.userId === publicState.currentTurnPlayerId ? " (TURN)" : "";

    const catchButton = p.handCount === 1 
      ? `<button class="btn-catch-uno" data-player-id="${p.userId}">Catch UNO!</button>`
      : "";

    div.innerHTML = `
      <span class="player-name">${playerName}</span>
      <div class="card-count">${p.handCount} cards${turnIndicator}</div>
      ${catchButton}
    `;
    players.appendChild(div);
  }

  document.querySelectorAll('.btn-catch-uno').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = parseInt((e.target as HTMLElement).getAttribute('data-player-id') || '0');
      socket.emit('game:catchUno', { gameId, targetId });
    });
  });

  // player hand
  const hand = $("hand");
  hand.innerHTML = "";
  hand.className = isMyTurn ? "cards-in-hand my-turn" : "cards-in-hand";
  for (const c of privateState?.yourHand ?? []) {
    const card = document.createElement("div");
    card.className = `card card-${c.color}`;
    card.textContent = formatCardValue(c.value);
    card.onclick = async () => {
      if (!isMyTurn) {
        alert("It's not your turn!");
        return;
      }
      let chosenColor: string | undefined;
        if (c.color === "wild") {
        chosenColor = await showColorPicker(c.id);
        console.log(`Chosen color: ${chosenColor}`);
      }
      socket.emit("game:playCard", { 
        gameId, 
        cardId: c.id,
        chosenColor 
      });
    };
    hand.appendChild(card);
  }
}

// socket
socket.on("connect", () => {
  socket.emit("game:join", { gameId });
  loadPlayerNames().then(() => render());
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

socket.on('game:unoCall', (data: { userId: number }) => {
  const playerName = playerNames[data.userId] || `Player ${data.userId}`;
  const status = $('status');
  status.textContent += ` | ${playerName} called UNO!`;
  setTimeout(() => render(), 2000);
});

socket.on('game:unoCaught', (data: { catcherId: number; caughtPlayerId: number }) => {
  const catcherName = playerNames[data.catcherId] || `Player ${data.catcherId}`;
  const caughtName = playerNames[data.caughtPlayerId] || `Player ${data.caughtPlayerId}`;
  
  alert(`😱 ${catcherName} caught ${caughtName} without calling UNO!\n\n${caughtName} must draw 2 cards`);
  render();
});

socket.on('game:winner', (data: { winnerId: number }) => {
  const winnerName = playerNames[data.winnerId] || `Player ${data.winnerId}`;
  
  if (data.winnerId === currentUserId) {
    alert('🎉 YOU WON! 🎉\n\nCongratulations!');
  } else {
    alert(`Game Over!\n\n${winnerName} wins!\n\nBetter luck next time!`);
  }
  setTimeout(() => {
    window.location.href = '/lobby';
  }, 3000);
});

// buttons
$("startBtn").addEventListener("click", () => {
  socket.emit("game:start", { gameId });
});

$("drawBtn").addEventListener("click", () => {
  socket.emit("game:draw", { gameId });
});

const unoBtn = document.querySelector('.btn-warning');
if (unoBtn) {
  unoBtn.addEventListener('click', () => {
    socket.emit('game:callUno', { gameId });
  });
}
