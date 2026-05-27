import { Router } from "express";
import { issueController } from "./issues.controller";

const router = Router();
router.post("/", issueController.createIssues)
router.get("/", issueController.getAllIssues)

export const issuesRoute = router;