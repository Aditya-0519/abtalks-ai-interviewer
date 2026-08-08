import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import routes from "./routes/index.js";
import {
  notFoundHandler,
  globalErrorHandler,
} from "./middleware/error.middleware.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ABTalks AI Interviewer Backend",
    environment: env.NODE_ENV,
  });
});

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;