# GarageSale

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?logo=.net&logoColor=white)](https://dotnet.microsoft.com/) [![Blazor Server](https://img.shields.io/badge/Blazor-Server-512BD4?logo=blazor&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor) [![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

GarageSale is a small full-stack Blazor web application for listing, browsing, and purchasing second-hand items. It includes a product catalog, shopping cart, orders, seller profiles, and database seeding/migrations. The project is designed for local development with .NET and supports Docker-based workflows.

## Tech stack
- .NET (Blazor Server)
- Entity Framework Core (Migrations + Seeders)
- SQLite / PostgreSQL (configurable via connection string)
- Docker + Docker Compose (dev helpers included)

## Features
- Product listing and details
- Shopping cart and order checkout flow
- Seller profiles and simple catalog management
- Pre-seeded categories, conditions, and sample products

## Prerequisites
- .NET SDK 8.0 or later
- Docker & Docker Compose (optional, for containerized development)

## Configuration
Copy and adjust `appsettings.Development.json` as needed for local secrets and connection strings. If you use any third-party services (for example OpenAI integration), set the required keys via environment variables or your local `appsettings` file.

## Local development (dotnet)
1. Restore packages:

```bash
dotnet restore
```

2. Apply migrations and seed the database (from project root):

```bash
dotnet ef database update
```

3. Run the app:

```bash
dotnet run
```

The app will be available at `https://localhost:5001` or `http://localhost:5000` by default.

## Local development (Docker)
1. Build and start services using Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

2. Stop and remove containers when done:

```bash
docker-compose -f docker-compose.dev.yml down
```

## Database migrations & seeding
Migration files are tracked under the `Migrations/` folder. Seeders live in `Data/` (for example `ProductSeeder.cs` and `IdentitySeeder.cs`). When running locally, run `dotnet ef database update` to apply migrations and the seeding runs as part of app startup.





