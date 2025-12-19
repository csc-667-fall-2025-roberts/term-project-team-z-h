import db from "../db/connection";
import type { ChatMessage } from "../types/types";
import { CREATE_MESSAGE, RECENT_MESSAGES, RECENT_GAME_MESSAGES } from "./sq";

const list = async (limit: number = 50, gameId?: number): Promise<ChatMessage[]> => {
  if (gameId){
    return await db.manyOrNone<ChatMessage>(RECENT_GAME_MESSAGES, [gameId, limit]);
  }
  return await db.manyOrNone<ChatMessage>(RECENT_MESSAGES, [limit]);
};

const create = async (user_id: number, message: string, game_id?: number) => {
  return await db.one(CREATE_MESSAGE, [user_id, message, game_id || null]);
};

export { create, list };
