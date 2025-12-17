export const SIGNUP = `
INSERT INTO users (username, email, hashed_password)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at
`;

export const LOGIN = `
SELECT * FROM users WHERE username=$1
`;