import { Router } from "express";

import healthRoutes from "./health.routes.js";
import interviewRoutes from "./interview.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/interview", interviewRoutes);

export default router;