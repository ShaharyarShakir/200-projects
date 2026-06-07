# Gossip

A real-time chat application with a React web client and a Node.js backend.

## Tech Stack

### Backend

- **Runtime:** Bun
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose
- **Auth:** Clerk (`@clerk/express`)
- **Real-time:** Socket.IO
- **Language:** TypeScript

### Web

- **Framework:** React 19 + Vite
- **Auth:** Clerk (`@clerk/react`)
- **Routing:** React Router v7
- **Data fetching:** TanStack Query
- **Real-time:** Socket.IO client
- **State:** Zustand
- **Styling:** Tailwind CSS v4 + DaisyUI
- **HTTP:** Axios

## Project Structure

```
gossip/
├── backend/      # Express API + Socket.IO server
├── web/          # React web app

```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- MongoDB instance running (or use the provided Docker Compose)
- Clerk account with an application set up

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI, CLERK_SECRET_KEY, etc.
bun install
bun run dev            # starts on http://localhost:3000
```

Or with Docker:

```bash
docker-compose up
```

### 2. Web

```bash
cd web
cp .env.example .env   # fill in VITE_CLERK_PUBLISHABLE_KEY
bun install
bun run dev            # starts on http://localhost:5173
```

## Environment Variables

### Backend `.env`

| Variable                | Description                |
| ----------------------- | -------------------------- |
| `MONGODB_URI`           | MongoDB connection string  |
| `CLERK_SECRET_KEY`      | Clerk secret key           |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key      |
| `FRONTEND_URL`          | Web app URL (production)   |
| `PORT`                  | Server port (default 3000) |

### Web `.env`

| Variable                     | Description           |
| ---------------------------- | --------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_API_URL`               | Backend API URL       |

## API Routes

| Method | Path                             | Description             |
| ------ | -------------------------------- | ----------------------- |
| GET    | `/api/auth/me`                   | Get current user        |
| POST   | `/api/auth/callback`             | Sync Clerk user to DB   |
| GET    | `/api/chats`                     | Get user's chats        |
| POST   | `/api/chats/with/:participantId` | Get or create a chat    |
| GET    | `/api/messages/chat/:chatId`     | Get messages for a chat |
| GET    | `/api/users`                     | Get all users           |

## Features

- Real-time messaging via WebSockets
- Online presence indicators
- Typing indicators
- Authentication via Clerk (social + email)
