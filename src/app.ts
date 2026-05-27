import express, { type Application, type Request, type Response } from 'express'
import { authRoute } from './modules/auth/auth.route'
import { issuesRoute } from './modules/issues/issues.route'
import { usersRoute } from './modules/users/users.route'
const app: Application = express()

app.use(express.json()) 
app.use(express.urlencoded({ extended: true }))
app.use(express.text())




app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!' })
})

app.use("/api/auth", authRoute );
app.use("/api/users", usersRoute );
app.use("/api/issues", issuesRoute )
export default app;