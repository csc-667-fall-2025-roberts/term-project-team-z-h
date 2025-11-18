import type { SecureUser, User } from "";
import bcrypt from "bcrypt";
import db from "../connection";
import {LOGIN, SIGNUP } from "./sql";


const signup = async (username: string, email: string, clearTextPassword: string)=> {
    const password = await bcrypt.hash(clearTextPassword, 10);

    try {
        const user: User = await db.one<User>(SIGNUP, [username, email, password]);
        return user;
    }catch(e: any) {
        throw "Email or username invalid";
    }
    // Create a record in db for this user
    // with encrytoted password
    // ensure username and email are unique (take car of exceptions0)

    // return id, username, email
}

const login = async (username: string, clearTextPassword: string) => {
    try {
        const secureUser: SecureUser = await db.one<SecureUser>(LOGIN, [username]);

        const match = await bcrypt.compare(clearTextPassword, secureUser.hashed_passwd);
        if (!match) throw new Error("Invalid login information");

        const { id, username: uname, email, created_at } = secureUser;
        return { id, username: uname, email, created_at };
    } catch (e: any) {
        throw new Error("Invalid login information");
    }
};



export { login, signup };