# S3 Upload - Full-Stack Product Management App

A full-stack application for managing products with AWS S3 image uploads. Built with Hono (Bun) backend and SvelteKit frontend.

## Tech Stack

### Backend
- Hono (Bun) - Web framework
- MongoDB with Mongoose - Database
- AWS S3 - Image storage (with presigned URLs)
- Docker Compose - MongoDB container

### Frontend
- SvelteKit - Frontend framework
- Tailwind CSS - Styling
- Vite - Build tool

## Features

- Product listing with images
- Create new products with image uploads to S3
- Presigned URL uploads from frontend directly to S3
- CloudFront CDN for fast image delivery

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) installed (for MongoDB)
- AWS account with S3 bucket and CloudFront distribution

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
S3_BUCKET_NAME=your-bucket-name
MONGODB_URI=mongodb://root:pass@localhost:27017/s3-upload?authSource=admin
```

### Installation

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
bun install
```

3. Start MongoDB via Docker:
```bash
docker-compose up -d
```

4. Start backend server:
```bash
bun run dev
```

Backend will be available at http://localhost:4000

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frondend
```

2. Install dependencies:
```bash
bun install
```

3. Start frontend development server:
```bash
bun run dev
```

Frontend will be available at http://localhost:5173

## Project Structure

```
s3-upload/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Hono server
│   │   ├── db.ts              # MongoDB connection
│   │   └── product.model.ts   # Product model
│   ├── docker-compose.yaml    # MongoDB container
│   └── package.json
└── frondend/
    ├── src/
    │   └── routes/
    │       ├── +page.svelte   # Product listing
    │       └── create/
    │           └── +page.svelte # Product creation
    └── package.json
```

## API Endpoints

- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `POST /api/get-presigned-url` - Get S3 presigned URL for upload
