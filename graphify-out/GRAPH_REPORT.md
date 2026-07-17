# Graph Report - .  (2026-07-14)

## Corpus Check
- Corpus is ~40,822 words - fits in a single context window. You may not need a graph.

## Summary
- 501 nodes · 933 edges · 30 communities (23 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.86)
- Token cost: 284,189 input · 0 output

## Community Hubs (Navigation)
- Wallet & Profile Modals
- Add Transaction Modal
- App Shell & Navigation
- Dashboard & Transaction Helpers
- JWT API Client & CI Security
- Agent Skill Docs
- Installments (Cicilan) UI
- TypeScript Config References
- Runtime Dependencies
- Dev Dependencies
- shadcn Component Config
- Auth Actions & User Sync
- Root Layout & Fonts
- Wallet Sparkline
- Middleware & Proxy
- Legacy Artifact Tests
- Dev Server Skill Docs
- File Icon Asset
- Paylater Presets
- Next.js Logo Asset
- Vercel Logo Asset
- ESLint Config
- Next Config
- Next Env Types
- PostCSS Config
- Globe Icon Asset
- Window Icon Asset

## God Nodes (most connected - your core abstractions)
1. `cn()` - 41 edges
2. `formatCurrency()` - 25 edges
3. `createClient()` - 17 edges
4. `isDebtWallet()` - 17 edges
5. `compilerOptions` - 17 edges
6. `Button()` - 14 edges
7. `AddTransactionModal()` - 10 edges
8. `Input()` - 10 edges
9. `Wallet` - 10 edges
10. `DashboardPage()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Financial Logic Skill (legacy .claude copy)` --semantically_similar_to--> `Financial Logic Skill (current)`  [INFERRED] [semantically similar]
  .claude/skills/financial-logic.skill.md → skills/financial-logic.skill.md
- `unauthorizedResponseInterceptor()` --implements--> `401 Single-Retry-With-Fresh-Token Policy`  [EXTRACTED]
  lib/api.ts → docs/authentication.md
- `new-feature Skill — Scaffold Feature Folder (.agents copy)` --references--> `formatCurrency()`  [EXTRACTED]
  .agents/skills/new-feature/SKILL.md → lib/utils.ts
- `new-feature Skill — Scaffold Feature Folder (.claude copy)` --references--> `formatCurrency()`  [EXTRACTED]
  .claude/skills/new-feature/SKILL.md → lib/utils.ts
- `Financial Logic Skill (current)` --references--> `formatCurrency()`  [EXTRACTED]
  skills/financial-logic.skill.md → lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Supabase JWT Authentication Flow** — docs_authentication_supabase_bearer_jwt, lib_api_authrequestinterceptor, lib_api_unauthorizedresponseinterceptor, lib_api_authenticationrequirederror, lib_api_shouldretrywithfreshtoken, docs_authentication_users_sync_flow [EXTRACTED 1.00]
- **Pocket Mint Design System Documentation (light current + dark legacy)** — skills_design_design_doc, skills_ui_system_skill_ui_system_doc, _claude_skills_design_pro_fintech_dark, _claude_skills_ui_system_skill_ui_system_doc [INFERRED 0.85]
- **Pocket Mint Financial Domain Model** — skills_financial_logic_skill_wallet_types, skills_financial_logic_skill_net_worth_calculation, skills_financial_logic_skill_debt_ratio, skills_financial_logic_skill_installment_model_a, skills_financial_logic_skill_paylater_rates, skills_financial_logic_skill_transaction_rules [EXTRACTED 1.00]

## Communities (30 total, 7 thin omitted)

### Community 0 - "Wallet & Profile Modals"
Cohesion: 0.07
Nodes (41): FormState, initialState, DeleteTransactionModalProps, assetIdentityIcons, CreateWalletModal(), CreateWalletModalProps, debtIdentityIcons, parseRupiahToNumber() (+33 more)

### Community 1 - "Add Transaction Modal"
Cohesion: 0.06
Nodes (48): AddTransactionModal(), AddTransactionModalProps, EXPENSE_CATS, getInstallmentDefaults(), INCOME_CATS, spendable(), Tab, TENORS (+40 more)

### Community 2 - "App Shell & Navigation"
Cohesion: 0.08
Nodes (36): logout(), AccountMenuItems(), AppSidebar(), NAV_ITEMS, SidebarContent(), BottomNav(), NAV_ITEMS, DockMorph() (+28 more)

### Community 3 - "Dashboard & Transaction Helpers"
Cohesion: 0.11
Nodes (34): buildMiniBarHeights(), DashboardPage(), AddTransactionData, DateRangeFilter, fadeUp, formatDate(), formatSignedCurrency(), typeConfig (+26 more)

### Community 4 - "JWT API Client & CI Security"
Cohesion: 0.10
Nodes (27): Frontend CI Workflow, CI Step: Reject Legacy Backend Authentication, CI Step: Production Bundle Security Scan, ProfilePage(), ResetPasswordPage(), 401 Single-Retry-With-Fresh-Token Policy, Frontend Authentication Doc — Supabase Bearer JWT, Supabase Bearer JWT Authentication Model (+19 more)

### Community 5 - "Agent Skill Docs"
Cohesion: 0.08
Nodes (33): new-feature Skill — Scaffold Feature Folder (.agents copy), Agent Rules Skill (legacy .claude/skills), docs/audit.md Maintenance Rule, Git & PR Conventions (dev=Staging, master=Production), Inset Elevation Model, Pro-Fintech Dark Design System (legacy), Financial Logic Skill (legacy .claude copy), Task: Active Installments on Dashboard (+25 more)

### Community 6 - "Installments (Cicilan) UI"
Cohesion: 0.09
Nodes (22): ActiveInstallmentsWidget(), ActiveInstallmentsWidgetProps, HeroCard(), HeroCardProps, Installment, InstallmentCard(), InstallmentCardProps, WALLET_TYPE_LABELS (+14 more)

### Community 7 - "TypeScript Config References"
Cohesion: 0.06
Nodes (31): ./*, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+23 more)

### Community 8 - "Runtime Dependencies"
Cohesion: 0.06
Nodes (31): axios, @base-ui/react, class-variance-authority, clsx, framer-motion, lucide-react, next, dependencies (+23 more)

### Community 9 - "Dev Dependencies"
Cohesion: 0.07
Nodes (29): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+21 more)

### Community 10 - "shadcn Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "Auth Actions & User Sync"
Cohesion: 0.32
Nodes (10): getOrigin(), getUser(), login(), signInWithGoogle(), signup(), GET(), LoginForm(), resolveUserName() (+2 more)

### Community 12 - "Root Layout & Fonts"
Cohesion: 0.25
Nodes (6): hankenGrotesk, inter, jetbrainsMono, metadata, viewport, QueryProvider()

### Community 13 - "Wallet Sparkline"
Cohesion: 0.47
Nodes (4): WalletSparkline(), WalletSparklineProps, SparklinePoint, useWalletSparkline()

### Community 14 - "Middleware & Proxy"
Cohesion: 0.60
Nodes (3): updateSession(), config, proxy()

### Community 15 - "Legacy Artifact Tests"
Cohesion: 0.50
Nodes (3): forbidden, root, runtimeFiles

### Community 16 - "Dev Server Skill Docs"
Cohesion: 0.67
Nodes (3): dev Skill — Start Dev Servers (.agents copy), dev Skill — Start Dev Servers (.claude copy), README (create-next-app template)

### Community 17 - "File Icon Asset"
Cohesion: 0.67
Nodes (3): Document / File Glyph, Next.js create-next-app Boilerplate Assets, File Icon (file.svg)

### Community 19 - "Next.js Logo Asset"
Cohesion: 0.67
Nodes (3): create-next-app Default Scaffold Assets, Next.js Framework, Next.js Logo (public/next.svg)

### Community 20 - "Vercel Logo Asset"
Cohesion: 0.67
Nodes (3): Next.js create-next-app Default Scaffold Assets, Vercel Platform, Vercel Logo (white triangle mark)

## Knowledge Gaps
- **179 isolated node(s):** `ActiveInstallmentsWidgetProps`, `HeroCardProps`, `InstallmentCardProps`, `WALLET_TYPE_LABELS`, `JatuhTempoCardProps` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Dev Dependencies`, `App Shell & Navigation`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `react` connect `App Shell & Navigation` to `Runtime Dependencies`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `cn()` connect `Wallet & Profile Modals` to `App Shell & Navigation`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **What connects `ActiveInstallmentsWidgetProps`, `HeroCardProps`, `InstallmentCardProps` to the rest of the system?**
  _179 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Wallet & Profile Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.07281772953414745 - nodes in this community are weakly interconnected._
- **Should `Add Transaction Modal` be split into smaller, more focused modules?**
  _Cohesion score 0.05974025974025974 - nodes in this community are weakly interconnected._
- **Should `App Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.0797979797979798 - nodes in this community are weakly interconnected._