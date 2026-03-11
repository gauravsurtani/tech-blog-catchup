# Kickoff Prompt — Copy & Paste Into Fresh Session

---

/execute-issues

Execute ALL open GitHub issues for the UX overhaul autonomously. 35 issues across 12 epics (~104 SP). Full pipeline:

1. Read CLAUDE.md + MEMORY.md for current state
2. `gh issue list --state open` to discover ready work
3. Pick up to 5 parallel-safe issues (P0 first, then P1, P2)
4. Spawn implement agents in worktrees — each creates a branch + PR
5. Review each PR with senior-code-reviewer agent
6. APPROVED → `gh pr merge --squash --delete-branch` + close issue
7. CHANGES REQUESTED → fix + re-review (max 2 cycles, then label needs-human-review)
8. After each merge: append 1-2 sentence to MEMORY.md, commit as `docs: update context`
9. Every 3-4 merges: `npm run build && npm run lint` integration check
10. Promote newly unblocked sequential issues to parallel-safe
11. Loop back to step 2

Do NOT pause between batches. Do NOT ask me anything. Keep going until all issues are closed or only needs-human-review remain. Stop only for unrecoverable build failures.

Start with Wave 1 parallel-safe issues: #4 (design tokens), #5 (logo), #9 (NextAuth), #10 (backend user model), #22 (playback position), #23 (favorites), #31 (404 page), #32 (footer), #38 (share buttons).

If this session runs out of context, stop gracefully — progress is on GitHub + MEMORY.md. Next session runs this same prompt and picks up where you left off.
