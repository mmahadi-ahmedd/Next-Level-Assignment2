import type { Request, Response } from "express";
import { authService } from "./auth.service";

const signUpUser = async (req: Request, res: Response) => {
    try {

        const result = await authService.signUpUserDB(req.body);

        res.status(201).json({

            "success": true,
            "message": "User registered successfully",
            "data": result.rows[0]

        });
    } catch (error: any) {
        res.status(500).json({

            "success": false,
            "message": "User Can't signUp",
            "errors": error.detail

        });
    }
}

const logInUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const result = await authService.loginUserDB(email, password);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const authController = {
    signUpUser,
    logInUser
}