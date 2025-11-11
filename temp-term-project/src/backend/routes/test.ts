import express, { request } from "express";

const router = express.Router();

router.get("/", (_request, response) => {
  response.send("<h1>this is from the test route /</h1>");
})

export {router as testRouter };
