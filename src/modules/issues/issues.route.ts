import { Router } from "express";
import { issueController } from "./issues.controller";

const router = Router();
router.post("/", issueController.createIssues)

export const issuesRoute = router;