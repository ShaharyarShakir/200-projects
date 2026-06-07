import path from "node:path";
import cors from "cors"
import { clerkMiddleware } from "@clerk/express";
import express from "express";

import { errorHandler } from "./middleware/errorhandler";
import authRoute from "./routes/authRoute";
import chatRoute from "./routes/chatRoute";
import messageRoute from "./routes/messageRoute";
import userRoute from "./routes/userRoute";

const app = express();
const allowOrigins = [
	"http://localhost:8080", //expo mobile
	"http://localhost:5173", // vite web
	process.env.FRONTEND_URL!, // production	
].filter(Boolean)

app.use(cors({
	origin: allowOrigins,
	credentials: true
}))

// parse the incoming JSON request body and avail them in req.body
app.use(express.json());

app.use(clerkMiddleware());




app.get("/health", (req, res) => {
	res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);
app.use("/api/users", userRoute);

// error handler middleware should be the last middleware in the stack, so it can catch all the errors that happen in the previous middlewares and routes
app.use(errorHandler);
// serve frontend in production
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../../web/dist")));

	app.get("/{*any}", (_, res) => {
		res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
	});
}
export default app;
