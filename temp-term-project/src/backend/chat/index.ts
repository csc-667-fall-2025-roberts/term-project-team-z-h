import { RECENT_MESSAGES } from "../../types/types"


const list = async (limit: number = 50) => {
  return await db.manyOrNone<ChatMessage>(RECENT_MESSAGES, limit);
};

const create = (user_id: number, message: string) => {
  return await db.one(CREATE_MESSAGE, [user_id, message]);
};

export {create, list};