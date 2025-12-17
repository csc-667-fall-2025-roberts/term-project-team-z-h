export const CREATE_MESSAGE = `
INSERT INTO chat (user_id, content)
VALUES ($1, $2)
RETURNING id, user_id, content as message, created_at
`;


export const RECENT_MESSAGES = `
SELECT
  chat.id,
  chat.user_id,
  chat.content as message,
  chat.created_at,
  users.username
FROM chat
JOIN users ON chat.user_id = users.id
WHERE chat.game_id IS NULL
ORDER BY chat.created_at DESC
LIMIT $1
`;