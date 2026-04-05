<p align="center">
  <img src="public/logo.png" alt="Ares Command" width="120" />
</p>

<h1 align="center">Ares Command</h1>

<p align="center">
  <strong>Executive Agent Management Platform for OpenClaw</strong><br/>
  <em>Built by <a href="https://github.com/Toksey">Toksey</a> · Powered by <a href="https://github.com/TheRoboticsClub/openclaw">OpenClaw</a></em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## What Is Ares Command?

Ares Command is a **premium, executive-grade web dashboard** for managing autonomous AI agent teams built on the [OpenClaw](https://github.com/TheRoboticsClub/openclaw) platform. It transforms raw agent configuration files into an interactive, high-density operations center.

Think of it as the **mission control panel** for your AI workforce — a single pane of glass to monitor, configure, task, and coordinate multiple AI agents working on your projects.

### Key Features

| Feature | Description |
|---|---|
| **📊 Executive Dashboard** | Bento-box KPI layout with telemetry charts, expandable data modules, and real-time agent activity feeds |
| **👥 Team Roster & CRUD** | Full agent lifecycle management — create, edit, configure, and delete agents with inline editing and model assignment |
| **📋 Task Board** | Kanban-style board (Backlog → In Progress → Review → Done) with drag-and-drop, file attachments, and proactive agent-driven task management |
| **🧠 Tabbed Agent Workspaces** | Multi-tab drawer (Overview, Identity, Persona, Rules, Heartbeat) for editing agent Markdown configuration files directly in the browser |
| **✨ AI Markdown Wizard** | AI-assisted generation of agent instruction files (IDENTITY.md, PERSONA.md, RULES.md) |
| **📐 G-STACK Template Gallery** | Pre-built agent archetypes (Chief of Staff, Eng Manager, QA Lead, Designer, DevOps, Critic) for rapid team construction |
| **📅 5-Day Calendar** | Rolling work-week calendar view for scheduling and tracking |
| **🏢 Company Switcher** | Multi-tenant support with Conservative/Maximizer operational modes |
| **🎨 Triple Theme Engine** | Dark, Light, and Espresso themes with full CSS variable theming |
| **🔄 Proactive Management** | Built-in hourly cron-driven task synchronization via the Chief of Staff agent |

---

## Screenshots

> Run the app locally to see the full executive dashboard and agent management interface.

---

## Prerequisites

- **Node.js** ≥ 20.x  
- **npm** ≥ 10.x  
- **OpenClaw** installed and configured at `~/.openclaw` (the platform reads from `openclaw.json`)

---

## Installation

> [!WARNING]
> We strongly recommend installing Ares Command via **Git Clone**. While `npm install -g` is supported in theory, modern versions of `npm` (10.x+) have known race-condition bugs on MacOS/Linux when attempting to extract heavily nested dependencies (like Redux Toolkit) directly from GitHub URLs. Cloning ensures a stable installation and gives Next.js the local permissions it needs to compile effectively.

### Stable Install (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Toksey/MissionC-C.git ares-command
cd ares-command

# 2. Install dependencies locally
npm install

# 3. Copy environment config
cp .env.example .env.local

# 4. Start the dashboard
npm run dev
```

Open **http://localhost:34000** in your browser.

### Global CLI Install (Not Recommended)

If you have a customized system setup and want to attempt a global install, you can run:

```bash
npm install -g https://github.com/Toksey/MissionC-C.git
ares-command
```

---

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Auto-detected from ~/.openclaw by default. Override if installed elsewhere.
# OPENCLAW_HOME=/Users/username/.openclaw

NEXT_PUBLIC_BASE_URL=http://localhost:34000
```

### OpenClaw Integration

Ares Command reads directly from your OpenClaw installation:

```
~/.openclaw/
├── openclaw.json          # Agent definitions, model configs, defaults
├── workspace/
│   ├── SOUL.md            # Global agent instructions
│   ├── IDENTITY.md        # Global identity file
│   ├── PERSONA.md         # Global persona file
│   ├── RULES.md           # Global rules file
│   └── skills/            # Installed skills
├── agents/
│   └── <agent-id>/
│       ├── workspace/     # Per-agent overrides (forked on save)
│       └── sessions/      # Conversation history
├── tasks/
│   └── tasks.json         # Kanban board state
└── logs/
    └── openclaw.log       # System logs
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Executive Dashboard (Bento layout)
│   ├── team/page.tsx            # Agent Roster & Tabbed Workspace
│   ├── tasks/page.tsx           # Kanban Task Board
│   ├── calendar/page.tsx        # 5-Day Rolling Calendar
│   ├── chat/page.tsx            # Agent Chat Interface
│   ├── memories/page.tsx        # Memory/Knowledge Base Browser
│   ├── documents/page.tsx       # Document Management
│   ├── settings/page.tsx        # Platform Settings & Credits
│   ├── models/page.tsx          # Model Configuration
│   ├── forge/page.tsx           # The Forge (Experimental)
│   ├── skills/page.tsx          # Skills Browser
│   ├── office/page.tsx          # Virtual Office
│   └── api/
│       ├── agents/              # GET, PATCH agent metadata
│       │   ├── create/          # POST new agent
│       │   ├── files/           # GET/PUT agent markdown files
│       │   ├── soul/            # GET SOUL.md content
│       │   └── sessions/        # GET agent sessions
│       ├── tasks/               # CRUD + attachments
│       ├── documents/generate/  # AI Markdown Wizard
│       ├── cron/                # Proactive task management
│       └── ...
├── components/
│   ├── sidebar.tsx              # Accordion navigation
│   ├── ThemeProvider.tsx         # Theme engine (dark/light/espresso)
│   ├── dashboard-charts.tsx     # Recharts telemetry
│   └── status-card.tsx          # Reusable KPI cards
└── lib/
    ├── data-sources.ts          # File I/O utilities (read/write JSON, MD)
    ├── openclaw-paths.ts        # Path resolution for OpenClaw dirs
    ├── types.ts                 # TypeScript interfaces
    └── parsers.ts               # Utility formatters
```

---

## Sidebar Navigation

The sidebar uses accordion-style grouped navigation:

| Section | Routes |
|---|---|
| 🏠 **Home** | Dashboard |
| 👥 **People** | Team, Chat |
| 📋 **Work** | Task Board, Calendar, Playbooks, Office |
| 🧠 **Intelligence** | Memories, Documents, The Forge, Skills |
| ⚙️ **Infrastructure** | Models, Protocols, Channels, Plugins |
| 🔧 **Settings** | Settings, Setup |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | React 19, Lucide Icons, Vanilla CSS with CSS Variables |
| Charts | [Recharts](https://recharts.org) |
| 3D | Three.js + React Three Fiber (Office page) |
| Language | TypeScript 5 |
| Runtime | Node.js 20+ |

---

## Development

```bash
# Start dev server with hot reload
npm run dev

# Lint the codebase
npm run lint

# Type-check
npx tsc --noEmit

# Build for production
npm run build
```

---

## Credits

- **Platform**: [OpenClaw](https://github.com/TheRoboticsClub/openclaw) by OpenBrain (Nate B. Jones)
- **Dashboard**: Ares Command by [Toksey](https://github.com/Toksey)
- **Inspiration**: Paperclip, G-STACK methodology

---

## License

MIT © [Toksey](https://github.com/Toksey)
