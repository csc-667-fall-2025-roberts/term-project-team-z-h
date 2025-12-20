import express from "express";
import db from "../db/connection";
import * as gameService from "../game/gameService";

const router = express.Router();

router.get("/:id/players", async (req, res) => {
    const { id } = req.params;
    
    try {
        const players = await db.any(
            `SELECT users.id as user_id, users.username 
            FROM game_players 
            JOIN users ON game_players.user_id = users.id 
            WHERE game_players.game_id = $1`,
            [id]
        );
        
        res.json(players);
    } catch (error) {
        console.error("Error loading players:", error);
        res.status(500).json({ error: "Failed to load players" });
    }
});

router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // Get game info
        const game = await db.one("SELECT * FROM games WHERE id = $1", [id]);

        // Get players in this game
        const players = await db.any(
            `SELECT users.username 
            FROM game_players 
            JOIN users ON game_players.user_id = users.id 
            WHERE game_players.game_id = $1`,
            [id]
        );

        // TODO: Get user from session
        const user = req.session.user || { id: 0, username: "Guest" };

        res.render("game", { game, user, players });
    } catch (error) {
        console.error("Error loading game:", error);
        res.status(500).send("Error loading game: " + error);
    }
});

router.post("/:id/start", async (req, res) => {
    const user = req.session.user;
    const gameId = Number(req.params.id);

    if (!user) return res.redirect("/user/login");

    if (Number.isNaN(gameId)) {
        return res.status(400).send("Invalid game id");
    }

    // Load game
    const game = await db.oneOrNone(`SELECT * FROM games WHERE id = $1`, [gameId]);
    if (!game) return res.redirect("/lobby");
    if (game.state !== "waiting") return res.redirect(`/games/${gameId}`);

    // Host check force numeric compare
    if (Number(game.created_by) !== Number(user.id)) {
        return res.redirect(`/games/${gameId}`);
    }

    // Check players BEFORE changing state
    const { count } = await db.one(
        `SELECT COUNT(*)::int AS count FROM game_players WHERE game_id = $1`,
        [gameId]
    );

    if (count < 2) {
        // keep it waiting so it stays in lobby
        return res.redirect(`/games/${gameId}?error=not_enough_players`);
    }

    try {
        await gameService.initializeGame(gameId);
        await db.none(`UPDATE games SET state = 'playing' WHERE id = $1`, [gameId]);
        return res.redirect(`/games/${gameId}`);
    } catch (err) {
        console.error("Failed to start game:", err);
        await db.none(`UPDATE games SET state = 'waiting' WHERE id = $1`, [gameId]);
        return res.redirect(`/games/${gameId}?error=start_failed`);
    }
});

export default router;
