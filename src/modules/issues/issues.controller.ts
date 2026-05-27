import type { Request, Response } from "express"
import { issueService } from "./issues.service";

const createIssues = async(req:Request,res:Response)=>{
    try {
        const result = await issueService.createIssueIntoDB(req.body)
        // console.log(result)
        res.status(201).json({

            success:true,
            message:"Issue created",
            data:result.rows[0]
        })
    } catch (error:any) {
        res.status(500).json({

            success: false,
            message: "Issue cant  create",
            errors: error?.detail || error?.message || "Unknown error"

        });
    }
}

export const issueController={
    createIssues
}
