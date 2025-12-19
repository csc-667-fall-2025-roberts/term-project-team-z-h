import * as path from "path";
import express from "express";
import createHttpError from "http-errors";
import morgan from "morgan";
import bodyParser from "body-parser";
import session from "express-session";
import rootRoutes from "./routes/root";
import { userRouter } from "./routes/auth";
import lobbyRoutes from "./routes/lobby";
import gameRoutes from "./routes/game";
import { createServer } from "http";
import { Server }  from "socket.io"
import { create, create as createChatMessage, list as listChatMessages} from "./chat";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 3000;

app.set("io", io);

const sessionMiddleware = session({
    secret: "uno-game-secret-key-change-in-production" as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
    },
} as session.SessionOptions);

app.use(sessionMiddleware);

io.engine.use(sessionMiddleware);

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

io.on("connection", (socket) => {

    const session = (socket.request as any).session;
    const user = session?.user;

    socket.join("lobby");

    socket.on("game:join", (data: { gameId: number }) => {
        socket.join(`game:${data.gameId}`);
    });

    socket.on("game:leave", (data: { gameId: number }) => {
        socket.leave(`game:${data.gameId}`);
    });

    socket.on("chat:message", async (data: { message: string }) => {
        if (!user) {
            socket.emit ("chat:error", {error: "Not authenticated" });
            return;
        }

        try {
            const savedMessage = await createChatMessage(user.id, data.message);

            io.to("lobby").emit("chat:message", {
                id: savedMessage.id,
                username: user.username,
                message: savedMessage.message,
                created_at: savedMessage.created_at,
            });
        } catch (error) {
            console.error("Error saving chat message: ", error);
            socket.emit("chat:error", {error: "Failed to send message"});
        }
    });

    socket.on("chat:load", async () => {
        try {
            const messages = await listChatMessages(50);
            socket.emit ("chat:history", messages);
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

    socket.on("game:chat:message", async (data: { gameId: number; message: string}) => {
        if(!user) {
            socket.emit("chat:error", { error: "Not authenticated" });
            return;
        } try {
            const savedMessage = await createChatMessage(user.id, data.message, data.gameId);

            io.to(`game:${data.gameId}`).emit("game:chat:message", {
                id: savedMessage.id,
                username: user.username,
                message: savedMessage.message,
                created_at: savedMessage.created_at,
            });
        } catch(error) {
            socket.emit("chat:error", { error: "Failed to send message" });
        }
    });

    socket.on("game:chat:load", async (data: { gameId: number }) => {
        try {
            const messages = await listChatMessages(50, data.gameId);
            socket.emit("game:chat:history", messages);
        } catch (error) {
            console.error("error loading the chat chat history", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.use((_request, _response, next) => {
    next(createHttpError(404));
});

app.use((error: any, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const status = error.status || 500;
    const message = error.message || "Internal Server Error";
    
    response.status(status);
    response.render("error", { status, message });
});

httpServer.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
