import { Router } from "express";

import {
  getInterviewSessionController,
  interviewController,
} from "../controllers/interview.controller.js";

const router = Router();

router.post("/", interviewController);

router.get("/:sessionId", getInterviewSessionController);

export default router;