# GitScope - GitHub Analytics Dashboard

GitScope is a premium GitHub analytics and repository insights dashboard built using SvelteKit, TypeScript, TailwindCSS, Drizzle ORM, PostgreSQL, and Better Auth.

## Getting Started

### 1. Installation

Install the project dependencies using `pnpm`:

```sh
pnpm install
```

### 2. Run PostgreSQL Database

Start the local PostgreSQL container using Docker Compose:

```sh
pnpm run db:start
# or run in the background:
docker compose up -d
```

This runs a local PostgreSQL instance on port `5432` with username `root` and password `mysecretpassword`, initialized with a database named `local`.

### 3. Environment Setup

Copy the example environment file and configure your credentials:

```sh
cp .env.example .env
```

Ensure the following variables are configured in `.env`:

```env
DATABASE_URL="postgres://root:mysecretpassword@localhost:5432/local"
BETTER_AUTH_SECRET="3d0f1067-f02f-4272-a663-00779aff3768"
BETTER_AUTH_URL="http://localhost:5173"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
```

### 4. GitHub OAuth Configuration

To enable GitHub Authentication, you must register an OAuth application on GitHub:

1. Go to your GitHub profile -> **Settings** -> **Developer settings** -> **OAuth Apps** -> **New OAuth App**.
2. Set the following details:
   - **Application name**: GitScope
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/api/auth/callback/github`
3. Click **Register application**.
4. Generate a new **Client Secret**.
5. Copy the **Client ID** and **Client Secret** into your `.env` file as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

### 5. Generate & Run Database Migrations

Push the database schemas containing all repository and Better Auth tables to PostgreSQL:

```sh
pnpm run db:push
```

### 6. Start Development Server

Launch the local Vite development server:

```sh
pnpm run dev
```

Navigate to [http://localhost:5173](http://localhost:5173) to view the public landing page, log in via GitHub OAuth, and access the protected dashboard.

---

## Technical Implementations

### 1. Expanded Repository Synchronization
GitScope synchronizes granular details for every repository tracked in your database. During synchronization:
- **Repository List**: Fetches all user repositories recursively, resolving pagination.
- **Languages**: Stores the breakdown of languages (in bytes) fetched from `/repos/{owner}/{repo}/languages`.
- **Branches**: Lists all branches, identifies branch protection statuses, default branch marks, and references the latest commit SHA.
- **Commits**: Stores the latest 100 commits (SHA, author, avatar, message, commit date, branch) from the default branch.
- **Contributors**: Indexes contributors and stores their username, avatar, contributions counts, and profile links.
- **Releases**: Stores releases detailing names, tag names, published dates, draft/prerelease flags, and release notes markdown body.
- **Topics**: Synchronizes repository topic badges to support advanced searching.
- **README**: Caches raw markdown readmes from `/repos/{owner}/{repo}/readme` using custom media header `application/vnd.github.raw`. This markdown is rendered into safe HTML on the SvelteKit server using `marked` and styled via premium custom global stylesheets supporting Dark Mode.

### 2. GitHub GraphQL API Integration
Instead of fetching daily commits across hundreds of repositories which would trigger rate limit locks, GitScope utilizes the **GitHub GraphQL API** to fetch the authenticated user's daily contribution calendar in a single request:
```graphql
query($username: String!, $from: DateTime!, $to: DateTime!) {
	user(login: $username) {
		contributionsCollection(from: $from, to: $to) {
			contributionCalendar {
				totalContributions
				weeks {
					contributionDays {
						contributionCount
						date
					}
				}
			}
		}
	}
}
```
This payload is parsed and synced to the `user_contributions` table to power calendars and streaks.

### 3. Contribution Heatmap Calendar
The contribution calendar is rendered using Svelte's reactive states:
- Days are fetched for the last 365 days.
- Padded at the start based on the day of the week of the start date (e.g. padding Sunday/Monday empty boxes if the start date is a Tuesday) to align all dates into weekly rows.
- Chunked into columns of 7 days representing 53 weeks.
- Rendered using CSS Grid (`grid-rows-7`) with premium colored squares reflecting commit densities.
- Provides native localized date-specific hover tooltips.

### 4. Streak Calculation Engine
Our DB service calculates contribution streaks chronologically:
- **Total Contributions**: The sum of contribution counts across the last 365 days.
- **Contribution Days**: Count of all individual calendar days where the count is greater than 0.
- **Longest Streak**: The maximum consecutive days in the dataset with contributions > 0. If a day has 0 contributions, the current running streak resets, and the maximum streak index updates.
- **Current Streak**: Evaluates the consecutive contribution days trailing backward. The streak is marked as active if the user has recorded a contribution either **today** or **yesterday** (accounting for local timezone date drift). If the last contribution is older than yesterday, the current streak is reset to 0.

### 5. Repository Search
Repository search is optimized on the database layer. When searching, GitScope runs a left-join query using `exists` clauses to scan:
- Repository names
- Associated language names
- Contributor usernames
- Repository topics/tags
This ensures search results match various indices without returning duplicate rows in the SQL response.

### 6. Interactive Analytics Dashboard
The analytics page renders statistics using **ECharts**:
- **Commits per Month**: Line bar chart displaying development volume trends.
- **Repository Growth**: Cumulative line chart showing codebase counts over time.
- **Language Distribution**: Doughnut charts displaying primary language representation.
- **Weekly Activity Density**: Area line chart indicating weekdays commit velocity.
- **Top Repository Sizes**: Horizontal bar chart comparing repository size weight.
- **Stars & Forks Matrix**: Scatter bubble chart indicating repository community engagement.
