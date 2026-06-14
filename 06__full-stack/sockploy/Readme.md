# Sockploy

A Docker container management platform with a web interface and reverse proxy capabilities.

## Features

- **Web Management Interface**: Deploy and manage Docker containers through a simple web UI
- **Reverse Proxy**: Automatic routing to containers via subdomain-based routing
- **Docker Integration**: Direct integration with Docker daemon for container management
- **Health Monitoring**: Built-in health check endpoints
- **Hot Reload**: Development support with Docker Compose Watch

## Prerequisites

- Docker and Docker Compose
- Node.js 24+ (for local development)
- Access to Docker socket (`/var/run/docker.sock`)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd sockploy
```

2. Build and start with Docker Compose:
```bash
docker-compose up --build
```

The application will be available at:
- Management UI: http://localhost:8080
- Reverse Proxy: http://localhost:80

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the application:
```bash
npm start
```

## Configuration

Environment variables can be set in `docker-compose.yaml` or a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `MANAGEMENT_PORT` | 8080 | Port for the management server |
| `RESOLVE_REVERSE_PROXY` | localhost | Hostname for reverse proxy resolution |
| `NETWORK_NAME` | sockploy-network | Docker network name for containers |

## Project Structure

```
sockploy/
├── src/
│   ├── config.js           # Configuration management
│   ├── docker.js           # Docker client setup
│   ├── docker.service.js   # Docker service operations
│   ├── management.js       # Express management server
│   ├── proxy.js            # Reverse proxy server
│   └── routes/             # API routes
│       ├── health.js       # Health check endpoints
│       ├── containers.js   # Container management endpoints
│       └── deploy.js       # Deployment endpoints
├── public/                 # Static web assets
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── server.js              # Application entry point
├── Dockerfile             # Docker image configuration
├── docker-compose.yaml    # Docker Compose configuration
└── package.json           # Node.js dependencies
```

## API Endpoints

### Health
- `GET /health` - Health check endpoint

### Containers
- `GET /api/containers` - List all containers
- `POST /api/containers/:id/start` - Start a container
- `POST /api/containers/:id/stop` - Stop a container
- `DELETE /api/containers/:id` - Remove a container

### Deploy
- `POST /api/deploy` - Deploy a new container

## Reverse Proxy

The reverse proxy routes traffic based on subdomain names. For example:
- `app1.localhost` → routes to container `app1` on port 80
- `app2.localhost` → routes to container `app2` on port 80

## Development

The project includes Docker Compose Watch support for hot reloading during development:

```bash
docker-compose up --watch
```

This will automatically sync file changes and rebuild when `package.json` or `package-lock.json` changes.

## License

ISC
