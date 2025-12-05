import express from "express";
import * as Auth from "../db/auth";

const router = express.Router();

// GET login page
router.get("/login", (_request, response) => {
    response.render("auth/login", { error: undefined });
});

// GET signup page
router.get("/signup", (_request, response) => {
    response.render("auth/signup", { error: undefined });
});

// POST signup
router.post("/signup", async (request, response) => {
    const { username, email, password } = request.body;

    try {
        const user = await Auth.signup(username, email, password);
        // TODO: Set up session here
        response.redirect("/lobby");
    } catch (e: any) {
        response.render("auth/signup", { error: "Username or email already exists" });
    }
});

// POST login
router.post("/login", async (request, response) => {
    const { username, password } = request.body;

    try {
        const user = await Auth.login(username, password);
        // TODO: Set up session here
        response.redirect("/lobby");
    } catch (e: any) {
        response.render("auth/login", { error: "Invalid username or password" });
    }
});

// GET logout
router.get("/logout", (_request, response) => {
    // TODO: Destroy session here
    response.redirect("/");
});

export { router as userRouter };
