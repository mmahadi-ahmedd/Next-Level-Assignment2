import express, { type Application, type Request, type Response } from 'express'
const app: Application = express()
const port = config.port

app.use(express.json()) 
app.use(express.urlencoded({ extended: true }))
app.use(express.text())


import { Pool } from "pg";
import config from './config'

const pool = new Pool({
  connectionString: config.connection_string,
});

const initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        age INT,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
            `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};
initDB();


app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' })
})

// app.post("/api/users", );
export default app;