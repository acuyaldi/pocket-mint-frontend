<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure
may all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code.
Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:agent-rules -->
@.claude/skills/agent-rules.skill.md
<!-- END:agent-rules -->

<!-- BEGIN:git-workflow -->
@.claude/skills/git-workflow.skill.md
<!-- END:git-workflow -->

<!-- BEGIN:api-design -->
@skills/design.md
<!-- END:api-design -->

<!-- BEGIN:ui-system -->
@skills/ui-system.skill.md
<!-- END:ui-system -->

<!-- BEGIN:financial-logic -->
@skills/financial-logic.skill.md
<!-- END:financial-logic -->

## Repository Reading Rules

- Read only files directly related to the current task.
- Do not perform repository-wide audits unless explicitly requested.
- Do not inspect dependencies, build output, generated artifacts, coverage,
  reports, or lockfiles unless they are directly required by the task.
- Exception: for Next.js implementation work, read only the relevant guide
  under `node_modules/next/dist/docs/`; do not browse other dependency source
  files unless necessary for debugging.
- Prefer scoped `git diff`, `git grep`, and targeted path searches.
- Fully inspect the complete scoped diff when a review, integration, release,
  migration, or security task explicitly requires it.
- Do not reread unchanged files already inspected in the current session.
- Run focused tests first; run the full suite when required by the task,
  repository workflow, CI gate, or final verification.
- Summarize command output and failures instead of reproducing complete logs or
  unrelated repository-wide diffs.