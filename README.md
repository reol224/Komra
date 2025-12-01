# Komra

A comprehensive security auditing platform that provides real-time vulnerability assessment and endpoint monitoring for distributed infrastructure.

## Features

- **Cross-Platform System Data Collection** - Automated agents for Windows, Linux, and macOS
- **Real-Time Vulnerability Assessment** - Continuous CVE monitoring with CVSS scoring
- **Comprehensive Endpoint Inventory** - Complete visibility into monitored systems
- **Intelligent Triage Interface** - Priority-based vulnerability management
- **Advanced Search & Investigation** - Unified search across audit logs and vulnerabilities
- **Risk Assessment & Reporting** - Visual dashboards and exportable security reports

## Prerequisites

- Node.js 18.x or higher
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

### Run All Tests

```bash
npm run test:all
```

### Test Structure

- `tests/integration/` - Integration tests for components with database
- `tests/e2e/` - End-to-end tests with Playwright
- `tests/utils/` - Test utilities and helpers

## Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow security best practices for authentication and authorization
- Report security vulnerabilities responsibly

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth

## Documentation

- [System Data Collection Guide](./docs/SYSTEM_DATA_COLLECTION.md)
- [API Documentation](#) (Coming soon)
- [Deployment Guide](#) (Coming soon)

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

## License

[Add your license information here]