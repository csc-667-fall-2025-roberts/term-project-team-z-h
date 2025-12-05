export interface User {
    id: number;
    username: string;
    email: string;
    created_at: Date;
}

export interface SecureUser extends User {
    hashed_password: string;
}

export interface ChatMessage {
    id: number;
    user_id: number;
    message: string;
    username: string;
    created_at: Date;
}

export interface Game {
    id: number;
    name: string;
    created_by: number;
    state: string;
    max_players: number;
    created_at: Date;
}
