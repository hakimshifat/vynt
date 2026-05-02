# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React TypeScript storefront/admin app. Application code lives in `src/`, with route screens in `src/pages/`, reusable UI in `src/components/`, shared contexts such as `src/CartContext.tsx`, and shared types/constants in `src/types.ts` and `src/constants.ts`. Static assets and markdown content live in `public/`, including `public/size-guide.md`. Supabase setup SQL lives in `supabase/schema.sql`. Build and deployment configuration is at the root in `vite.config.ts`, `tsconfig.json`, and `.github/workflows/deploy.yml`.

## Build, Test, and Development Commands

Use npm with the committed `package-lock.json`.

- `npm install`: install dependencies.
- `npm run dev`: start Vite on `0.0.0.0:3000` for local development.
- `npm run build`: produce the production bundle in `dist/`.
- `npm run preview`: serve the built bundle locally for verification.
- `npm run lint`: run `tsc --noEmit`; this is the current type-checking gate.
- `npm run clean`: remove `dist/`.

## Coding Style & Naming Conventions

Write React components in TypeScript/TSX. Use PascalCase for component and context files (`ProductCard.tsx`, `AdminContext.tsx`), camelCase for functions and variables, and descriptive names for route pages. Keep context state and Supabase interactions close to the relevant context module. Prefer the `@/` alias for root-relative imports when it improves readability. Match the existing style: two-space indentation in JSON, semicolons in TypeScript, and concise JSX.

## Testing Guidelines

There is no dedicated test framework configured yet. Before opening a PR, run `npm run lint` and `npm run build`. For UI changes, manually verify the affected route with `npm run dev`; for checkout, admin, upload, or Supabase changes, also confirm variables from `.env.example` are present locally. If tests are added later, place them near the feature or under `src/**/__tests__/` and document the command in `package.json`.

## Commit & Pull Request Guidelines

Recent history uses conventional short prefixes such as `feat:`, `fix:`, and `refactor:`. Keep commit subjects imperative and specific, for example `fix: prevent undefined fields in order payload`.

Pull requests should include a short summary, the commands run (`npm run lint`, `npm run build`), linked issues when applicable, and screenshots or screen recordings for visible UI changes. Note any required Supabase, EmailJS, Gemini, or deployment configuration changes.

## Security & Configuration Tips

Do not commit real secrets. Use `.env.example` as the source of required variable names and keep local values in ignored environment files. Be careful with admin, checkout, image upload, and Supabase Storage changes because they affect user data and deployed behavior.
