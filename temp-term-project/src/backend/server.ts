import * as path from "path";
import express from "express";
import createHttpError from "http-errors";
import morgan from "morgan";
import bodyParser from "body-parser";
import rootRoutes from "./routes/root";
import { userRouter } from "./routes/auth";
import lobbyRoutes from "./routes/lobby";
import gameRoutes from "./routes/game";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// View engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Routes
app.use("/", rootRoutes);
app.use("/users", userRouter);
app.use("/lobby", lobbyRoutes);
app.use("/games", gameRoutes);

// 404 handler
app.use((_request, _response, next) => {
    next(createHttpError(404));
});

// Error handler
app.use((error: any, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const status = error.status || 500;
    const message = error.message || "Internal Server Error";
    
    response.status(status);
    response.render("error", { status, message });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
