import express, { type Application, type Request, type Response } from 'express'
import { userRoute } from './modules/users/users.route'
import { authRoute } from './modules/auth/auth.route'
const app: Application = express()

app.use(express.json()) 
app.use(express.urlencoded({ extended: true }))
app.use(express.text())




app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' })
})

app.post("/api/users", userRoute );
app.use("/api/auth", authRoute );
export default app;