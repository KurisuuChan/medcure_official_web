<div align="center">

# 💊 MedCure Frontend (Professional Scaffold)

Opinionated, production‑ready React + Vite + Tailwind CSS architecture for a pharmacy / inventory & POS web application.

_This repository currently contains a clean professional scaffold **not** the full upstream feature set. It’s structured to let you progressively implement: inventory management, point‑of‑sale workflows, notifications, reporting (PDF/CSV), and configurable settings._

![Stack](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=fff) ![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=fff) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38b2ac?logo=tailwindcss&logoColor=fff) ![React Query](https://img.shields.io/badge/React%20Query-5-ff4154) ![ESLint](https://img.shields.io/badge/ESLint-Configured-4B32C3)

</div>

## ✨ Current Scaffold Features

- Modular layout (`AppShell`) with sidebar navigation & responsive content area.
- Centralized toast notification system via React context.
- Mock data API layer isolating future real backend integration (Supabase / REST / GraphQL).
- Inventory pages: dashboard KPIs, tabular product view, POS placeholder, report & settings placeholders.
- Sensible file organization (components, hooks, pages, layouts, utils, context).
- ESLint + React hooks + React Refresh config and path alias `@` → `src`.
- Tailwind v4 with utility layering and custom animation slot.
- Deterministic chunk splitting (see `vite.config.js`) for scalable builds.

## 🗺️ Roadmap (Suggested Next Steps)

| Area          | Next Milestones                                            |
| ------------- | ---------------------------------------------------------- |
| Auth          | Integrate Supabase auth hook & route guards                |
| Inventory     | CRUD modals, CSV import/export, low stock alerts           |
| POS           | Variant selection, discount engine, receipt PDF generation |
| Reporting     | Dynamic period filters, PDF & CSV exports                  |
| Notifications | Persistent system + stock alert history panel              |
| Settings      | Persist branding + threshold configuration to backend      |
| Testing       | Add Vitest + React Testing Library coverage                |

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:5173 (default Vite port).

## 🏗️ Project Structure

```
src/
  App.jsx
  main.jsx
  layouts/        # AppShell & future layout variants
  pages/          # Route components (Dashboard, Inventory, POS, Reports, Settings)
  components/     # Reusable UI primitives (Toast, etc.)
  hooks/          # Data + state hooks (inventory summary, notifications)
  context/        # Providers (NotificationProvider)
  utils/          # Helper & mock API modules
```

## 🔧 Configuration Highlights

| Tool        | Notes                                                |
| ----------- | ---------------------------------------------------- |
| Vite        | Path alias `@` + manualChunks for vendor splitting   |
| Tailwind    | Using `@tailwindcss/vite` plugin (v4 syntax)         |
| ESLint      | Enforces hook rules & unused var hygiene             |
| React Query | Ready for real async data hydration (mock layer now) |

## 🧪 Testing (Planned)

Add after core flows are implemented:

```bash
npm i -D vitest @testing-library/react @testing-library/user-event jsdom
```

Then create a `vitest.config.js` and write tests under `src/__tests__/`.

## 🛡️ Quality & Extension Ideas

- TypeScript migration for domain safety.
- Storybook for visual regression of modals/forms.
- Lighthouse CI for performance budgets.
- Error boundary + logging (Sentry / OpenTelemetry).

## 📄 License

Provide your chosen license (MIT recommended) – add a `LICENSE` file.

## 🙌 Contributing

PRs welcome. Keep components small, pure, and accessible. Favor composition over deep prop drilling.

---

### Changelog (Scaffold)

- v0.1.0: Initial professional structure, mock inventory data, routing, notifications.

---

Made with focus on clarity, extensibility & a clean developer experience.
