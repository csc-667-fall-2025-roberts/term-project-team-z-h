import db from "../db/connection";
import type { ChatMessage } from "../types/types";
import { CREATE_MESSAGE, RECENT_MESSAGES } from "./sq";

const list = async (limit: number = 50): Promise<ChatMessage[]> => {
  return await db.manyOrNone<ChatMessage>(RECENT_MESSAGES, [limit]);
};

const create = async (user_id: number, message: string) => {
  return await db.one(CREATE_MESSAGE, [user_id, message]);
};

export { create, list };
