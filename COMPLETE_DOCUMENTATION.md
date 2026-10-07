# Student–College HTTP Communication & Examination System

A polished academic mini project that demonstrates **how a student's browser communicates with a
college web server using HTTP** — GET and POST methods, request/response headers, request bodies,
status codes, client–server communication, JWT authentication, examination data retrieval and
test-case evaluation.

> Browser → React (Vite) → **HTTP request** → Node.js + Express → **MongoDB** → **HTTP response**
> → React → Browser

Every request in this application is **real**. Nothing is mocked, faked or simulated on the
frontend: `axios.get('/api/exams')` really reaches `GET /api/exams` on the Express server, which
really queries MongoDB and really returns an HTTP status code that you can inspect in Chrome
DevTools → Network.

---

## Table of contents

1. [Project title](#1-project-title)
2. [Project objective](#2-project-objective)
3. [Features](#3-features)
4. [Architecture](#4-architecture)
5. [Technology stack](#5-technology-stack)
6. [Folder structure](#6-folder-structure)
7. [MongoDB setup](#7-mongodb-setup)
8. [Environment variables](#8-environment-variables)
9. [Backend installation](#9-backend-installation)
10. [Frontend installation](#10-frontend-installation)
11. [Database seeding](#11-database-seeding)
12. [Running the project](#12-running-the-project)
13. [API documentation](#13-api-documentation)
14. [HTTP GET explanation](#14-http-get-explanation)
15. [HTTP POST explanation](#15-http-post-explanation)
16. [Status code explanation](#16-status-code-explanation)
17. [HTTP request/response analysis](#17-http-requestresponse-analysis)
18. [Test cases](#18-test-cases)
19. [Screenshots](#19-screenshots)
20. [Future enhancements](#20-future-enhancements)
21. [Conclusion](#21-conclusion)

---

## 1. Project title

**Student–College HTTP Communication & Examination System**
(subtitle: *Student Communication Portal*)

---

## 2. Project objective

The objective is to make browser-to-server communication visible and understandable. A student
logs in, retrieves examination data and submits personal information; each of those actions is an
HTTP request that can be observed, measured and explained.

The system proves that:

| Concept | How it is demonstrated |
| --- | --- |
| **GET = retrieve information** | `GET /api/exams` returns the examination list with **200 OK** |
| **POST = send information** | `POST /api/auth/login` sends credentials, `POST /api/students/information` creates a record with **201 Created** |
| **HTTP request headers** | `Content-Type`, `Authorization: Bearer <JWT>`, `User-Agent`, `X-Request-Id` |
| **HTTP request body** | JSON payload of every POST/PUT (passwords masked to `********`) |
| **HTTP response headers** | `Content-Type`, `X-Request-Id`, `X-Response-Time`, `RateLimit-*` |
| **HTTP response body** | `{ success, message, data }` / `{ success, message, errorCode }` |
| **HTTP status codes** | 200, 201, 400, 401, 403, 404, 409, 429, 500 (see §16) |
| **Client–server communication** | React on `:5173` calls Express on `:5000` cross-origin with CORS |
| **Persistent storage** | MongoDB Atlas collections: `students`, `examinations`, `httplogs` |
| **Request monitoring** | Backend `httpLogs` collection + live browser interceptor |

---

## 3. Features

**Authentication**
- JWT login (`POST /api/auth/login`), session restore (`GET /api/auth/me`), logout
- bcrypt password hashing (cost 12) — plain text passwords are never stored or logged
- Remember-me (localStorage) vs. session-only (sessionStorage)
- Protected routes redirect unauthenticated users to the login screen

**Examinations**
- Server-rendered list loaded with one `GET /api/exams`
- Search, filter by exam type, filter by date
- Loading, error (with retry), empty and responsive table/card layouts

**Student information**
- Full form (name, register number, email, department, year, section, phone)
- `POST /api/students/information` → **201 Created**, `PUT` → **200 OK**
- Field level validation, 400 on incomplete data, 409 on duplicate register number

**HTTP monitoring (core feature)**
- Live browser-side interceptor recording every Axios exchange (headers, body, status, duration)
- Server-side logger persisting masked request/response data in MongoDB
- Statistics: total, GET, POST, successful, failed, average/fastest/slowest response time
- Recharts: GET vs POST, success vs failure, status-code distribution, response-time chart
- Request table with colour coding and a full request/response inspector modal
- Request History page with filters and pagination
- API Test Center that executes TC01–TC11 against the live server

**Security & quality**
- Helmet, CORS, express-rate-limit, express-validator, centralised error handling
- Consistent JSON envelopes, no stack traces in production, no secrets in the repository
- Responsive from 1920px down to 390px, accessible focus states, keyboard friendly forms

---

## 4. Architecture

```
┌──────────────────────┐
│   Student Browser    │
└──────────┬───────────┘
           │ renders
┌──────────▼───────────┐
│  React + Vite (:5173)│  components / pages / services / axios interceptors
└──────────┬───────────┘
           │ HTTP request (JSON + Authorization header)
           │   GET  /api/exams            -> 200 OK
           │   POST /api/auth/login       -> 200 OK / 401
           │   POST /api/students/information -> 201 Created
┌──────────▼───────────┐
│ Express (:5000)      │  helmet → CORS → body parser → morgan →
│  Node.js + Mongoose  │  request logger → rate limit → routes →
│                      │  validation → controller → error middleware
└──────────┬───────────┘
           │ MongoDB driver (Mongoose)
┌──────────▼───────────┐
│   MongoDB Atlas      │  students · examinations · httplogs
└──────────┬───────────┘
           │ HTTP response (status + JSON body)
┌──────────▼───────────┐
│  React → Browser UI  │  status code, toast, table, chart
└──────────────────────┘
```

**Request lifecycle (visualised inside the app on Dashboard and HTTP Monitor):**

`Browser → HTTP Request → Express Server → Route → Controller → MongoDB → Controller → HTTP Response → Browser`

---

## 5. Technology stack

**Frontend:** React 18 · Vite · JavaScript (ESM) · HTML5 · CSS3 · React Router 6 · Axios ·
Lucide React (icons) · Recharts (charts)

**Backend:** Node.js · Express.js · Mongoose · JWT (`jsonwebtoken`) · bcrypt · dotenv · cors ·
helmet · express-rate-limit · express-validator · morgan

**Database:** MongoDB Atlas (Mongoose ODM)

---

## 6. Folder structure

```
student-http-communication-system/
├── client/
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx  Sidebar.jsx  StatCard.jsx  StatusBadge.jsx
│   │   │   ├── LoadingSpinner.jsx  ErrorMessage.jsx  ProtectedRoute.jsx
│   │   │   ├── RequestViewer.jsx  ResponseViewer.jsx  HttpInspector.jsx
│   │   │   ├── Modal.jsx  AppShell.jsx  LifecycleFlow.jsx  HttpConceptCards.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx  Dashboard.jsx  ExaminationDetails.jsx
│   │   │   ├── StudentInformation.jsx  HttpMonitor.jsx  RequestHistory.jsx
│   │   │   ├── ApiTestCenter.jsx  Profile.jsx  NotFound.jsx
│   │   ├── services/  api.js  authService.js  examService.js  studentService.js  httpLogService.js
│   │   ├── context/   AuthContext.jsx  ToastContext.jsx
│   │   ├── hooks/     useHttpMonitor.js
│   │   ├── utils/     formatDate.js  statusCode.js
│   │   ├── App.jsx  main.jsx  index.css
│   ├── index.html  vite.config.js  package.json
│
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/  authController.js  examController.js
│   │   │                 studentController.js  httpLogController.js  demoController.js
│   │   ├── middleware/   authMiddleware.js  errorMiddleware.js
│   │   │                 requestLogger.js  validationMiddleware.js  rateLimiter.js
│   │   ├── models/       Student.js  Examination.js  HttpLog.js
│   │   ├── routes/       authRoutes.js  examRoutes.js  studentRoutes.js
│   │   │                 httpLogRoutes.js  demoRoutes.js
│   │   ├── services/     httpLogService.js
│   │   ├── utils/        generateToken.js  response.js
│   │   ├── seed/         seedDatabase.js
│   │   ├── app.js  server.js
│   ├── .env.example  package.json
│
├── README.md  .gitignore  package.json
```

---

## 7. MongoDB setup

1. Create a free account at <https://www.mongodb.com/atlas>.
2. Create a free **M0** cluster (any region).
3. **Database Access** → Add a new database user → authentication method *Password* → save the
   username and password.
4. **Network Access** → Add IP address → `0.0.0.0/0` (or your current IP) so your laptop can
   connect.
5. **Clusters** → *Connect* → *Drivers* → choose **Node.js** → copy the connection string, e.g.

   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. Replace `<user>` / `<password>` — the password must be URL-encoded if it contains `@`, `:`,
   `/` or other special characters.

> Never hardcode the connection string in source code. It lives only in `server/.env`, which is
> ignored by Git.

---

## 8. Environment variables

Create `server/.env` from the template:

```bash
cp server/.env.example server/.env
```

| Key | Example | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Express listen port |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas connection string |
| `JWT_SECRET` | `a-long-random-string` | Signs/verifies the JWT |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | `development` shows stack traces, `production` hides them |

Optional on the client (`client/.env`): `VITE_API_URL` (defaults to `http://localhost:5000/api`).

**Never commit `.env`.** `.gitignore` excludes `server/.env`, `client/.env` and every `.env*`
variant. The server refuses to start with placeholder values so no secret can be accidentally
shipped.

---

## 9. Backend installation

```bash
cd server
npm install
```

## 10. Frontend installation

```bash
cd client
npm install
```

Or install everything from the project root:

```bash
npm run install-all
```

---

## 11. Database seeding

```bash
npm run seed          # from the project root
# or
cd server && npm run seed
```

The seed script is idempotent (it resets the three collections) and creates:

- **3 sample students** with bcrypt-hashed passwords
- **8 examination records** (4 already conducted, 4 upcoming — dates are relative to today)
- **16 sample HTTP log records** so charts have data before the first interaction

**Demo credentials (safe, non-real data):**

| Email | Password | Register number |
| --- | --- | --- |
| `student@college.edu` | `password` | 23CSE101 |
| `priya@college.edu` | `password` | 23CSE102 |
| `karthik@college.edu` | `password` | 23ECE204 |

---

## 12. Running the project

From the project root:

```bash
npm install          # installs concurrently
npm run seed         # optional: load demo data
npm run dev          # starts server (:5000) and client (:5173) together
```

Or run them separately:

```bash
npm run server       # Express + Mongoose on http://localhost:5000
npm run client       # Vite dev server on http://localhost:5173
```

Expected console output:

```
MongoDB connected successfully
Server running on port 5000
API base URL: http://localhost:5000/api
Environment: development
```

Open **http://localhost:5173** and sign in with `student@college.edu` / `password`.

| Command | What it does |
| --- | --- |
| `npm install` | installs root tooling (concurrently) |
| `npm run install-all` | installs root + server + client dependencies |
| `npm run dev` | server and client at the same time |
| `npm run server` | Express only |
| `npm run client` | Vite only |
| `npm run seed` | resets and seeds MongoDB |
| `npm run build` | production build of the client |

---

## 13. API documentation

Base URL: `http://localhost:5000/api`
Protected endpoints require `Authorization: Bearer <JWT>`.

### Response envelope

```json
{ "success": true,  "message": "…", "data": { } }
{ "success": false, "message": "…", "errorCode": "VALIDATION_ERROR", "errors": [ ] }
```

### Authentication

| Method | Endpoint | Auth | Success | Failures |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | – | **200 OK** `{token, student}` | 400 invalid payload · 401 wrong credentials · 429 rate limited |
| GET | `/api/auth/me` | JWT | **200 OK** `{student}` | 401 missing/invalid/expired token |
| POST | `/api/auth/logout` | – | **200 OK** | – |

```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{ "email": "student@college.edu", "password": "password" }
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-Id: 8f1c2a9b
X-Response-Time: 124.3ms

{ "success": true, "message": "Login successful", "token": "eyJhbGciOi…",
  "student": { "name": "Arul Palanivel", "registerNumber": "23CSE101", "year": 3 } }
```

### Examinations

| Method | Endpoint | Auth | Success | Failures |
| --- | --- | --- | --- | --- |
| GET | `/api/exams` | JWT | **200 OK** `{count, examinations[]}` | 400 bad query · 401 |
| GET | `/api/exams/:id` | JWT | **200 OK** `{examination}` | 400 malformed id · 401 · **404 Not Found** |

Optional query: `?examType=`, `?department=`, `?year=`, `?status=upcoming|completed`

### Student information

| Method | Endpoint | Auth | Success | Failures |
| --- | --- | --- | --- | --- |
| GET | `/api/students/profile` | JWT | **200 OK** `{student}` | 401 |
| POST | `/api/students/information` | JWT | **201 Created** | **400** incomplete/invalid · 401 · **409 Conflict** duplicate register number/email |
| PUT | `/api/students/information` | JWT | **200 OK** | 400 · 401 · 409 |

```http
POST /api/students/information HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: application/json

{ "name": "Arul Palanivel", "registerNumber": "23CSE101", "email": "student@college.edu",
  "department": "Computer Science and Engineering", "year": 3, "section": "A",
  "phone": "9876543210" }
```

### HTTP monitoring

| Method | Endpoint | Auth | Success | Failures |
| --- | --- | --- | --- | --- |
| GET | `/api/http-logs` | JWT | **200 OK** `{logs[], pagination}` | 400 bad filter · 401 · **403 Forbidden** (another student's logs) |
| GET | `/api/http-logs/:id` | JWT | **200 OK** `{log}` | 400 · 401 · 403 · 404 |
| GET | `/api/http-logs/statistics` | JWT | **200 OK** `{statistics}` | 401 |

Query params: `limit` (1–200), `page`, `method`, `statusCode`, `search`, `studentId`, `from`, `to`.

Statistics payload:

```json
{ "total": 60, "get": 42, "post": 18, "successful": 55, "failed": 5,
  "averageResponseTime": 126, "fastestResponseTime": 3, "slowestResponseTime": 231,
  "methodDistribution": [ { "method": "GET", "count": 42 } ],
  "statusCodes": [ { "statusCode": 200, "count": 40 } ] }
```

### Utility

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/` | – | API index |
| GET | `/api/health` | – | `{status, database, uptime}` — powers the System Status widget |
| GET | `/api/demo/server-error` | – | **500** — demonstrates TC11 |
| GET | `/api/demo/forbidden` | JWT | **403** — authenticated but not authorised |

---

## 14. HTTP GET explanation

**GET retrieves information and must never change server state.**

```
React                     Express                      MongoDB
  │  GET /api/exams         │                            │
  │ ───────────────────────►│  protect() verifies JWT    │
  │  Authorization: Bearer …│  controller runs           │
  │                         │ ──────────────────────────►│ find()
  │                         │ ◄──────────────────────────│ documents
  │ ◄───────────────────────│  200 OK + JSON body        │
```

* the URL and query string carry the parameters
* no request body is required
* safe to retry, cacheable, idempotent
* in this project: `GET /api/exams`, `GET /api/students/profile`, `GET /api/http-logs`,
  `GET /api/auth/me`, `GET /api/health`

## 15. HTTP POST explanation

**POST sends data to the server to create or act on a resource.**

```
React                          Express                    MongoDB
  │  POST /api/auth/login       │                          │
  │  Content-Type: application/json                         │
  │  {"email":"…","password":"…"}│  rate limit → validate   │
  │ ───────────────────────────►│  bcrypt compare          │
  │                             │ ────────────────────────►│ findOne()
  │                             │ ◄────────────────────────│ student
  │ ◄───────────────────────────│  200 OK + JWT  (or 401)  │
```

* data travels in the **request body** as JSON
* `Authorization: Bearer <JWT>` proves who the student is (except for login)
* not idempotent — each POST creates a record or performs an action
* in this project: `POST /api/auth/login`, `POST /api/students/information`,
  `POST /api/auth/logout`

**GET vs POST at a glance**

| | GET | POST |
| --- | --- | --- |
| Purpose | Retrieve | Send / create |
| Request body | No | Yes (JSON) |
| Parameters | URL query | Body |
| Bookmarked? | Yes | No |
| Typical codes | 200, 400, 401, 404 | 200, 201, 400, 401, 409, 429 |

---

## 16. Status code explanation

| Code | Meaning | Where it happens in this project |
| --- | --- | --- |
| **200 OK** | Request processed successfully | Login, `GET /api/exams`, profile, statistics |
| **201 Created** | New resource created | `POST /api/students/information` |
| **400 Bad Request** | Invalid/missing data | Missing email, incomplete information form, malformed id |
| **401 Unauthorized** | Authentication failed | Wrong password, missing/expired JWT |
| **403 Forbidden** | Authenticated but not allowed | Reading another student's HTTP logs |
| **404 Not Found** | Route/resource does not exist | `GET /api/invalid`, unknown exam id, unknown page |
| **409 Conflict** | Conflicting existing record | Duplicate register number or email |
| **429 Too Many Requests** | Rate limit exceeded | >10 login attempts within one minute |
| **500 Internal Server Error** | Unexpected server failure | `GET /api/demo/server-error` (simulated DB failure) |

2xx = success, 3xx = redirection, 4xx = the *client* sent something wrong, 5xx = the *server*
failed.

---

## 17. HTTP request/response analysis

Everything can be demonstrated live with **Chrome DevTools → Network**.

### Demonstration procedure

1. Open `http://localhost:5173`, press **F12** → **Network** tab, enable *Preserve log*.
2. Sign in. You will see `login` with **Status 200**, **Type xhr**, **Initiator: xhr**.
   - Click it → **Headers** → *Request URL*, *Request Method: POST*, *Status Code: 200 OK*,
     *Response Headers* (`Content-Type`, `X-Request-Id`, `X-Response-Time`, `RateLimit-Remaining`).
   - **Payload → Request Payload** (or *View source*) shows
     `{"email":"student@college.edu","password":"********"}` — the raw password is never displayed.
   - **Preview/Response** shows `{ "success": true, "message": "Login successful", … }`.
   - **Timing** shows the breakdown (DNS, TCP, content download).
3. Open **Examinations** → `exams` with **Status 200** and *Request Method: GET* (no payload).
4. Submit **Student Information** → `information` with **Status 201 Created** and a JSON payload.
5. Log out and sign in with a wrong password → `login` → **401**.
6. In the address bar open `http://localhost:5000/api/invalid` → **404** JSON.
7. Open **HTTP Monitor** → *Live session* tab: the same exchanges, with headers and bodies.
8. Open **Request History**: the same exchanges as persisted by the server logger.
9. Open **API Test Center** → *Run all cases* to execute TC01–TC11 automatically.

### Anatomy of the exchange

**Request headers sent by the browser**

```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…
User-Agent: Mozilla/5.0 …
Accept: application/json
Origin: http://localhost:5173
```

**Response headers sent by Express**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
X-Request-Id: 3ad9f0c1
X-Response-Time: 124.3ms
RateLimit-Limit: 10
RateLimit-Remaining: 9
```

**Response body**

```json
{ "success": true, "message": "Login successful", "data": { "token": "eyJ…", "student": { … } } }
```

---

## 18. Test cases

The same cases are executable from the in-app **API Test Center** page.

| ID | Test case | Request | Expected |
| --- | --- | --- | --- |
| TC01 | Valid student login | `POST /api/auth/login` correct credentials | **200 OK** |
| TC02 | Invalid password | `POST /api/auth/login` wrong password | **401 Unauthorized** |
| TC03 | Missing email | `POST /api/auth/login` body without `email` | **400 Bad Request** |
| TC04 | View examination details | `GET /api/exams` with JWT | **200 OK** |
| TC05 | Submit valid student information | `POST /api/students/information` complete body | **201 Created** |
| TC06 | Submit incomplete information | `POST /api/students/information` partial body | **400 Bad Request** |
| TC07 | Duplicate register number | `POST /api/students/information` register number of another student | **409 Conflict** |
| TC08 | Protected API without JWT | `GET /api/auth/me` no Authorization header | **401 Unauthorized** |
| TC09 | Invalid endpoint | `GET /api/invalid` | **404 Not Found** |
| TC10 | Excessive requests | >10 `POST /api/auth/login` within one minute | **429 Too Many Requests** |
| TC11 | Simulated server/database failure | `GET /api/demo/server-error` | **500 Internal Server Error** |

Expected result: **all cases pass**. TC10 is excluded from *Run all* because it temporarily locks
the login endpoint for ~60 seconds — run it on its own.

Equivalent `curl` checks:

```bash
# TC01
curl -i -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@college.edu","password":"password"}'
# TC09
curl -i http://localhost:5000/api/invalid
# TC08 (no token)
curl -i http://localhost:5000/api/auth/me
```

---

## 19. Screenshots

Capture these screens while the project runs (suggested names for `docs/screenshots/`):

| File | Screen | What to show |
| --- | --- | --- |
| `01-login.png` | Login | Split layout, demo credential hint |
| `02-network-login.png` | DevTools | `POST /api/auth/login` → 200 with payload + response headers |
| `03-dashboard.png` | Dashboard | Welcome, statistics, upcoming exam, recent requests, lifecycle |
| `04-examinations.png` | Examinations | Table, search and filters after `GET /api/exams` |
| `05-network-exams.png` | DevTools | `GET /api/exams` → 200, no request payload |
| `06-student-information.png` | Student Information | Form + success panel with **201 Created** |
| `07-http-monitor.png` | HTTP Monitor | Six statistics, three charts, colour-coded request table |
| `08-inspector.png` | Request detail | Headers, masked body, status, response time |
| `09-request-history.png` | Request History | Persisted logs with filters and pagination |
| `10-api-test-center.png` | API Test Center | TC01–TC11 results |
| `11-404-and-401.png` | Error demos | 404 and 401 responses in DevTools |

---

## 20. Future enhancements

- Refresh-token rotation with an HTTP-only cookie store
- Refresh tokens / session revocation list
- Roles (student / faculty / administrator) and faculty-side examination publishing
- WebSocket push of live request traffic instead of polling
- Export logs to CSV/PDF, log retention policy and TTL indexes
- Automated integration test suite (Jest + Supertest + mongodb-memory-server)
- PWA/offline support and end-to-end tests with Playwright
- Accessibility audit (WCAG 2.1 AA) and light/dark theme toggle

---

## 21. Conclusion

This project turns the invisible part of web development — the HTTP conversation between browser
and server — into something a student can watch, filter and explain. React sends real GET and
POST requests, Express answers with real status codes and JSON bodies, MongoDB stores real
records, and the HTTP Monitor records every exchange from both sides. The result is a complete,
demonstrable academic mini project: log in, retrieve examinations, submit information, then open
the monitor and show exactly how the browser and the college server talked to each other.

---

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Cannot start - environment is incomplete` | Create `server/.env` from `.env.example`, set `MONGODB_URI` and `JWT_SECRET` |
| `MongoDB connection failed` | Check the Atlas connection string, database user and IP allow-list |
| CORS error in the browser | Make sure the client runs on `localhost`/`127.0.0.1` or add its origin to `CLIENT_URL` |
| `Cannot reach the college server` in the UI | Start the backend (`npm run server`) — it listens on port 5000 |
| Empty examination list | Run `npm run seed` |
| Login returns 429 | Wait 60 seconds (10 login attempts per minute are allowed) |
