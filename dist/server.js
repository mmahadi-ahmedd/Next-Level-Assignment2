

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: process.env.PORT,
  secret: process.env.SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
    )
`);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(150) NOT NULL,
        description TEXT NOT NULL ,
        type        VARCHAR(20) NOT NULL ,
        status      VARCHAR(20) NOT NULL DEFAULT 'open' ,
        
        reporter_id INT REFERENCES users(id) ON DELETE CASCADE ,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
    )
`);
    console.log("Database connected successfully!");
  } catch (error) {
  }
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var signUpUserDB = async (payload) => {
  const { name, email, password, role, created_at, updated_at } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO Users(name, email, password, role) VALUES($1,$2,$3,$4) RETURNING id, name, email, role,created_at, updated_at`,
    [name, email, hashedPassword, role]
  );
  return result;
};
var loginUserDB = async (email, password) => {
  const result = await pool.query(`SELECT * FROM Users WHERE email=$1`, [
    email
  ]);
  if (result.rows.length === 0) {
    throw new Error("Account not found");
  }
  const user = result.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtpayload, config_default.secret, {
    expiresIn: "1d"
  });
  const { password: _, ...userWithoutPassword } = user;
  return {
    accessToken,
    user: userWithoutPassword
  };
};
var authService = {
  signUpUserDB,
  loginUserDB
};

// src/modules/auth/auth.controller.ts
var signUpUser = async (req, res) => {
  try {
    const result = await authService.signUpUserDB(req.body);
    res.status(201).json({
      "success": true,
      "message": "User registered successfully",
      "data": result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      "success": false,
      "message": "User Can't signUp",
      "errors": error.detail
    });
  }
};
var logInUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await authService.loginUserDB(email, password);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var authController = {
  signUpUser,
  logInUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUpUser);
router.post("/login", authController.logInUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, reporter_id, type, status } = payload;
  const user = await pool.query(`
        SELECT id FROM users WHERE id=$1
        `, [reporter_id]);
  if (user.rows.length === 0) {
    throw new Error("User not found");
  }
  const result = await pool.query(`
            INSERT INTO issues (title,description,reporter_id,type) VALUES($1,$2,$3,$4) RETURNING *
            `, [title, description, user.rows[0].id, type]);
  return result;
};
var getAllIssuesFromDB = async () => {
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
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    const error = new Error("Issue not found");
    error.status = 404;
    throw error;
  }
  const reporterResult = await pool.query(
    `SELECT id, name, email, role FROM users
         WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0] || null;
  return {
    ...issue,
    reporter
  };
};
var updateIssueInDB = async (payload, id, userId, userRole) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (issueResult.rows.length === 0) {
    const error = new Error("Issue not found");
    error.status = 404;
    throw error;
  }
  const foundIssue = issueResult.rows[0];
  if (!foundIssue) {
    const error = new Error("Issue not found");
    error.status = 404;
    throw error;
  }
  if (userRole === "contributor") {
    if (foundIssue.reporter_id !== userId) {
      const error = new Error("Contributors can only update their own issues");
      error.status = 403;
      throw error;
    }
    if (foundIssue.status !== "open") {
      const error = new Error("Contributors can only update issues with open status");
      error.status = 403;
      throw error;
    }
  }
  const { title, description, type, status } = payload;
  const result = await pool.query(
    `UPDATE issues
         SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            type = COALESCE($3, type),
            status = COALESCE($4, status),
            updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
    [title, description, type, status, id]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (id, userRole) => {
  if (userRole !== "maintainer") {
    const error = new Error("Only maintainers can delete issues");
    error.status = 403;
    throw error;
  }
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (!issueResult.rows || issueResult.rows.length === 0) {
    const error = new Error("Issue not found");
    error.status = 404;
    throw error;
  }
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
import jwt2 from "jsonwebtoken";
var createIssues = async (req, res) => {
  try {
    const reporter_id = req.user.id;
    const payload = {
      ...req.body,
      reporter_id
    };
    const result = await issueService.createIssueIntoDB(payload);
    res.status(201).json({
      success: true,
      message: "Issue created",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Issue cant  create",
      errors: error?.detail || error?.message || "Unknown error"
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB();
    res.status(200).json({
      success: true,
      message: "All Issue retreieved",
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Issue cant get",
      errors: error?.detail || error?.message || "Unknown error"
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id);
    res.status(200).json({
      success: true,
      message: "Issue retrived successfully!",
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "This Issue cant get",
      errors: error?.detail || error?.message || "Unknown error"
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(" ")[0];
    const decoded = jwt2.verify(token, config_default.secret);
    const userId = decoded.id;
    const userRole = decoded.role;
    const result = await issueService.updateIssueInDB(req.body, id, userId, userRole);
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      errors: error?.detail || "Unknown error"
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const token = req.headers.authorization?.split(" ")[0];
    const decoded = jwt2.verify(token, config_default.secret);
    const result = await issueService.deleteIssueFromDB(id, decoded.role);
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      errors: error?.detail || "Unknown error"
    });
  }
};
var issueController = {
  createIssues,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt3 from "jsonwebtoken";
var auth = (...role) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized Access"
        });
      }
      const decoded = jwt3.verify(token, config_default.secret);
      const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
            `, [decoded.email]);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default("maintainer", "contributor"), issueController.createIssues);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default("maintainer", "contributor"), issueController.updateIssue);
router2.delete("/:id", auth_default("maintainer"), issueController.deleteIssue);
var issuesRoute = router2;

// src/modules/users/users.route.ts
import { Router as Router3 } from "express";

// src/modules/users/users.service.ts
var getAllUsersFromDB = async () => {
  const result = await pool.query(`
      SELECT * FROM users  
        `);
  return result;
};
var userService = {
  getAllUsersFromDB
};

// src/modules/users/users.controller.ts
var getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsersFromDB();
    res.status(200).json({
      success: true,
      message: "Users retrived successfully!",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var userController = {
  getAllUsers
};

// src/modules/users/users.route.ts
var router3 = Router3();
router3.get("/", userController.getAllUsers);
var usersRoute = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/issues", issuesRoute);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map