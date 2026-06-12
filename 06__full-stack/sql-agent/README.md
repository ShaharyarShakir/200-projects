# 📊 SQL Agent

An interactive AI chatbot designed to help non-technical users query SQL databases using natural language. The system dynamically retrieves database schema definitions and translates user inquiries into precise SQL queries, executing them securely and formatting the results.

---

## 🚀 Key Features

* **Natural Language to SQL:** Translate everyday questions (e.g., *"Show me all electronics products that have low stock"*) into functional SQL queries.
* **Safe Mode Guardrails:** Enforces `SELECT` queries only, preventing any accidental modification, insertion, or deletion of data (`INSERT`, `UPDATE`, `DELETE`, `DROP`).
* **Schema-Aware Interaction:** The agent dynamically reads table schema definitions to construct accurate SQL queries.
* **Interactive Query Preview:** Displays the exact generated SQL query and its execution status within the chat interface.
* **Formatted Query Results:** Clean presentation of database query outputs in a structured visual format.
* **Premium Dark Mode UI:** Modern chat interface featuring smooth typography, glassmorphic UI accents, and dynamic loading animations.

---

## 🛠 Tech Stack

* **Frontend Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **AI Orchestration:** [Vercel AI SDK](https://sdk.vercel.ai/) & [Mistral AI](https://mistral.ai/) (`mistral-large-latest`)
* **Database Driver:** [LibSQL Client](https://github.com/tursodatabase/libsql-client-ts) (Turso Database connection)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Runtime / Package Manager:** [Bun](https://bun.sh/) (or Node.js/npm)

---

## 📂 Project Structure

Here are the main components of the repository:

* 🗄 **Database Schema & Connection:**
  * src/db/schema.ts – Defines the `products` and `sales` tables.
  * src/lib/db.ts – Establishes the Turso/LibSQL database connection.
  * drizzle.config.ts – Configuration for schema migrations and Drizzle Studio.
* 🤖 **AI Chat Agent API:**
  * src/app/api/chat/route.ts – Sets up the streaming chat endpoint and provides the `db` and `schema` tools to Mistral.
* 💻 **User Interface Components:**
  * src/app/page.tsx – Main chat view layout and scroll management.
  * src/components/message-bubble.tsx – Handles rendering of AI messages, text bubbles, and tool outputs.
  * src/components/db-query-block.tsx – Displays the query text and formats results as tables.
  * src/components/schema-block.tsx – Shows the SQL schema retrieval tool state.
* ⚙️ **Utility & Seeding Scripts:**
  * src/scripts/db.seed.ts – Script to populate the database with realistic sample products and sales data.

---

## 🗄 Database Schema

The agent operates on two tables:

### 1. `products`
| Column Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto Increment | Unique product identifier |
| `name` | `TEXT` | Not Null | Product name (e.g. Laptop, Mouse) |
| `category` | `TEXT` | Not Null | Product category (e.g. Electronics, Furniture) |
| `price` | `REAL` | Not Null | Cost per item |
| `stock` | `INTEGER` | Not Null, Default `0` | Number of items available |
| `created_at`| `TEXT` | Default `CURRENT_TIMESTAMP` | Date of product entry |

### 2. `sales`
| Column Name | Data Type | Key / Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto Increment | Unique transaction identifier |
| `product_id`| `INTEGER` | Foreign Key -> `products.id` | ID of the purchased product |
| `quantity`  | `INTEGER` | Not Null | Quantity purchased |
| `total_amount`| `REAL` | Not Null | Total transaction amount (`price * quantity`) |
| `sale_date` | `TEXT` | Default `CURRENT_TIMESTAMP` | Date of transaction |
| `customer_name`| `TEXT` | Not Null | Buyer's name |
| `region`    | `TEXT` | Not Null | Sale geographical region (North, South, East, West) |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
Clone the repository and install packages:
```bash
bun install
# or
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and configure the following variables:
```env
MISTRAL_API_KEY="your-mistral-api-key"
TURSO_DATABASE_URL="libsql://your-database-slug.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

### 4. Database Setup & Migrations
Initialize your database schemas:
```bash
# Generate migrations from drizzle schema
bun run db:generate

# Apply migrations to the Turso database
bun run db:migrate
```

### 5. Seed Database
Insert demo product and sales data:
```bash
bun run src/scripts/db.seed.ts
# or
npx tsx src/scripts/db.seed.ts
```

---

## 🏃 Running the Application

Start the local development server:
```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the SQL Agent.

### Additional Commands
* **Drizzle Studio:** Run `bun run db:studio` to visually inspect database entries.
* **Production Build:** Run `bun run build` followed by `bun run start` to build and launch in production mode.
