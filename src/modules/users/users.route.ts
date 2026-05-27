import { Router, type Request, type Response } from "express";
import { pool } from "../../db";
import { userController } from "./users.controller";

const router = Router();

router.get("/", userController.getAllUsers)

export const usersRoute = router;