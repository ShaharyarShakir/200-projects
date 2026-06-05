# 🚀 200 Projects Sandbox

A comprehensive workspace hosting a diverse collection of projects spanning frontend, backend, fullstack, mobile, microservices, and AI. This repository is built as a playground to learn, test, and master various modern web technologies, programming languages, and architectures.

---

## 🛠️ Tech Stack & Tooling

The environment in this workspace is managed using modern package managers and runtime environments for seamless cross-platform setup:

*   **Environment & Package Managers**: 
    *   [Devbox](https://www.jetify.com/devbox) - Instant, isolated developer shells using Nix.
    *   [Mise](https://mise.jdx.dev/) - Polyglot tool manager to manage runtime versions.
    *   [fnm](https://github.com/Schniz/fnm) - Fast Node Manager.
*   **Runtimes & SDKs**:
    *   [Bun](https://bun.sh/) - High-performance JavaScript/TypeScript bundler, runner, and package manager.
    *   [Go](https://go.dev/) - High-performance compiled backend development language.
    *   [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver.
*   **Frameworks & Libraries**:
    *   **Frontend**: Vanilla JS, React, Tailwind CSS, Next.js
    *   **Backend**: Node.js, Express, NestJS, FastAPI, Go
    *   **Mobile**: React Native / Expo
    *   **AI**: TensorFlow.js / MediaPipe

---

## 📂 Project Categories Overview

The repository is organized into distinct directories based on architecture, framework, and domains:

| Category | Directory Path | Projects Count | Focus Area |
| :--- | :--- | :--- | :--- |
| **Vanilla JS** | [`01_Vanilla-JS`](./01_Vanilla-JS) | 15 Projects | Core JS DOM manipulation, API integrations, and classic browser games |
| **Tailwind CSS** | [`02__tailwindcss`](./02__tailwindcss) | 2 Projects | Utility-first CSS layout designs, responsive UI clones |
| **Microservices** | [`03__microservices`](./03__microservices) | 3 Projects | Service-oriented architecture, school/pet management & social media |
| **Mobile App** | [`04__mobile`](./04__mobile) | 1 Project (Monorepo) | Mobile development with React Native, Expo, and dedicated server API |
| **Backend** | [`05__backend`](./05__backend) | 1 Project | Pure backend APIs, databases, and high-performance server logic |
| **Full Stack** | [`06__full-stack`](./06__full-stack) | 13 Projects | Complete web apps with database integration, user systems, and containers |
| **AI** | [`07__ai`](./07__ai) | 1 Project | Computer vision, AI modeling, and interactive browser features |

---

## 📝 Project Directory & Breakdown

### 1. Vanilla JavaScript ([`01_Vanilla-JS`](./01_Vanilla-JS))
A suite of projects showcasing raw JavaScript DOM operations, event handling, local storage persistence, and audio/canvas features without external frameworks.

| Project Name | Path | Description |
| :--- | :--- | :--- |
| **01 Slot Machine** | [`01__Slot-Machine`](./01_Vanilla-JS/01__Slot-Machine) | Dynamic casino slot-machine logic and spin UI. |
| **02 Accordion** | [`02__Accordion`](./01_Vanilla-JS/02__Accordion) | Classic accordion UI component with collapsible content. |
| **03 Amazon Clone** | [`03__Amazon-clone`](./01_Vanilla-JS/03__Amazon-clone) | Interactive frontend replica of Amazon store sections. |
| **04 Netflix Clone** | [`04__Netflix`](./01_Vanilla-JS/04__Netflix) | High-fidelity Netflix landing page clone. |
| **05 Bootie Store** | [`05__Bootie`](./01_Vanilla-JS/05__Bootie) | E-commerce landing page layout for shoe merchandise. |
| **06 WordPress Utility** | [`06__wordpress`](./01_Vanilla-JS/06__wordpress) | Integration utilities or custom templates. |
| **07 Spotify Player** | [`07__spotify`](./01_Vanilla-JS/07__spotify) | Audio player with custom playback controls mimicking Spotify. |
| **08 Palindrome Checker** | [`08__palindorme-checker`](./01_Vanilla-JS/08__palindorme-checker) | Fast interactive string checker to detect palindromes. |
| **09 Counter** | [`09__counter`](./01_Vanilla-JS/09__counter) | Simple browser counter with reset, increment, and decrement actions. |
| **10 Todo List** | [`10__todo-list`](./01_Vanilla-JS/10__todo-list) | Task tracker featuring state persistence using local storage. |
| **11 Digital Clock** | [`11__digital-clock`](./01_Vanilla-JS/11__digital-clock) | Real-time digital clock rendering active system hours, minutes, and seconds. |
| **12 Quiz App** | [`12__quiz-app`](./01_Vanilla-JS/12__quiz-app) | Interactive quiz game featuring score updates and state preservation. |
| **13 Image Slider** | [`13__image-slider`](./01_Vanilla-JS/13__image-slider) | Responsive slideshow component with smooth transitions. |
| **14 Keyboard Event Tracker** | [`14__keybaord-event-tracker`](./01_Vanilla-JS/14__keybaord-event-tracker) | Tool demonstrating key code detection on window keyboard triggers. |
| **15 Pokemon Card** | [`15__pokemon-card`](./01_Vanilla-JS/15__pokemon-card) | Dynamic card drawer utilizing PokéAPI to pull stats and sprites. |

---

### 2. Tailwind CSS ([`02__tailwindcss`](./02__tailwindcss))
Layout designs focused on responsive typography, component building, and utility configurations.

| Project Name | Path | Description |
| :--- | :--- | :--- |
| **Beginner Tailwind CSS** | [`16__beginner-tailwind-css`](./02__tailwindcss/16__beginner-tailwind-css) | Sandboxed playground to practice grids, flexbox, and color scales. |
| **Twitter UI Clone** | [`17__twitter(tailwindcss)`](./02__tailwindcss/17__twitter(tailwindcss)) | Desktop layout replication of Twitter/X homepage interface. |

---

### 3. Microservices ([`03__microservices`](./03__microservices))
Architecture experiments exploring isolated API services communicating together.

| Project Name | Path | Description |
| :--- | :--- | :--- |
| **Social Media Service** | [`18__social_media`](./03__microservices/18__social_media) | Distributed user, feed, and post backend APIs. |
| **Pet Market** | [`19__pet-market`](./03__microservices/19__pet-market) | Microservices backend orchestrating transaction, search, and inventory modules. |
| **School Management** | [`20__school-management-system`](./03__microservices/20__school-management-system) | Management services handling students, grades, and registrations. |

---

### 4. Mobile ([`04__mobile`](./04__mobile))
Cross-platform React Native projects.

*   **[`sashory`](./04__mobile/sashory)**: A full-stack mobile platform containing:
    *   `apps/native`: Expo & React Native app client.
    *   `apps/server`: High-performance API server.
    *   Managed as a monorepo via Turborepo and Bun.

---

### 5. Backend ([`05__backend`](./05__backend))
Dedicated backend servers building high-performance endpoints.

*   **[`fastapi_blog`](./05__backend/fastapi_blog)**: A blog REST API built using Python's FastAPI framework and managed via `uv` package manager.

---

### 6. Full Stack ([`06__full-stack`](./06__full-stack))
Combined frontends and backends featuring containerization, headless databases, and real-time streaming:

| Project Name | Path | Description |
| :--- | :--- | :--- |
| **Docker Express React App** | [`01__docker-express-react-app`](./06__full-stack/01__docker-express-react-app) | Integrated React frontend and Express API running in Docker containers. |
| **Magic Movie Streaming Server** | [`MagicMovieStreamingServer`](./06__full-stack/MagicMovieStreamingServer) | Custom video distribution platform supporting video streams. |
| **Cloudflare Waitlist** | [`cloudflare-waitlist`](./06__full-stack/cloudflare-waitlist) | Serverless landing page waitlist utilizing Cloudflare Workers. |
| **Interview AI** | [`interview-ai`](./06__full-stack/interview-ai) | AI-driven dialogue simulator to help prepare for technical job interviews. |
| **Remote Blog** | [`remote_blog`](./06__full-stack/remote_blog) | Headless-CMS powered publishing engine. |
| **Retro Portfolio** | [`retro-portfolio`](./06__full-stack/retro-portfolio) | Portfolio site with an interactive terminal/console UI. |
| **Sainzamore** | [`sainzamore`](./06__full-stack/sainzamore) | Tailored e-commerce/business platform. |
| **Samma** | [`samma`](./06__full-stack/samma) | Interactive full-stack web application. |
| **Seddit** | [`seddit`](./06__full-stack/seddit) | Custom Reddit clone featuring boards, voting, and comment trees. |
| **Shakir Folio** | [`shakir-folio`](./06__full-stack/shakir-folio) | Personal developer showcase site. |
| **Smorte Blog** | [`smorte_blog`](./06__full-stack/smorte_blog) | Minimalist blogging app with user signups and articles. |
| **Student API** | [`student-api`](./06__full-stack/student-api) | API engine managing classroom records with visual client charts. |
| **Todo App** | [`todo_app`](./06__full-stack/todo_app) | Full-stack task management board. |

---

### 7. AI & Machine Learning ([`07__ai`](./07__ai))
Browser-based computer vision and neural net demos.

*   **[`facemesh`](./07__ai/facemesh)**: Real-time web camera face tracking and keypoint mapping using TensorFlow.js MediaPipe model.

---

## 🚀 Setting Up the Environment

This repository uses **Devbox** and **Mise** to coordinate dependency installation without polluting your host operating system.

### Prerequisites

1. Install **Nix** (required by Devbox):
   ```bash
   curl -L https://nixos.org/nix/install | sh
   ```
2. Install **Devbox**:
   ```bash
   curl -fsSL https://get.jetify.com/devbox | bash
   ```

### Quickstart

1. Clone this repository and navigate to the directory:
   ```bash
   git clone <repo-url>
   cd 200-projects
   ```
2. Spin up the Devbox shell. This automatically installs and provisions `fnm`, `mise`, `bun`, `go`, and `uv`:
   ```bash
   devbox shell
   ```
3. Boot dependencies and toolchain versions:
   ```bash
   devbox run test
   ```
   *This commands executes `mise install --yes` inside the Devbox shell environment.*
