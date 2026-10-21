# Getting acquainted with image-blaster

A practical overview of what the pipeline is, how it's structured, and what it depends on.

## The two-stage pipeline

image-blaster is a two-stage pipeline:

### Stage 1 — Intent (variable input)

Someone decides *what* to generate and writes the prompts:

- **LLM path (the agent workflow):** the `image-blast-uncover` command analyzes the source image, decides which things in the scene are discrete *dynamic* objects, and synthesizes the removal/world/object prompts. Its output is defined by `.opencode/references/image-blast-spec.md`.
- **Human path (fully programmatic):** you write the prompt strings yourself and drive the scripts directly from a shell script, CI, or any automation.

The entire output of stage 1 is **text**: a set of prompt strings plus an object list. Nothing downstream cares where that text came from — the boundary between the two stages is just text.

### Stage 2 — Execution (deterministic API calls)

The `.mjs` scripts in `.opencode/scripts/` take the prompts and parameters, make the provider API calls, and write results to disk. Same code path for both stage-1 sources — the OpenCode commands/agents are deliberately "thin workflow wrappers" over these scripts.

Stage 2 owns all the state:

- **Indexed files**: `N-slug.ext` visible artifacts + colocated `.N-slug-request.json` hidden metadata.
- **Resumable**: request IDs are persisted before polling, so an interrupted generation can be resumed without re-paying.
- **Synchronous**: every script blocks until the API call completes and prints results to stdout.

A fully programmatic blast (no LLM in the loop):

```bash
# 0. keys in .env: WORLD_LABS_API_KEY, FAL_KEY

# 1. create envelope + stage the image
node .opencode/scripts/project/project-state.mjs --world my-slug --stage-input

# 2. (optional) clean plate — remove objects from the background
node .opencode/scripts/image-edit/generate-edit.mjs \
  --image worlds/my-slug/source/0-my-slug.jpg \
  --prompt "remove the chair and the car, keep the environment" \
  --output-dir worlds/my-slug/source --output-slug my-slug-plate

# 3. generate the 3D static environment (World Labs)
node .opencode/scripts/world/generate-world.mjs --world my-slug

# 4. one 3D model per object (FAL: meshy or hunyuan)
node .opencode/scripts/asset-pipeline/generate-single-asset.mjs \
  --world my-slug --object-id chair --image-edit-prompt "a wooden chair" \
  --provider meshy --target-polycount 30000

# 5. sound
node .opencode/scripts/sfx/fal-elevenlabs-sfx.mjs \
  --prompt "wind through a courtyard" --loop --count 2 --duration-seconds 10 \
  --output-dir worlds/my-slug/output/sfx
```

## The two providers

### FAL (fal.ai)

A serverless GPU inference platform — "Vercel for AI models". Pay per inference; call hosted models by endpoint. In this repo it is the single gateway for everything except the world:

| Endpoint | What it does |
|---|---|
| `fal-ai/hunyuan-3d/v3.1/pro/image-to-3d` | 3D model generation (Tencent Hunyuan-3D) |
| `fal-ai/meshy/v6/image-to-3d` | 3D model generation (Meshy) |
| `fal-ai/nano-banana-2/edit` | Image editing (Gemini) — plates, cleanups |
| `gpt-image-2` | Image editing (OpenAI) — plates, cleanups |
| `fal-ai/elevenlabs/sound-effects/v2` | SFX and ambient sound (ElevenLabs, via FAL) |

Note: SFX runs **through FAL**, so no separate ElevenLabs account is needed. Likewise OpenAI, Google, and Meshy are all behind the one `FAL_KEY`.

### World Labs

Fei-Fei Li's spatial-intelligence startup; their **Marble** model (marble-1.1) turns an image into a 3D world. It is the only thing that produces the splat environment, the panorama, and the thumbnail — the "static environment" half of the pipeline. Key from [platform.worldlabs.ai](https://platform.worldlabs.ai/).

## Keys and other dependencies

| Key | From | Used by |
|---|---|---|
| `WORLD_LABS_API_KEY` | platform.worldlabs.ai | `generate-world.mjs` — the environment |
| `FAL_KEY` | fal.ai | 3D models, image editing, SFX |

That is the entire key surface — a grep of every script confirms only these two env vars are required.

Everything else:

- **Runtime**: Node for the scripts, Bun for the app/workspace (`bun install`, `bun run dev`). No local GPU — all generation is API calls.
- **No other accounts/keys**: OpenAI, Google, ElevenLabs, Meshy are all covered by FAL.
- **Cost model**: pay-per-use on both platforms. A full blast = 1 world generation (World Labs) + N object 3D generations + a few image edits + SFX generations (FAL).
- **The React viewer** (port 5173) is a local convenience for looking at results — not required for the generation pipeline itself.

## What a blast produces

Per `worlds/<slug>/output/`:

1. **3D models** (`.glb`) of all confirmed dynamic objects — meshy or hunyuan via FAL.
2. **Gaussian splat** (`.spz`) + panorama + thumbnail of the static environment — World Labs.
3. **Sound** (`.mp3`): one 10s ambient loop + a 4-clip impact set per object — ElevenLabs via FAL.

The split is the core idea: meshing everything is slow and expensive, so only discrete objects get real geometry, while the environment becomes a splat — fast, and it looks like the source image.
