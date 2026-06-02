# DevPulse – Internal Tech Issue & Feature Tracker

## Live URL

**Backend API:** `https://nextlevel-assignment2.vercel.app/`

---

## Project Overview

DevPulse is a collaborative issue and feature tracking platform designed for software teams. It allows contributors to report bugs and request new features, while maintainers can manage issue workflows, update records, and remove issues when necessary.

The system implements role-based access control using JWT authentication and stores data in PostgreSQL using raw SQL queries.

---

## Features

### Authentication & Authorization

* User registration with role selection (`contributor` or `maintainer`)
* Secure password hashing using bcrypt
* JWT-based authentication
* Protected routes using middleware
* Role-based access control

### Issue Management

* Create bug reports and feature requests
* View all issues with filtering and sorting
* View detailed information for a single issue
* Contributors can update their own issues when status is `open`
* Maintainers can update any issue
* Maintainers can change issue status independently
* Maintainers can delete issues

### Filtering & Sorting

* Filter by issue type
* Filter by issue status
* Sort by newest or oldest issues

---

## Tech Stack

* Node.js
* TypeScript
* Express.js
* PostgreSQL
* Raw SQL (`pool.query`)
* bcrypt
* JSON Web Token (JWT)

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/mmahadi-ahmedd/Next-Level-Assignment2
cd Next-Level-Assignment2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=3000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_secret_key
```

### 4. Run database migrations / create tables

Create the required PostgreSQL tables using the schema provided below.

### 5. Start the server

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

---

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/signup
```

#### Login User

```http
POST /api/auth/login
```

---

### Issues

#### Create Issue

```http
POST /api/issues
```

Authentication Required

#### Get All Issues

```http
GET /api/issues
```

Query Parameters:

| Parameter | Values                      |
| --------- | --------------------------- |
| sort      | newest, oldest              |
| type      | bug, feature_request        |
| status    | open, in_progress, resolved |

---

#### Get Single Issue

```http
GET /api/issues/:id
```

---

#### Update Issue

```http
PATCH /api/issues/:id
```

Authentication Required

---

#### Delete Issue

```http
DELETE /api/issues/:id
```

Maintainer Only

---

## User Roles

### Contributor

* Register and login
* Create issues
* View all issues
* Update own issues when status is `open`

### Maintainer

* All contributor permissions
* Update any issue
* Change issue workflow status
* Delete any issue

---

## Database Schema

### Users Table

| Field      | Type               |
| ---------- | ------------------ |
| id         | SERIAL PRIMARY KEY |
| name       | VARCHAR            |
| email      | VARCHAR UNIQUE     |
| password   | VARCHAR            |
| role       | VARCHAR            |
| created_at | TIMESTAMP          |
| updated_at | TIMESTAMP          |

Example:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'contributor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Issues Table

| Field       | Type               |
| ----------- | ------------------ |
| id          | SERIAL PRIMARY KEY |
| title       | VARCHAR(150)       |
| description | TEXT               |
| type        | VARCHAR            |
| status      | VARCHAR            |
| reporter_id | INTEGER            |
| created_at  | TIMESTAMP          |
| updated_at  | TIMESTAMP          |

Example:

```sql
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(30) DEFAULT 'open',
    reporter_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Authentication Flow

1. User registers an account.
2. User logs in using email and password.
3. Server validates credentials.
4. Server generates a JWT token.
5. Client includes token in request headers:

```http
Authorization: <JWT_TOKEN>
```

6. Middleware verifies the token before allowing access to protected resources.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Operation failed",
  "errors": "Error details"
}
```

---

## Author

Developed as part of the DevPulse Assignment (B7A2).
