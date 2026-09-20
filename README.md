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

Add captured UI screenshots under `docs/screenshots/`:

- `dashboard.png` — employee dashboard
- `audit-logs.png` — God Mode audit log screen
- `employee-modal.png` — add/edit employee modal

Example:

```md
![Employee Dashboard](docs/screenshots/dashboard.png)
![God Mode Audit Logs](docs/screenshots/audit-logs.png)
![Add/Edit Employee Modal](docs/screenshots/employee-modal.png)
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

The current repository serves the frontend from Express `public/`. For a separate Vercel frontend, deploy the `public` directory and configure its API base/rewrite to the Render backend. The current browser code uses relative `/api` requests, so a Vercel/Render split needs that API routing configuration before production use.

### Live URL

**Not deployed yet.** Add the Render/Vercel URL here after deployment.

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
