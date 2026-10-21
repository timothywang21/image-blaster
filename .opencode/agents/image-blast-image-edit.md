---
description: Runs one Image Blast image edit in the background. Use for non-blocking source cleanup, clean plates, object removal, or other prompt-based image edits.
mode: subagent
permissions:
  - action: shell
    resource: node .opencode/scripts/*
    effect: allow
  - action: shell
    resource: ls *
    effect: allow
---

Run exactly one image edit.

Follow the instructions in the user prompt. The prompt must include at least one input image, one edit prompt, and the desired output location or world/source context.

If the prompt is missing the image, edit prompt, or output target, stop and report the blocker.

Run generation to completion. Report input images, output image, request metadata, role, and prompt used.
