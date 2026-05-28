import { pool } from "../../db"
import type { Iuser } from "../users/users.interface"
import type { IIssue } from "./issues.interface"

const createIssueIntoDB = async (payload: IIssue) => {

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
            `, [title, description, reporter_id, type, status])


    return result

}

// const getAllIssuesFromDB = async () => {


//     const result = await pool.query(`
//         SELECT * FROM issues
//         `)
//     return result
// }


const getAllIssuesFromDB = async () => {

    const issuesResult = await pool.query(`
        SELECT * FROM issues
    `);

    const issues = issuesResult.rows;

    if (issues.length === 0) return [];

    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

    const reportersResult = await pool.query(`
        SELECT id, name, email, role FROM users
        WHERE id = ANY($1::int[])
    `, [reporterIds]);

    const reporters = reportersResult.rows;

    const issuesWithReporter = issues.map((issue) => ({
        ...issue,
        reporter: reporters.find((user) => user.id === issue.reporter_id) || null
    }));

    return issuesWithReporter;
};

const getSingleIssueFromDB = async (id: string) => {

    const issueResult = await pool.query<IIssue>(
        `SELECT * FROM issues WHERE id = $1`, [id]
    );

    const issue = issueResult.rows[0];

    if (!issue) {
        const error: any = new Error('Issue not found');
        error.status = 404;
        throw error;
    }

    // Step 2: fetch reporter data separately
    const reporterResult = await pool.query(
        `SELECT id, name, email, role FROM users
         WHERE id = $1`,
        [issue.reporter_id]
    );

    const reporter = reporterResult.rows[0] || null;

    // Step 3: combine issue with reporter
    return {
        ...issue,
        reporter 
    };
};

const updateIssueInDB = async (
    payload: Pick<IIssue, 'title' | 'description' | 'type' | 'status'>,
    id: string,
    userId: number,
    userRole: string
) => {

    const issueResult = await pool.query<IIssue>(
        `SELECT * FROM issues WHERE id = $1`, [id]
    );

    if (issueResult.rows.length === 0) {
        const error: any = new Error('Issue not found');
        error.status = 404;
        throw error;
    }

    const foundIssue = issueResult.rows[0];

    if (!foundIssue) {
        const error: any = new Error('Issue not found');
        error.status = 404;
        throw error;
    }

    if (userRole === 'contributor') {

        if (foundIssue.reporter_id !== userId) {
            const error: any = new Error('Contributors can only update their own issues');
            error.status = 403;
            throw error;
        }

        if (foundIssue.status !== 'open') {
            const error: any = new Error('Contributors can only update issues with open status');
            error.status = 403;
            throw error;
        }
    }
    const { title, description, type } = payload;

    const result = await pool.query<IIssue>(
        `UPDATE issues 
         SET title = $1, description = $2, type = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [title, description, type, id]
    );

    return result.rows[0];
};



export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueInDB
}