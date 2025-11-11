export const CREATE_MESSAGE = `
INSERT INTO chat_messages (user_id, message)
VALUES ($1, $2)
RETURNING id, user_id, message, created_at
`;

`
WITH new_message AS (
  INSERT INTO chat_messages (user_id, message)
  VALUES ($1, $2)
  RETURNING *
)

SELECT 
  new_message.*
  users.username,
  users.email
FROM new_message, users
WHERE new_message.user_id=users.id
`

export const RECENT_MESSAGES = `
SELECT
  chat_messages.*
`;