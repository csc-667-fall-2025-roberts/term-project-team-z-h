import express from "express";
import db from "../db/connection";

const router = express.Router();

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Get game info
        const game = await db.one("SELECT * FROM games WHERE id = $1", [id]);

        // Get players in this game
        const players = await db.any(
            "SELECT users.username FROM game_players JOIN users ON game_players.user_id = users.id WHERE game_players.game_id = $1",
            [id]
        );

        // TODO: Get user from session
        const user = { id: 1, username: "Guest" };

        res.render("game", { game, user, players });
    } catch (error) {
        console.error("Error loading game:", error);
        res.status(500).send("Error loading game: " + error);
    }
});

export default router;
