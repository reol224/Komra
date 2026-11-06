# Komra

Komra is a Next.js security dashboard backed by Supabase. It includes role-specific
administration, analyst, and viewer interfaces; endpoint and package inventory;
audit and investigation views; and integrations for agent ingestion, billing,
email, and notifications.

Some security and operations features are still prototypes. See
[Current scope and limitations](#current-scope-and-limitations) before using
their results for production decisions.

## Features

- **Cross-Platform System Data Collection** - Automated agents for Windows, Linux, and macOS
- **Real-Time Vulnerability Assessment** - Continuous CVE monitoring with CVSS scoring
- **Comprehensive Endpoint Inventory** - Complete visibility into monitored systems
- **Intelligent Triage Interface** - Priority-based vulnerability management
- **Advanced Search & Investigation** - Unified search across audit logs and vulnerabilities
- **Risk Assessment & Reporting** - Visual dashboards and exportable security reports

## Prerequisites

- Node.js 22.x
- npm or pnpm
- Supabase account

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd komra
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SUPABASE_PROJECT_ID=your_project_id
```

### 4. Set Up Database

Run the Supabase migrations to create the required database schema:

```bash
# Ensure you have Supabase CLI installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint

## Project Structure

```bash
komra/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── dashboard/   # Dashboard components
│   │   └── ui/          # Reusable UI components (shadcn)
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries and services
│   └── types/           # TypeScript type definitions
├── supabase/
│   └── migrations/      # Database migrations
├── scripts/
│   └── komra-agent.js   # System data collection agent
└── public/              # Static assets
```

## Using the Komra Agent

The Komra agent collects system data for vulnerability assessment:

### Web-Based Collection

Navigate to the dashboard and use the built-in system data collector.

### Standalone Agent

Run the agent script directly:

```bash
node scripts/komra-agent.js
```

### Scheduled Collection

Set up a cron job (Linux/macOS) or Task Scheduler (Windows) to run the agent periodically.

## Role-Based Access

Komra supports three user roles:

- **Admin** - Full system access, user management, configuration
- **Analyst** - Vulnerability triage, investigation, reporting
- **Viewer** - Read-only access to dashboards and reports

## Development Guidelines

### Conventional Commits

All commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Code Quality

- Run linters before committing: `npm run lint`
- Ensure all TypeScript types are properly defined
- Write tests for new features
- Update documentation as needed

### Pull Requests

- Create a PR for all changes
- Request code review from team members
- Ensure CI/CD checks pass
- Address all review comments

## Testing

### Unit & Integration Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Install Playwright browsers (first time only)
npx playwright install
```

## Main dependencies

Versions below are resolved by the current `package-lock.json`; `npm ci` uses
those locked versions. Most dependencies in `package.json` use semver ranges,
while the Supabase SDK entries currently use `"latest"`, so use the lockfile
for reproducible installs.

| Package | Locked version |
| --- | --- |
| Next.js | 16.4.4 |
| React / React DOM | 18.3.1 |
| TypeScript | 5.9.2 |
| Tailwind CSS | 3.4.17 |
| Supabase JS | 2.57.4 |
| Supabase SSR | 0.7.0 |
| Stripe | 17.7.0 |
| Resend | 6.37.0 |
| Vitest | 4.1.11 |
| Playwright | 1.56.1 |

Other dependencies and declared version ranges are listed in
[package.json](./package.json).

## Repository layout

```text
src/
  app/                 Next.js pages and API routes
  components/          Auth, dashboard, setup, and shared UI
  contexts/            Authentication and notification contexts
  hooks/               Shared React hooks
  lib/                 Supabase and application services
  types/               TypeScript types
scripts/
  komra-agent.js       Standalone endpoint data collector
supabase/
  migrations/          Database migrations
tests/
  unit/                Unit tests
  integration/         Component and service integration tests
  e2e/                 Playwright browser tests
docs/                  Feature and testing notes
```

## Further reading

- [System data collection notes](./docs/SYSTEM_DATA_COLLECTION.md)
- [Email integration testing notes](./docs/EMAIL_TESTING.md)

No license file is currently included in the repository.
