import { pool } from "../../db"
import type { IIssue } from "./issues.interface"

const createIssueIntoDB = async (payload: any) => {

    // console.log(payload)

    const { title, description, reporter_id, type, status } = payload

    const user = await pool.query(`
        SELECT * FROM users WHERE id=$1
        `, [reporter_id])
    // console.log(user)
    if (user.rows.length === 0) {
        throw new Error("User not found")
    }

    const result = await pool.query(`
            INSERT INTO issues (title,description,reporter_id,type,status) VALUES($1,$2,$3,$4,$5) RETURNING *
            `, [ title, description, reporter_id, type, status])


    return result

}

export const issueService = {
    createIssueIntoDB
}