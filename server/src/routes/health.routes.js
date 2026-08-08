import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ABTalks AI Interviewer Backend",
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;