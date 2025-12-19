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
                
                // Remove all listeners
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
    card.textContent = formatCardValue(c.value);
    card.onclick = async () => {
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

const unoBtn = document.getElementById('unoBtn');
if (unoBtn) {
  unoBtn.addEventListener('click', () => {
    socket.emit('game:callUno', { gameId });
  });
}

socket.on('game:unoCall', (data: { userId: number }) => {
  const status = $('status');
  status.textContent += ` | Player ${data.userId} called UNO!`;
  setTimeout(() => render(), 2000);
});

socket.on('game:winner', (data: { winnerId: number }) => {
  const currentUserId = (window as any).CURRENT_USER_ID;
  
  if (data.winnerId === currentUserId) {
    alert('🎉 YOU WON! 🎉\n\nCongratulations!');
  } else {
    alert(`Game Over!\n\nPlayer ${data.winnerId} wins!\n\nBetter luck next time!`);
  }
    setTimeout(() => {
    window.location.href = '/lobby';
  }, 3000);
});