import type { SecureUser, User} from "";
import bcrypt from "bcrypt";
import db from "../connection";
import {LOGIN, SIGNUP } from "./sql";


const signup = (username: string, email: string, clearTextPassword: string)=> {
    const password = await bcrypt.hash(clearTextPassword, 10);

    try {
        return const user = await db.one<User>(SIGNUP, [username, email, password]);
    }catch(e: any) {
       throw "Email or username invalid";
    }
    // Create a record in db for this user
    // with encrytoted password
    // ensure username and email are unique (take car of exceptions0)

    // return id, username, email
}

const login = (username: string, clearTextPassword: string) => {
    // ensure passwords match
    const secureUser = await db.one<SecureUser>(login, [username]);

    if(await bcrypt.compare(clearTextPassword, user.password)) {
        const { id, username, email, created_at } = secureUser;
        return { id, username,email,created_at};
    }else{
        throw "Invalid login information";
    }

};




export { login, signup };