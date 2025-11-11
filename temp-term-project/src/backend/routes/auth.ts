import express, { response } from "express";
import db from "../db/connection"

const router = express.Router();



// endpoint to list all users GET /users
router.get("/signup", async (_request, response) => {
    response.render("auth/signup");
});

router.get("/login", async (_request, response) => {
    response.render("auth/login");
});

router.post("/signup", async (_request, response) => {
    const { username, email, password } = request.body;

    try{
        const user = await Auth.sighnup(username, email, password);
        response.redirect("/lobby");
    }catch(e:any){
        response.render("auth/signup", {error:e});
    }
});

router.post("/login", async (_request, response) => {
    const { username, password } = request.body;

    try{
        const user = await Auth.login(username, password);

    }catch(e:any){
        response.render("auth/login", {error:e});
    }
});

router.get("/signup", async (_request, response) => {
});


// endpoint to list all users GET /users
router.get("/", async (_request, response) => {
    const users = await db.any("SELECT * FROM users");
    
    response.render("users/index", { users });
});


// endpoint to display single user GET /users/:id
router.get("/:id", async (request, response) => {
    const { id } = request.params;

    try{
        const user = await db.one("SELECT * FROM users WHERE id=$1", [id]);

        response.render("users/user", { user });
    }catch(error:unknown) {
        response.redirect("/users");
    }
    
});

// endpoint to create a user POST /users
router.post("/", async (request, response) => {
    const {username, email} = request.body;

    const {id} = await db.one<{ id: number }>(
        "INSERT INTO users (email, username, password) VALUES ($1, $2, 'password') RETURNING id",
        [username, email, "some-password"],
    );

    response.redirect(`/users/${id}`)
});

export { router as userRouter };