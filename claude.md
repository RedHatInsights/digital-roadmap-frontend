# Digital Roadmap Frontend

## Project Overview

The Digital Roadmap is a React-based web application that provides tailored forward-looking roadmap information to RHEL (Red Hat Enterprise Linux) customers. It helps customers understand the impact of upgrading systems (both minor and major releases) and plan for future RHEL releases.

**Key Features:**
- Lifecycle management visualization for RHEL systems and applications
- Upcoming changes and release planning
- Release notes and impact analysis
- System-specific recommendations based on customer environment

**Tech Stack:**
- React 18 with TypeScript
- Redux for state management
- PatternFly React components for UI
- React Router for routing
- Webpack with federated modules
- Jest for testing

## Project Structure

```
src/
├── Components/          # React components
│   ├── Lifecycle/      # Lifecycle management components
│   ├── LifecycleChart/ # Chart visualization
│   ├── UpcomingTable/  # Upcoming changes table
│   └── Released/       # Released versions view
├── Routes/             # Page-level route components
│   ├── LifecyclePage/  # Lifecycle management page
│   ├── UpcomingPage/   # Upcoming changes page
│   └── NoPermissionsPage/
├── store/              # Redux store configuration
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── api.ts              # API client and service calls
├── constants.ts        # Application constants
└── Routing.tsx         # Route definitions
```

## Development Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 7.0.0
- podman or docker (for chrome-service-backend)

### Getting Started

1. **Add hosts entries** (one-time setup):
   ```bash
   npm run patch:hosts
   # Or manually add to /etc/hosts:
   # 127.0.0.1 prod.foo.redhat.com stage.foo.redhat.com qa.foo.redhat.com ci.foo.redhat.com
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run start
   # Select environment when prompted (e.g., stage)
   # Access at: https://stage.foo.redhat.com:1337/insights/planning/roadmap
   ```

### Available Scripts

- `npm run start` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run lint:js:fix` - Auto-fix linting issues
- `npm run verify` - Run build, lint, and test
- `npm run deploy` - Build, lint, and test in sequence

## API Integration

The application communicates with the Digital Roadmap backend API defined in [src/api.ts](src/api.ts). Key endpoints:

- **Lifecycle data**: Application streams and system lifecycle information
- **Upcoming changes**: Future RHEL releases and impacts
- **Release notes**: Version-specific release documentation
- **System inventory**: Integration with Red Hat Insights inventory

API endpoints are configured in [src/constants.ts](src/constants.ts).

## Key Components

### Lifecycle Management
- **LifecyclePage** ([src/Routes/LifecyclePage/LifecyclePage.tsx](src/Routes/LifecyclePage/LifecyclePage.tsx)) - Main lifecycle view
- **Lifecycle** ([src/Components/Lifecycle/Lifecycle.tsx](src/Components/Lifecycle/Lifecycle.tsx)) - Lifecycle component with filtering
- **LifecycleChart** ([src/Components/LifecycleChart/LifecycleChart.tsx](src/Components/LifecycleChart/LifecycleChart.tsx)) - Chart visualization
- **LifecycleChartSystem** ([src/Components/LifecycleChartSystem/LifecycleChartSystem.tsx](src/Components/LifecycleChartSystem/LifecycleChartSystem.tsx)) - System-level chart

### Upcoming Changes
- **UpcomingPage** ([src/Routes/UpcomingPage/UpcomingPage.tsx](src/Routes/UpcomingPage/UpcomingPage.tsx)) - Upcoming changes view
- **UpcomingTable** ([src/Components/UpcomingTable/UpcomingTable.tsx](src/Components/UpcomingTable/UpcomingTable.tsx)) - Table of upcoming releases
- **Upcoming** ([src/Components/Upcoming/Upcoming.tsx](src/Components/Upcoming/Upcoming.tsx)) - Upcoming changes component

## State Management

Redux store is configured in [src/store/index.ts](src/store/index.ts) using:
- `getRegistry` from @redhat-cloud-services/frontend-components for dynamic reducer registration
- `redux-promise-middleware` for async actions
- `@redhat-cloud-services/frontend-components-notifications/redux` for notifications

## Testing

- Test files use `.test.tsx` or `.test.ts` extension
- Tests use React Testing Library and Jest
- Run tests with: `npm run test`
- Tests run in UTC timezone for consistency

## Architecture Notes

- **Federated Modules**: Uses Webpack Module Federation to load as part of the Red Hat Insights platform
- **Chrome Integration**: Loaded via Insights Chrome which provides auth, navigation, and chroming
- **PatternFly**: Uses PatternFly React components for consistent Red Hat UI/UX
- **Routing**: Uses HTML5 history API via react-router-dom BrowserRouter
- **Code Splitting**: Uses React.lazy and Suspense for async component loading

## Type Definitions

Key types are defined in [src/types/](src/types/):
- `AppLifecycleChanges.ts` - Application lifecycle data
- `SystemLifecycleChanges.ts` - System lifecycle data
- `UpcomingChanges.ts` - Upcoming release data
- `Filter.ts` - Filter configurations
- `Stream.ts` - RHEL stream data

## Common Development Tasks

### Adding a New Component
1. Create component in `src/Components/ComponentName/`
2. Add TypeScript types
3. Create `.test.tsx` for unit tests
4. Export from component directory

### Adding a New Route
1. Create route component in `src/Routes/RouteName/`
2. Add route definition in [src/Routing.tsx](src/Routing.tsx)
3. Update navigation if needed

### Making API Changes
1. Update endpoint constants in [src/constants.ts](src/constants.ts)
2. Add/update API functions in [src/api.ts](src/api.ts)
3. Update TypeScript types in `src/types/`

## CI/CD

- Uses GitHub Actions for CI
- Code coverage tracked via Codecov
- Konflux for deployment pipeline

## Additional Resources

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development setup and contribution guidelines
- [README.md](README.md) - Project overview
