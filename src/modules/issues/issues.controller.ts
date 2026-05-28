import type { Request, Response } from "express"
import { issueService } from "./issues.service";
import jwt from "jsonwebtoken"
import config from "../../config";

const createIssues = async (req: Request, res: Response) => {
    try {
        const result = await issueService.createIssueIntoDB(req.body)
        // console.log(result)
        res.status(201).json({

            success: true,
            message: "Issue created",
            data: result.rows[0]
        })
    } catch (error: any) {
        res.status(500).json({

            success: false,
            message: "Issue cant  create",
            errors: error?.detail || error?.message || "Unknown error"

        });
    }
}

const getAllIssues = async (req: Request, res: Response) => {

    try {
        const result = await issueService.getAllIssuesFromDB()

        res.status(200).json({

            success: true,
            message: "All Issue retreieved",
            data: result
        })
    } catch (error: any) {
        res.status(404).json({

            success: false,
            message: "Issue cant get",
            errors: error?.detail || error?.message || "Unknown error"

        });
    }
}
const getSingleIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await issueService.getSingleIssueFromDB(id as string)
       
        res.status(200).json({
            success: true,
            message: "Issue retrived successfully!",
            data: result
        });
    } catch (error: any) {
        res.status(404).json({

            success: false,
            message: "This Issue cant get",
            errors: error?.detail || error?.message || "Unknown error"

        });
    }
}

const updateIssue = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ')[0] as string;
        const decoded = jwt.verify(token as string , config.secret as string) as {
            id: number;
            role: string;
        };

        const userId = decoded.id;
        const userRole = decoded.role;

        const result = await issueService.updateIssueInDB(req.body, id as string, userId, userRole);

        res.status(200).json({
            success: true,
            message: 'Issue updated successfully',
            data: result
        });

    } catch (error: any) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Internal server error',
            errors: error?.detail || 'Unknown error'
        });
    }
};

const deleteIssue = async( req:Request,res:Response )=>{
    try {
        
    } catch (error : any ) {
         res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Internal server error',
            errors: error?.detail || 'Unknown error'
        });
    }
}

export const issueController = {
    createIssues,
    getAllIssues,
    getSingleIssue,
    updateIssue
}
