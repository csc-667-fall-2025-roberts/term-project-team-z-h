import express from "express";
import * as Auth from "../db/auth";

const router = express.Router();

router.get("/login", (_request, response) => {
    response.render("auth/login", { error: undefined });
});

router.get("/signup", (_request, response) => {
    response.render("auth/signup", { error: undefined });
});

// for signup
router.post("/signup", async (request, response) => {
    const { username, email, password } = request.body;

    try {
        const user = await Auth.signup(username, email, password);

        request.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        response.redirect("/lobby");
    } catch (e: any) {
        response.render("auth/signup", { error: "Username or email already exists" });
    }
});

// for login
router.post("/login", async (request, response) => {
    const { username, password } = request.body;

    try {
        const user = await Auth.login(username, password);
        
        request.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        response.redirect("/lobby");
    } catch (e: any) {
        response.render("auth/login", { error: "Invalid username or password" });
    }
});

router.get("/logout", (request, response) => {

    request.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
        }
        response.redirect("/");
    });
});

export { router as userRouter };
