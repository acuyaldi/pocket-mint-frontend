# Assistant History Management UX QA

**Branch:** `feat/assistant-history-management-ux` (from `dev`)
**Scope:** Frontend-only Assistant conversation history management. No backend,
generated, package, recovery-loading, financial-domain, or provider-contract
changes.

## Product Scope

- Archive is the only cleanup action exposed.
- Restore, permanent delete, bulk archive/delete, and delete-all are not shown
  because the backend does not expose those contracts.
- Each archive confirmation maps to exactly one existing idempotent
  owner-scoped archive call.
- Archived conversations can remain visible when returned by the existing
  history list API, but the UI does not imply they can be restored or continued.

## History Surface

- Assistant header actions now use canonical `Button` variants:
  primary touch-sized New Conversation and outline touch-sized history icon.
- The history dialog uses a larger responsive modal with a scrollable list so
  loaded pages do not stretch the whole viewport.
- Rows show active selection, archived state, deterministic date fallback, and
  a per-row archive affordance for active conversations only.
- Archiving the currently active conversation starts a new conversation after
  success. Archiving any other loaded conversation leaves the active
  conversation unchanged.
- Archive failure is owned by one snackbar message.

## Loaded-Only Search And Filters

- Search is intentionally scoped to loaded conversation previews:
  "Search loaded conversations" / "Cari percakapan yang sudah dimuat".
- Active/archived filters are client-side filters over loaded rows only.
- Pagination remains available; loading more conversations expands the loaded
  result set and therefore updates search/filter results.
- The count uses the current server total when available, but visible matches
  are not presented as global search results.

## Backend Capability Audit

Supported today:

- Owner-scoped paginated history list.
- Total count.
- Conversation detail.
- Recovery state.
- Single idempotent archive.

Unsupported today:

- Server-side search.
- Server-side filters.
- Restore.
- Permanent delete.
- Bulk archive/delete.
- Delete all.

Future UI for restore/delete/bulk/delete-all should wait for explicit backend
contracts, partial-failure semantics, and tests that prove authorization and
idempotency behavior.

## Validation Environment

- Required Node source: `package.json` engines and CI both require Node `22.x`.
- Local validation uses Node `v22.23.1`.
