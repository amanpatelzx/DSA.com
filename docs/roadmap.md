# Development Roadmap

## Phase 1: Foundation
- Project setup (React/Vite, Node/Express).
- Database connection (MongoDB).
- Basic Authentication (signup, login, JWT/Sessions).
- Shared UI components.

## Phase 2: User System
- Public player profiles.
- Rating data structure.
- External profile linking (LeetCode, Codeforces).
- Basic search functionality.

## Phase 3: Problem System
- Problem models and schema.
- Admin problem creation and management.
- Tags integration.
- Problem versioning logic.

## Phase 4: Training Ground
- Problem list with filtering and search.
- Monaco Editor integration.
- Execution abstraction (basic Judge setup).
- Code submission and status tracking.

## Phase 5: Game Configuration
- Define game modes (Bullet, Blitz, Rapid, Classical).
- Admin configuration for time controls and scoring.
- Database seeding for default modes.

## Phase 6: Battle Engine
- Real-time architecture setup (Socket.IO).
- Battle creation flow.
- Real-time timer and state synchronization.
- Score calculation and winner determination.

## Phase 7: Random Selection
- ProblemSelectionService implementation.
- Filtering by difficulty and points.
- Repetition avoidance logic.

## Phase 8: Ratings
- Elo calculation system.
- Rating history and transaction logging.
- Leaderboard generation.

## Phase 9: Social
- Friend request system.
- Online status and presence tracking.
- Direct challenges and notifications.

## Phase 10: Fair Play
- Telemetry gathering.
- Moderation tools and reporting.
- Ban system and rating rollbacks.

## Phase 11: Admin Panel
- Comprehensive dashboards for users, problems, battles, etc.
- Settings management.

## Phase 12: Testing
- Unit and integration testing across core services.
- E2E testing for the critical battle loop.

## Phase 13: Polish
- Final UI/UX refinement.
- Responsive design improvements.
- Performance profiling and accessibility review.
- Final deployment preparation.
