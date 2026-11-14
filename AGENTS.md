# AGENTS.md - Purcari Israel Monorepo

## Project Overview

This is a **pnpm monorepo** for Purcari Israel - a premium Hebrew wine ecommerce platform. The project consists of:

- **@apps/storefront** - Customer-facing React + Vite + Tailwind CSS storefront
- **@apps/admin** - Admin dashboard using React + Vite + Chakra UI v3
- **@shared/types** - Shared TypeScript types used across apps
- **convex/** - Convex backend (serverless functions, auth, database)

---

## Dev Environment Tips

### Package Management
- Use **pnpm** (not npm or yarn) for all operations
- Workspace packages are defined in `pnpm-workspace.yaml`
- Reference workspace packages with `workspace:*` (e.g., `"@shared/types": "workspace:*"`)

### Running Development Servers
```bash
# Run all apps in parallel
pnpm dev

# Run specific app
pnpm dev:storefront   # storefront: http://localhost:5183
pnpm dev:admin       # admin: http://localhost:5181
```

### Convex Development
```bash
# Start Convex dev server (required for local development)
npx convex dev

# Deploy to Convex cloud
npx convex deploy

# Run Convex functions locally
npx convex run <functionName> --args '{}'
```

### Adding Dependencies
```bash
# Add to specific app
pnpm --filter @apps/storefront add <package>
pnpm --filter @apps/admin add <package>

# Add to shared-types
pnpm --filter @shared/types add <package>

# Add root dev dependency
pnpm add -Dw <package>
```

---

## Building & Type Checking

### Build Commands
```bash
# Build all apps
pnpm build

# Build specific app
pnpm build:storefront
pnpm build:admin
```

### Type Checking
```bash
# Type-check all packages
pnpm type-check

# Type-check specific app
pnpm --filter @apps/storefront type-check
pnpm --filter @apps/admin type-check
```

---

## Project Structure

```
purcari-israel/
├── apps/
│   ├── storefront/       # Customer React app (Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── store/       # Redux Toolkit
│   │   │   └── services/    # RTK Query APIs
│   │   └── vite.config.ts
│   │
│   └── admin/           # Admin dashboard (Vite + Chakra UI v3)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   └── hooks/       # Convex hooks
│       └── vite.config.ts
│
├── packages/
│   └── shared-types/    # Shared TypeScript types
│       └── src/index.ts
│
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── auth.ts          # Authentication
│   └── *.ts             # API functions
│
└── package.json         # Root workspace config
```

---

## Key Technologies

| App | Framework | UI Library | State | Backend |
|-----|-----------|-------------|-------|---------|
| storefront | React 18 + Vite 6 | Tailwind CSS 4 | Redux Toolkit | Convex |
| admin | React 18 + Vite 6 | Chakra UI v3 | Convex hooks | Convex |
| shared-types | - | - | - | - |

---

## Convex Backend

### Schema & Types
- Database schema defined in `convex/schema.ts`
- Auto-generated types in `convex/_generated/`
- Use generated types for type-safe queries

### Authentication
- Uses `@convex-dev/auth` with configuration in `convex/auth.ts`
- Admin role protection via `auth.config.ts`

### Data Access
- Use `useQuery` and `useMutation` hooks (not manual `useEffect`)
- All queries/mutations are defined in `convex/*.ts` files

---

## Coding Conventions

### TypeScript
- Use strict typing - avoid `any`
- Shared types go in `packages/shared-types/src/index.ts`
- Import from `@shared/types` in apps

### Component Patterns
- **Storefront**: React.FC with explicit props interface
- **Admin**: Follow Chakra UI v3 patterns (functional components, system props)

### File Naming
- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `useProducts.ts`)
- Utils: `camelCase.ts` (e.g., `formatPrice.ts`)

### RTL & Hebrew (Storefront)
- Use logical CSS properties: `start-*`/`end-*` instead of `left-*`/`right-*`
- Use `ms-*`/`me-*` for margins, `ps-*`/`pe-*` for padding
- All user-facing text in Hebrew
- Product fields: `productNameHe` for Hebrew display name

### Admin Specific
- All routes wrapped in `ProtectedRoute` with admin role check
- Use Chakra UI v3 syntax (not v2)
- Default to RTL layout

---

## Environment Variables

Create `.env.local` from `.env.example`:

```env
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_URL=https://your-convex-deployment.convex.cloud
VITE_GEMINI_API_KEY=
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_COUPON_SYSTEM=true
VITE_ENABLE_AGE_VERIFICATION=true
```

---

## Common Tasks

### Adding a New Page (Storefront)
1. Create component in `apps/storefront/src/pages/`
2. Add route in `App.tsx`
3. Add nav link in `Header.tsx`

### Adding a Page (Admin)
1. Create component in `apps/admin/src/pages/`
2. Add route with `ProtectedRoute` wrapper
3. Ensure admin role check

### Adding Convex Function
1. Add query/mutation in appropriate `convex/*.ts` file
2. Run `npx convex dev` to generate types
3. Use `useQuery`/`useMutation` in components

### Adding to Shared Types
1. Add type to `packages/shared-types/src/index.ts`
2. Export the type
3. Apps auto-import via workspace resolution

---

## Pre-commit Checklist

Before committing:
- [ ] Run `pnpm type-check` - no TypeScript errors
- [ ] Test Convex functions work locally
- [ ] Verify both apps build successfully: `pnpm build`
- [ ] Check Hebrew text renders correctly in storefront
- [ ] Ensure admin routes are protected

---

## PR Instructions

- Title format: `[storefront|admin|convex] <description>`
- Describe changes in English
- Include screenshots for UI changes
- Link related issues
