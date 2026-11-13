# 🌐 AlumniSphere – Smart College Alumni Networking & Mentorship Platform

A full-stack, secure, production-ready web application connecting university students with working alumni for networking, career mentorship, job discovery, and real-time collaboration.

![Tech Stack](https://img.shields.io/badge/React-Vite-blue) ![Backend](https://img.shields.io/badge/Node.js-Express-green) ![DB](https://img.shields.io/badge/MongoDB-Mongoose-darkgreen) ![Chat](https://img.shields.io/badge/Socket.io-Real--time-purple) ![Security](https://img.shields.io/badge/Security-Bcrypt%20%2B%20JWT-red)

---

## 🏛️ System Architecture

AlumniSphere employs a decoupled client-server architecture:

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (Vite, Tailwind CSS, Framer Motion, Socket.io-client)│
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs & WebSockets
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Express.js Backend                   │
│   (JWT Auth, Role Guards, Bcrypt 12 rounds, Socket.io) │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
                            ▼
┌────────────────────────────────────────────────────────┐
│             Persistent MongoDB / Atlas                 │
│   (Users, Connections, Mentorship, Messages, Opps)     │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Features & Functional Modules

### 1. Authentication & Security
- **Multi-Role Registration:** Allows legitimate student and alumni account creation.
- **Role Guard Security:** Prevents public users from self-registering as administrators (strictly enforced on backend).
- **Validation:** Strict regex email validation and minimum password strength check (6+ characters).
- **Password Hashing:** Passwords securely hashed with `bcryptjs` using 12 salt rounds before database persistence. Plaintext passwords are never stored.
- **Session Persistence:** Persistent login with JWT, browser refresh resilience, and a "Remember Me" option storing tokens appropriately in `localStorage` or `sessionStorage`.
- **Password Management:** Authenticated change-password functionality (`PUT /api/auth/change-password`).

### 2. Networking Connections System
- Dedicated `ConnectionRequest` flow independent from mentorship.
- Send connection requests, accept or reject incoming requests, and cancel pending requests.
- View connections with quick links to profiles, direct chat, or removal.
- Prevents duplicate connection requests.

### 3. Mentorship System
- Send, track, accept, or reject mentorship requests.
- Filter requests by tabs: **All**, **Received**, and **Sent**.
- Status tracking (`Pending`, `Accepted`, `Rejected`) with automatic bidirectional connection creation on acceptance.

### 4. Real-Time Messaging
- Real-time chat powered by **Socket.io** with fallback to REST API.
- Conversation list with unread badges and search filter.
- Real-time typing indicators and online/offline status tracking.
- Message history persisted in MongoDB with delivery and read receipts (`✓`, `✓✓`).
- Fully responsive design on mobile with toggleable list/chat views.

### 5. Career Opportunities Board
- Browse full-time jobs, internships, freelance contracts, and volunteer roles.
- Filter by type and search by keyword or company.
- Bookmark/save opportunities and submit one-click applications.
- Alumni and Administrators can post, manage, and delete opportunities.

### 6. Interactive Profiles & Discovery
- Editable profiles with headline, bio, skills, company, education, location, experience, and graduation year.
- Dynamic Profile Strength calculation meter.
- Discovery directory with debounced search and filtering by skills, roles, and engineering departments (CSE, Mech, ECE, Civil, etc.).
- Skill match percentage calculated in real-time based on shared profile skills.

### 7. Standalone Notifications
- Persistent notification history for connection requests, mentorship responses, messages, and job applications.
- Global "Mark all as read" and real-time unread badge counts in the navigation bar.

### 8. Administrative Dashboard
- Secure role-protected dashboard for platform administrators (`admin` role).
- Complete user management list with search and role filtering.
- Change user roles (promote/demote) and delete accounts with associated data cleanup.
- Platform-wide analytics (Total users, alumni, students, active opportunities).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS 3, Framer Motion, React Router 7, Axios, React Hot Toast, Lucide Icons |
| **Backend** | Node.js, Express.js 4, Socket.io 4, MongoDB, Mongoose 8, JWT, Bcrypt.js |
| **Database** | MongoDB Atlas / Local MongoDB 6+ |
| **Hosting** | Vercel (Frontend), Render / Railway / Heroku (Backend) |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested with v20 and v24)
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure your environment variables in `backend/.env` (or copy from `backend/.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/alumnisphere
JWT_SECRET=alumnisphere_super_secret_jwt_key_prod_2024
JWT_EXPIRE=30d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://alumni-sphere-2.vercel.app
```

Run database seed script to populate sample accounts (Safe Mode: won't overwrite existing accounts unless `--force` is passed):

```bash
node seed.js
```

Start the backend server:

```bash
npm start
# or for live reload:
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📝 Demo Accounts

After running `node seed.js`:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Admin** | `admin@alumnisphere.com` | `password123` | Platform Administrator with Admin Panel |
| **Alumni** | `priya@alumni.com` | `password123` | Senior SWE at Google, Mentor |
| **Student** | `arjun@student.com` | `password123` | CS Student at IIT Madras |
| **Alumni (Mech)** | `rajesh@alumni.com` | `password123` | Mech Engineer at Tesla |

*You can also create unlimited new student and alumni accounts using the Sign Up page.*

---

## 📡 API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `POST` | `/api/auth/register` | Register new student or alumni | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Yes |
| `PUT` | `/api/auth/change-password` | Update user password | Yes |

### Connections (`/api/connections`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `GET` | `/api/connections` | Get user's connections list | Yes |
| `POST` | `/api/connections/request` | Send connection request | Yes |
| `GET` | `/api/connections/requests` | Get sent/received requests | Yes |
| `PUT` | `/api/connections/respond/:id` | Accept or reject connection | Yes |
| `DELETE` | `/api/connections/request/:id` | Cancel pending sent request | Yes |
| `DELETE` | `/api/connections/:userId` | Disconnect / remove connection | Yes |

### Mentorship (`/api/mentorship`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `POST` | `/api/mentorship` | Send mentorship request | Yes |
| `GET` | `/api/mentorship` | List mentorship requests (`all`, `sent`, `received`) | Yes |
| `PUT` | `/api/mentorship/:id` | Accept or reject mentorship | Yes |

### Messages & Chat (`/api/messages`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `GET` | `/api/messages/conversations` | List active conversations with unread count | Yes |
| `GET` | `/api/messages/:userId` | Get messages with specific user | Yes |
| `POST` | `/api/messages` | Send message (REST fallback) | Yes |

### Opportunities (`/api/opportunities`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `GET` | `/api/opportunities` | Search & filter opportunities | Yes |
| `POST` | `/api/opportunities` | Create opportunity | Alumni / Admin |
| `DELETE` | `/api/opportunities/:id` | Delete opportunity | Poster / Admin |
| `PUT` | `/api/opportunities/:id/save` | Bookmark / unsave opportunity | Yes |
| `PUT` | `/api/opportunities/:id/apply` | Apply to opportunity | Yes |

### Users & Administration (`/api/users`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `GET` | `/api/users` | Search directory with filters | Yes |
| `GET` | `/api/users/:id` | Get user profile details | Yes |
| `PUT` | `/api/users/profile` | Update profile information | Yes |
| `GET` | `/api/users/recommendations` | Skill-based AI suggestions | Yes |
| `GET` | `/api/users/leaderboard` | Top alumni leaderboard | Yes |
| `GET` | `/api/users/stats` | Dashboard statistics | Yes |
| `GET` | `/api/users/trending-skills` | Platform skill trends | Yes |
| `GET` | `/api/users/admin/users` | List all users with filters | Admin Only |
| `DELETE` | `/api/users/admin/:id` | Delete user account & data | Admin Only |
| `PUT` | `/api/users/admin/:id/role` | Modify user role | Admin Only |

### System & Health (`/api/health`)
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| `GET` | `/api/health` | Service status, uptime, MongoDB state | No |

---

## 🧪 Automated Testing

Run the automated backend test suite (tests bcrypt hashing, JWT validation, role security, input validation, models, and authorization guards):

```bash
cd backend
npm test
```

Test the frontend production build:

```bash
cd frontend
npm run build
```

---

## 🚢 Production Deployment

### 1. Persistent Database (MongoDB Atlas)
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a new cluster and select your preferred region.
3. Under **Database Access**, create a database user with password.
4. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) so your cloud hosting can connect.
5. In **Clusters** → **Connect** → **Drivers**, copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/alumnisphere?retryWrites=true&w=majority
   ```

### 2. Backend Hosting (Render or Railway)
1. Push the project repository to GitHub.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service**.
3. Point to the repository and set Root Directory to `backend`.
4. Configure commands:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Configure Environment Variables:
   - `PORT`: `5000` (or let provider set it)
   - `NODE_ENV`: `production`
   - `MONGO_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *A secure random string (at least 32 characters)*
   - `JWT_EXPIRE`: `30d`
   - `CORS_ORIGIN`: `https://alumni-sphere-2.vercel.app` (or your Vercel URL)
6. Verify deployment by visiting `https://your-backend.onrender.com/api/health`.

### 3. Frontend Hosting (Vercel)
1. In [Vercel](https://vercel.com), import your GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Configure Environment Variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
7. Click **Deploy**. SPA routing is pre-configured via `frontend/vercel.json`.

---

## 💾 Database Backup & Restore

### Backup
To export your MongoDB database to a local archive:
```bash
mongodump --uri="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/alumnisphere" --archive=alumnisphere_backup.archive --gzip
```

### Restore
To restore data from an archive:
```bash
mongorestore --uri="mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/alumnisphere" --archive=alumnisphere_backup.archive --gzip --drop
```

---

© 2024 AlumniSphere. Built with ❤️ for the global alumni community.
