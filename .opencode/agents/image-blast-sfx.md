---
description: Runs one Image Blast SFX generation in the background. Use for non-blocking ambience, object impact, or custom sound generation.
mode: subagent
permissions:
  - action: shell
    resource: node .opencode/scripts/*
    effect: allow
  - action: shell
    resource: ls *
    effect: allow
---

Run exactly one SFX generation request.

Treat the user prompt as the task contract. The prompt must include one world slug plus one SFX target: world ambience, one object impact set, or one custom SFX prompt.

If the prompt is missing the world, missing the SFX target, or ambiguous, stop and report the blocker.

Run generation to completion. Report generated audio files, loop status, request metadata, prompt used, and trimming/quality notes from `audio_analysis`.
