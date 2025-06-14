# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Starter Kit (RSK) - A full-stack SaaS application built with React Router v7, featuring inventory management, sales tracking, and subscription services. The application uses Convex for real-time database, Clerk for authentication, and Polar.sh for billing.

## Standard Workflow

1. First, think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Common Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Start Convex development (run in separate terminal)
npx convex dev
```

## High-Level Architecture

### Tech Stack
- **Frontend Framework**: React Router v7 (full-stack with SSR)
- **Styling**: TailwindCSS v4 + shadcn/ui components
- **Database**: Convex (real-time, serverless)
- **Authentication**: Clerk
- **Payments**: Polar.sh subscriptions
- **AI Integration**: OpenAI chat functionality
- **Deployment**: Vercel-optimized

### Project Structure

```
app/
├── routes/              # React Router routes (file-based routing)
│   ├── _index.tsx      # Homepage
│   ├── dashboard/      # Protected dashboard routes
│   └── *.tsx          # Other routes (sign-in, pricing, etc.)
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui base components
│   ├── homepage/      # Homepage sections
│   ├── dashboard/     # Dashboard-specific components
│   └── upload/        # CSV upload components
└── lib/               # Utilities (cn() for className merging)

convex/                # Backend functions
├── schema.ts         # Database schema definitions
├── http.ts          # HTTP endpoints (webhooks, chat API)
├── *.ts             # Database query/mutation functions
└── utils/           # Backend utilities
```

### Key Architectural Patterns

1. **Route Protection**: Dashboard routes check authentication via Clerk loaders
2. **Data Loading**: React Router loaders fetch data server-side before rendering
3. **Real-time Updates**: Convex hooks (`useQuery`, `useMutation`) for reactive data
4. **File Uploads**: CSV processing for inventory and ticket data through upload components
5. **Subscription Gating**: Routes check subscription status via Convex queries

### Database Schema (Convex)

Main tables:
- `users`: User profiles linked to Clerk IDs
- `subscriptions`: Polar.sh subscription data
- `inventory_uploads`, `inventory_lines`: Merchandise inventory
- `ticket_history`, `return_tickets`, `gift_card_tickets`: Sales tracking
- `vendors`, `brands`, `sales_reps`: Reference data

### Environment Variables Required

```bash
# Convex
CONVEX_DEPLOYMENT=
VITE_CONVEX_URL=

# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Polar.sh
POLAR_ACCESS_TOKEN=
POLAR_ORGANIZATION_ID=
POLAR_WEBHOOK_SECRET=

# OpenAI (for chat)
OPENAI_API_KEY=

# App URL
FRONTEND_URL=http://localhost:5173
```

### Important Implementation Details

1. **Path Aliases**: Use `~/` for imports from the app directory
2. **TypeScript**: Strict mode enabled, always maintain type safety
3. **Component Patterns**: Follow existing shadcn/ui patterns when creating new components
4. **Convex Functions**: Place database operations in convex/ directory, use proper schema types
5. **Route Data**: Use loaders for data fetching, actions for mutations
6. **Authentication Flow**: Clerk handles auth, sync users to Convex on first sign-in

### Development Workflow

1. Always run `npx convex dev` in a separate terminal for backend development
2. Use `npm run dev` for the frontend development server
3. Check types with `npm run typecheck` before committing
4. Test subscription flows using Polar.sh test mode
5. Use React Router's loader/action patterns for data operations