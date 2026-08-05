import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Custom multiline Morgan format to match the exact requirement:
// Method and URL, Status, Response Time on separate lines.
app.use(morgan((tokens, req, res) => {
  return [
    `${tokens.method(req, res)} ${tokens.url(req, res)}`,
    tokens.status(req, res),
    `${parseFloat(tokens['response-time'](req, res) || 0).toFixed(0)}ms`
  ].join("\n");
}));

// Routes
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api",
    uptime: Math.floor(process.uptime())
  });
});

app.get("/api/ping", (req, res) => {
  res.json({
    message: "Nimbus Drive API"
  });
});

// 404 handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.statusCode = 404;
  next(err);
});

// Global Error Handler
app.use(errorHandler);

export default app;
