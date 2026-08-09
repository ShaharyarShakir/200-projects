# BarberSaaS - Barber Shop Management SaaS

A multi-tenant SaaS application built for modern barber shop management, featuring a Node.js Express backend, React Vite shop dashboard, and React Native Expo mobile app.

---

## 🏗 Repository Architecture

```text
barbersaas/
├── backend/            # Express.js REST API (Node.js, Bun, Mongoose, Zod)
├── dashboard/          # Shop Dashboard (React, Vite, TanStack Router/Query, Tailwind CSS)
├── mobile/             # Client/Barber Mobile App (React Native, Expo, Expo Router)
├── docker/             # Docker configuration files
├── docs/               # Architecture & database schema plans
├── docker-compose.yml  # Local database (MongoDB + Mongo Express)
└── README.md
```

---

## 🛠 Tech Stack Summary

### Backend
- **Runtime & PM**: Node.js / Bun
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose
- **Validation & Auth**: Zod, JWT
- **Containerization**: Docker Compose (MongoDB, Mongo Express)

### Shop Dashboard
- **Framework**: React 19 + Vite
- **Routing & State**: TanStack Router, TanStack Query, Zustand
- **Styling & UI**: Tailwind CSS, shadcn/ui
- **Forms**: React Hook Form, Zod

### Mobile App
- **Framework**: React Native + Expo (SDK 57)
- **Routing**: Expo Router
- **Data Fetching**: TanStack Query

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://www.docker.com/) & Docker Compose

---

### 1. Database Infrastructure (Docker Compose)

Start MongoDB and Mongo Express containers locally:

```bash
docker compose up -d
```

- **MongoDB**: `localhost:27017`
- **Mongo Express UI**: [http://localhost:8081](http://localhost:8081)

---

### 2. Backend Setup

```bash
cd backend
bun install
bun run dev
```

The backend server will run at [http://localhost:5000](http://localhost:5000).

#### Health Check
```bash
curl http://localhost:5000/api/v1/health
```

---

### 3. Dashboard Setup

```bash
cd dashboard
bun install
bun run dev
```

Access the Shop Dashboard at [http://localhost:5173](http://localhost:5173).

---

### 4. Mobile Setup

```bash
cd mobile
bun install
bun start
```

Use the Expo Go app or an iOS/Android simulator to open the app.

---

## 📑 API Endpoints (`/api/v1`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/health` | `GET` | System status, database state, and uptime |
| `/api/v1/version` | `GET` | Current API build version |
| `/api/v1/auth` | - | Auth routes (Sprint 1 Phase 2) |
| `/api/v1/users` | - | User management |
| `/api/v1/shops` | - | Shop management |
| `/api/v1/employees` | - | Staff & barber schedules |
| `/api/v1/customers` | - | Customer management |

---

## 📜 Development Standards

- **Linting & Formatting**: Run `bun run lint` and `bun run format` inside each sub-application.
- **Request Validation**: All incoming requests are validated with **Zod**.
- **Architecture**: Thin controllers, business logic in services, data access via repository pattern.
