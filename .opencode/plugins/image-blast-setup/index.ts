import { Plugin } from "@opencode/plugin"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"

// Replaces the old Claude Code SessionStart + UserPromptSubmit hooks.
// Runs the status-check script before every prompt and injects its stdout
// (.env key status, available worlds, staged input/) into the prompt.
export default Plugin.define({
  id: "image-blast-setup",
  async setup(ctx) {
    const registration = await ctx.session.hook("prompt", (event) => {
      try {
        const projectDir = ctx.location.project?.directory ?? ctx.location.directory
        const script = resolve(projectDir, ".opencode/scripts/hooks/status-check.sh")
        const out = execFileSync("bash", [script], {
          cwd: projectDir,
          encoding: "utf8",
          timeout: 10_000,
          env: { ...process.env, OPENCODE_PROJECT_DIR: projectDir },
        }).trim()
        if (out) event.prompt.text += `\n\n${out}`
      } catch {
        // Never block the prompt on a status-check failure.
      }
    })
    return () => {
      void registration.dispose?.()
    }
  },
})
