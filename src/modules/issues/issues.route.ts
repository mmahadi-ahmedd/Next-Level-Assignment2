import { Router } from "express";
import { issueController } from "./issues.controller";
import auth from "../../middleware/auth";

const router = Router();
router.post("/",auth("maintainer","contributor"), issueController.createIssues)
router.get("/", issueController.getAllIssues)
router.get("/:id", issueController.getSingleIssue )
router.patch("/:id",auth("maintainer","contributor"),issueController.updateIssue)
router.delete("/:id",auth("maintainer"),issueController.deleteIssue)

export const issuesRoute = router;