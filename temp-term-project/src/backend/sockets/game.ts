import { Server, Socket } from "socket.io";
import { getGame } from "../game/gameState";
import * as gameService from "../game/gameService";
import { sanitizePublic, sanitizePrivate } from "../game/sanitize";
import { stat } from "fs";



export function registerGameSockets(io:Server){
    io.on("connection", (socket: Socket) => {
        const session = (socket.request as any).session;
        const user = session?.user;

        if(!user) {
            socket.emit("game:error", { message: "No auth"});
            return;
        }

        const userId = Number(user.id);
        if (Number.isNaN(userId)) {
        socket.emit("game:error", { message: "Bad session user id" });
        return;
        }

        socket.data.userId = userId;

        async function emitStateToRoom(gameId: number) {
            const room = `game:${gameId}`
            const state = getGame(gameId);

            // public everyone can see
            io.to(room).emit("game:public", sanitizePublic(state));

            // private hand to each socket 
            const socketsInRoom = await io.in(room).fetchSockets();
            for(const s of socketsInRoom) {
                const sid = s.data.userId as number | undefined;
                if(!sid) continue;
                s.emit("game:private", sanitizePrivate(state, sid));
            }
        }


        socket.on("game:join", async ({ gameId }: { gameId: number }) => {
            socket.join(`game:${gameId}`);

            try {
                await emitStateToRoom(gameId);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);

                // not started yet
                if (msg.includes("Game not found")) {
                socket.emit("game:state", { gameId, status: "waiting" });
                return;
                }

                socket.emit("game:error", { message: msg });
            }
        });

        socket.on("game:playCard", async (data: {gameId: number; cardId: string}) => {
            try {
                await gameService.playCard(userId, data.gameId, data.cardId);
                await emitStateToRoom(data.gameId);
            } catch (err) {
                socket.emit("game:error", {
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        });
        
        socket.on("game:start", async (data: { gameId: number }) => {
            try {
                await gameService.startGame(data.gameId, userId);
                await emitStateToRoom(data.gameId);
            }catch (err) {
                socket.emit("game:error", {
                    message: err instanceof Error ? err.message : String(err),
                });
            }
        });

        socket.on("game:draw", async (data: { gameId: number }) => {
            try {
                await gameService.drawCard(userId, data.gameId);
                await emitStateToRoom(data.gameId);
            } catch (err) {
                socket.emit("game:error", {
                message: err instanceof Error ? err.message : String(err),
                });
            }
        });

    });
}

