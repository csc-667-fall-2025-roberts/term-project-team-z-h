import type { SecureUser, User } from "../../types/types";
import bcrypt from "bcrypt";
import db from "../connection";
import { LOGIN, SIGNUP } from "./sql";

const signup = async (username: string, email: string, clearTextPassword: string): Promise<User> => {
    const password = await bcrypt.hash(clearTextPassword, 10);

    try {
        const user: User = await db.one<User>(SIGNUP, [username, email, password]);
        return user;
    } catch (e: any) {
        throw new Error("Email or username already exists");
    }
};

const login = async (username: string, clearTextPassword: string): Promise<User> => {
    try {
        const secureUser: SecureUser = await db.one<SecureUser>(LOGIN, [username]);

        const match = await bcrypt.compare(clearTextPassword, secureUser.hashed_password);
        if (!match) throw new Error("Invalid login information");

        const { id, username: uname, email, created_at } = secureUser;
        return { id, username: uname, email, created_at };
    } catch (e: any) {
        throw new Error("Invalid login information");
    }
};

export { login, signup };
