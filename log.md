# Phase 1: Conversion to OpenCode Compatible

**Done:**

1. Cloned the fork, mapped the full Claude surface (8 skills, 6 agents, rules, 2 hooks, settings.json, 3 Cursor rules, 12 scripts) and confirmed OpenCode V2 has a native equivalent for every subsystem.
2. Created branch `opencode-conversion`; moved all pipeline scripts to `.opencode/scripts/` via `git mv` (history preserved), rewrote their usage-string paths, and consolidated the two hook scripts into one `status-check.sh`.
3. Wrote the converted layers: 8 OpenCode **commands** (`.opencode/commands/`, with `$0`→`$1`, `subagent: true` + `agent:` for the 5 background ones), 6 **subagents** (`.opencode/agents/`, `tools`→`permissions`), the **plugin** (`.opencode/plugins/image-blast-setup/` per-prompt status injection), **`opencode.json`** (converted permission allow-list), **`AGENTS.md`** (rules + folded Cursor rules), and relocated `IMAGE-BLAST.md` to `.opencode/references/image-blast-spec.md`; updated the README to OpenCode.
4. Removed all legacy artifacts (`.claude/`, `.cursor/`, `CLAUDE.md`, `.claudeignore`); git tracked the renames cleanly and no claude/cursor remnants remain.
5. Verified config discovery works — `opencode debug config` confirms the project `.opencode/opencode.json` is loaded.

**Remaining:**

6. Confirm all 6 agents + the plugin are actually discovered (final `debug agents` output was truncated/ambiguous and `opencode plugin list` hasn't run), then commit the branch and push it to your fork for review before any main merge.
