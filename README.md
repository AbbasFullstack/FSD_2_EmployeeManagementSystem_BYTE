# FSD_2_EmployeeManagementSystem_BYTE

A production-style full-stack **Employee Management System** built for the **ArithMatrix AVIP 2026 Full Stack Development Internship — Task 2**.

The application provides authenticated employee CRUD operations, role-based admin authorization, MongoDB persistence, server-side validation, a responsive browser UI, and a **God Mode audit log** that captures the previous employee state before every admin edit or delete.

## ✨ Features

- Employee CRUD: create, read, update and delete
- JWT authentication with bcrypt password hashing
- Admin-only employee create/update/delete operations
- Authenticated employee listing and details
- Server-side validation with express-validator
- MongoDB + Mongoose persistence
- Deterministic seed data: 1 admin, 5 employees, 3 audit logs
- God Mode audit trail with action, timestamp, previous state, admin and employee reference
- Audit logs exposed as read-only API resources
- AuditLog model is append-only
- Responsive dashboard, employee form modal and audit-log UI
- Centralized API error handling
- Helmet, CORS and request logging
- Automated API integration tests using node:test, Supertest and mongodb-memory-server

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express 5 |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT + bcryptjs |
| Validation | express-validator |
| Security | Helmet + CORS |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Testing | node:test + Supertest |
| Test Database | mongodb-memory-server |

## 📁 Structure

```text
controllers/    API controllers
middleware/     Auth, admin, validation and error middleware
models/         User, Employee and AuditLog schemas
routes/         Auth, employee and audit-log routes
seed/           Deterministic sample-data seed script
tests/          Isolated API integration tests
public/         Responsive frontend
server.js       Express application
.env.example    Environment template
```

## 🔐 API Routes

All protected routes use `Authorization: Bearer <JWT>`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register normal user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | User | Current profile |
| POST | `/api/auth/register-admin` | Admin | Create admin |
| GET | `/api/employees` | User | List employees |
| GET | `/api/employees/:id` | User | Get employee |
| POST | `/api/employees` | Admin | Create employee |
| PUT | `/api/employees/:id` | Admin | Update employee + audit |
| DELETE | `/api/employees/:id` | Admin | Delete employee + audit |
| GET | `/api/audit-logs` | Admin | List audit logs |
| GET | `/api/audit-logs/:id` | Admin | Get one audit log |

There are intentionally no audit-log PUT, PATCH or DELETE routes.

## 📦 Sample Payloads

### Create employee

```json
{
  "name": "Ali Raza",
  "email": "ali.raza@example.com",
  "phone": "+92 300 1234567",
  "department": "Engineering",
  "position": "Software Engineer",
  "salary": 160000,
  "joinDate": "2025-01-15",
  "status": "active"
}
```

### Update employee

```json
{
  "position": "Senior Software Engineer",
  "salary": 185000,
  "status": "active"
}
```

Before an update/delete is committed, the previous employee state is written to `audit_logs`.

## 🚀 Setup

### 1. Clone and install

```bash
git clone https://github.com/AbbasFullstack/FSD_2_EmployeeManagementSystem_BYTE.git
cd FSD_2_EmployeeManagementSystem_BYTE
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/employee_management
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=*
```

### 3. Seed

```bash
npm run seed
```

The seed resets the configured database and creates the requested demo admin, five varied employees and three simulated audit logs. The admin password can be supplied through `SEED_ADMIN_PASSWORD`; otherwise the script uses the task's default demo password.

### 4. Run

```bash
npm start
```

Open `http://localhost:5000`.

### 5. Test

```bash
npm test
```

Tests use an isolated mongodb-memory-server instance and do not use your normal MongoDB database.

## 🧪 Test Coverage

- Health check: 200
- Register, login and profile
- Employee list/get/create/update/delete
- Audit entry on employee PUT
- Audit entry on employee DELETE
- Previous state verification
- Audit log read-only PUT/DELETE behavior
- 400 validation/ID errors
- 401 authentication errors
- 403 admin authorization errors
- 404 missing resources/routes

## 🖼️ Screenshots

Add captured UI screenshots under `docs/screenshots/` after production/browser verification:

- `login.png` — login page
- `dashboard.png` — employee dashboard
- `employee-modal.png` — add/edit employee modal
- `audit-logs.png` — God Mode audit log screen

Example:

```md
![Login](docs/screenshots/login.png)
![Employee Dashboard](docs/screenshots/dashboard.png)
![Add/Edit Employee Modal](docs/screenshots/employee-modal.png)
![God Mode Audit Logs](docs/screenshots/audit-logs.png)
```

## ☁️ Deployment

### Render

Deploy the Express application as a Render Web Service:

- Build: `npm install`
- Start: `npm start`
- Add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` and `CLIENT_ORIGIN`
- Use MongoDB Atlas or another hosted MongoDB provider
- Render provides the public HTTPS backend URL

### Vercel

The repository is Vercel-ready for a single-project deployment:

- Static frontend files are served from `public/`.
- `api/index.js` exposes the existing Express application as a Vercel Node.js serverless function.
- `vercel.json` rewrites `/api/*` requests to the serverless entrypoint, so the existing frontend can keep using relative `/api` URLs.
- Configure these Vercel Production environment variables:
  - `MONGODB_URI` — MongoDB Atlas connection string
  - `JWT_SECRET` — long random signing secret
  - `JWT_EXPIRES_IN` — for example `7d`
  - `CLIENT_ORIGIN` — the final Vercel origin
- Never commit the real environment values to GitHub.

After deployment, verify `/api/health`, login, employee CRUD, and admin audit-log flows against the production MongoDB Atlas database.

### Live URL

**Deployment pending.** Add the final Vercel production URL here after a successful deployment and production verification.

## 🔒 Security Notes

- Passwords are bcrypt-hashed.
- JWT protects private endpoints.
- Admin middleware protects privileged mutations.
- Audit logs are append-only at the schema layer.
- Audit logs have no mutation API routes.
- Dynamic frontend values are HTML-escaped.
- Never commit a real `.env` file or production secrets.
- Do not use demo credentials in production.

## 📌 Internship

**ArithMatrix AVIP 2026 — Full Stack Development — Task 2**

Implemented stack and requirements: Node.js, Express, MongoDB/Mongoose, HTML/CSS/JS, JWT + bcrypt, express-validator, MVC, CRUD, admin authorization, persisted seed data, God Mode audit logging and automated isolated API testing.
