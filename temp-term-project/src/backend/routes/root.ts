import express, { response } from "express"

const router = express.Router();

router.get("/", (_request, response) => {
  response.render("root", {gamesListing: ["a", "b", "c"] });
})

export default router;