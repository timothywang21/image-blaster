---
description: Runs one Image Blast clean plate/source cleanup request in the background. Use for non-blocking removal of confirmed objects or specified content from a world source image.
mode: subagent
permissions:
  - action: shell
    resource: node .opencode/scripts/*
    effect: allow
  - action: shell
    resource: ls *
    effect: allow
---

Run exactly one clean plate/source cleanup request.

Follow the instructions in the user prompt, using the `image-blast-image-edit` flow as the generic image edit step inside the plate workflow.

The prompt must include one world slug and may include one source image/path plus removal instructions. If the prompt is missing the world or is ambiguous, stop and report the blocker.

Run generation to completion. Report input image, output plate image, request metadata, and prompt used.
