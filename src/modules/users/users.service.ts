import { pool } from "../../db";

const getAllUsersFromDB = async () => {
  const result = await pool.query(`
      SELECT * FROM users  
        `);
  return result;
};

export const userService = {
    getAllUsersFromDB
}