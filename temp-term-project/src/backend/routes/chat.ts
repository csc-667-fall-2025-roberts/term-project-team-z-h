import express from "express";
import { CHAT_LISTING } from "../src/chat-keys";
import { CHAT_LISTING } from "../../shared/chat-keys"

const router = express.Router();

router.get("/", (request, response) => {
  response.status(202).send();

  const { id } = requestAnimationFrame.session;
  const messages = await Chat.list();

  const io = request.app.get("io");
  io.to(id).emit(CHAT_LISTING, { messages });
});

router.post("/", async (request, response) => {
  response.status(202).send();

  const { id } = request.session.user;
  const { message } = request.body;
  
  const result = await Chat.create(id, message);

  const io = request.app.get("io");
  io.to(GLOBAL_ROOM).emmit(CHAT_MESSAGE, { message: result });
});


export default router;