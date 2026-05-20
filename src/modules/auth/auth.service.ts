import bcrypt from "bcryptjs";
import type { Iuser } from "../users/users.interface";
import { pool } from "../../db";
import jwt from "jsonwebtoken"
import config from "../../config";

const signUpUserDB = async (payload: Iuser) => {

    const { name, email, password, role, created_at, updated_at } = payload;
    // if (!password || (password as string).length < 6) {
    //     throw new Error("Password must be at least 6 characters long");
    // }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO Users(name, email, password, role) VALUES($1,$2,$3,$4) RETURNING id, name, email, role,created_at, updated_at`,
        [name, email, hashedPassword, role]
    );
    return result;


}
const loginUserDB = async (email: string, password: string) => {

    const result = await pool.query(`SELECT * FROM Users WHERE email=$1`, [
        email,
    ]);
    if (result.rows.length === 0) {
        throw new Error("Account not found");
    }

    const user = result.rows[0];

    const matchPassword = await bcrypt.compare(password, user.password);

    if (!matchPassword) {
        throw new Error("Invalid Credentials")

    }

    const jwtpayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(jwtpayload, config.secret as string, {
        expiresIn: "1d",
    });
    return {accessToken}
}

export const authService = {
    signUpUserDB,
    loginUserDB
}