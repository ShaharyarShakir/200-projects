# Gym AI Planner

An AI-powered gym workout planning application that generates personalized training plans based on user profiles and fitness goals.

## Features

- **AI-Generated Training Plans**: Leverages OpenAI API to create customized workout plans
- **User Profiles**: Store fitness goals, experience level, equipment, and preferences
- **Modern Frontend**: React-based UI with TailwindCSS styling
- **RESTful API**: Express.js backend with PostgreSQL database
- **Real-time Updates**: WebSocket support for live updates
- **Docker Support**: Containerized deployment ready

## Tech Stack

### Frontend (`web/`)
- **React 19** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **React Compiler** for optimized performance

### Backend (`server/`)
- **Express.js** with TypeScript
- **Bun** runtime
- **Prisma ORM** with PostgreSQL
- **Neon Database** for hosted PostgreSQL
- **OpenAI API** for AI-powered workout generation
- **WebSocket** for real-time communication

### Database
- **PostgreSQL** via Neon
- **Prisma** for database management and migrations

## Project Structure

```
gym-ai-planner/
├── server/                 # Backend API
│   ├── prisma/            # Database schema and migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── generated/     # Prisma client
│   │   ├── lib/          # Utilities (Prisma client)
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Server entry point
│   ├── Dockerfile
│   └── package.json
├── web/                   # Frontend application
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── assets/       # Images, fonts
│   │   ├── constants/    # App constants
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (for frontend)
- **Bun** (for backend)
- **PostgreSQL** database (Neon recommended)
- **OpenAI API key**

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=verify-full
OPEN_ROUTER_KEY=your_openrouter_api_key
PORT=3001
NODE_ENV=development
BASE_URL=your_app_url
```

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
bun install
```

3. Generate Prisma client:
```bash
bunx prisma generate
```

4. Run database migrations:
```bash
bunx prisma migrate deploy
```

5. Start the development server:
```bash
bun run dev:client
```

The server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun run dev
```

The frontend will run on `http://localhost:5173`

## API Routes

### Profile Routes (`/api/profile`)
- Manage user fitness profiles including goals, experience, equipment, and preferences

### Plan Routes (`/api/plan`)
- Generate and retrieve AI-powered training plans
- Store and version workout plans

### Health Check
- `GET /health` - Server health status

## Database Schema

### `user_profiles`
Stores user fitness preferences and goals:
- `user_id`: Unique user identifier (UUID)
- `goal`: Fitness goal (e.g., muscle gain, fat loss)
- `experience`: Experience level (beginner, intermediate, advanced)
- `days_per_week`: Training frequency
- `session_length`: Duration per session (minutes)
- `equipment`: Available equipment
- `injuries`: Any injuries or limitations
- `preferred_split`: Training split preference

### `training_plans`
Stores AI-generated workout plans:
- `id`: Unique plan identifier (UUID)
- `user_id`: Associated user
- `plan_json`: Structured plan data (JSON)
- `plan_text`: Human-readable plan description
- `version`: Plan version number
- `created_at`: Creation timestamp

## Docker Deployment

### Build and Run with Docker

1. Build the server image:
```bash
cd server
docker build -t gym-ai-planner-server .
```

2. Run the container:
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL=your_database_url \
  -e OPENAI_API_KEY=your_openai_key \
  gym-ai-planner-server
```

## Development Scripts

### Server
```bash
bun run dev:client    # Start development server with watch
bun run start         # Start production server
bun run fmt           # Format code with oxfmt
bun run fmt:check     # Check code formatting
```

### Web
```bash
bun run dev           # Start development server
bun run build         # Build for production
bun run preview       # Preview production build
bun run lint          # Run ESLint
bun run fmt           # Format code with oxfmt
bun run fmt:check     # Check code formatting
```

## License

This project is public.
