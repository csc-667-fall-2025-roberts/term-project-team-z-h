import express from "express";
import db from "../db/connection";

const router = express.Router();

router.get("/", async (_request, response) => {
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
        
        const user = { 
            id: 1, 
            username: "Guest" 
        };
        
        response.render("lobby", { user, games });
    } catch (error) {
        console.error("Error loading lobby:", error);
        response.render("lobby", { 
            user: { id: 1, username: "Guest" }, 
            games: [] 
        });
    }
});

router.post("/create", async (req, res) => {
    try {
        const { name, max_players } = req.body;
        const user = { id: 1, username: "Guest" };

        // Create game
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

        res.redirect(`/games/${newGame.id}`);
    } catch (error) {
        console.error("Error creating game:", error);
        res.redirect("/lobby");
    }
});

export default router;
