import express from "express";
import db from "../db/connection";

const router = express.Router();

router.get("/", async (request, response) => {
    const user = request.session.user || {id: 0, username: "Guest"};

    try {
        const games = await db.any(`
            SELECT 
                games.*,
                COUNT(game_players.id) as player_count
            FROM games
            LEFT JOIN game_players ON games.id = game_players.game_id
            WHERE games.state = 'waiting'
            GROUP BY games.id
            ORDER BY games.created_at DESC
        `);
        
        response.render("lobby", { user, games });
    } catch (error) {
        console.error("Error loading lobby:", error);
        response.render("lobby", { 
            user,
            games: [] 
        });
    }
});

router.post("/create", async (request, response) => {
    const user = request.session.user;

    if (!user){
        return response.redirect("/users/login");
    }

    try {
        const { name, max_players } = request.body;

        const newGame = await db.one(
            `INSERT INTO games (name, created_by, state, max_players)
            VALUES ($1, $2, 'waiting', $3)
            RETURNING id`,
            [name, user.id, max_players]
        );

        await db.none(
            `INSERT INTO game_players (game_id, user_id)
            VALUES ($1, $2)`,
            [newGame.id, user.id]
        );

        response.redirect(`/games/${newGame.id}`);
    } catch (error) {
        console.error("Error creating game:", error);
        response.redirect("/lobby");
    }
});



router.post("/:id/join", async (req, res) => {
    const user = req.session.user;
    const gameId = Number(req.params.id);

    if (!user) return res.redirect("/users/login");
    if (Number.isNaN(gameId)) return res.status(400).send("Invalid game id");

    try {
        const game = await db.oneOrNone(
            `SELECT id, state, max_players FROM games WHERE id = $1`,
            [gameId]
        );

        if (!game || game.state !== "waiting") {
            return res.redirect("/lobby");
        }

        // block if full
        const { count } = await db.one(
            `SELECT COUNT(*)::int AS count FROM game_players WHERE game_id = $1`,
            [gameId]
        );
        if (count >= game.max_players) {
            return res.redirect("/lobby");
        }

        // Prevent duplicates
        const already = await db.oneOrNone(
            `SELECT 1 FROM game_players WHERE game_id = $1 AND user_id = $2`,
            [gameId, user.id]
        );

        if (!already) {
            await db.none(
                `INSERT INTO game_players (game_id, user_id) VALUES ($1, $2)`,
                [gameId, user.id]
            );
        }

        return res.redirect(`/games/${gameId}`);
    } catch (err) {
        console.error("Error joining game:", err);
        return res.redirect("/lobby");
    }
});



export default router;
