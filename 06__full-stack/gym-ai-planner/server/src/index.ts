import dotenv from "dotenv";
// Only load dotenv in development, not in production (Render handles env vars)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { profileRouter } from "./routes/profile";
import { planRouter } from "./routes/plan";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(cookieParser());
app.use(express.json());

//API Routes
app.use("/api/profile", profileRouter);
app.use("/api/plan", planRouter);
app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});