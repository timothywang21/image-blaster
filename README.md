<img width="960" height="540" alt="image-blaster-1" src="https://github.com/user-attachments/assets/d294e420-eb48-4f00-b6a8-13005442d1a8" />

## `image-blaster`
Creates 3D environments, SFX, and meshes from a single image using OpenCode commands, World Labs, and FAL. 

Can take you from an image to a fully meshed 3D environment in < 5 minutes, great for jumpstarting 3D work. Go full blast.


## Quickstart

1. Open a Terminal, enter `git clone https://github.com/timothywang21/image-blaster`
2. Enter the directory with `cd image-blaster`
3. Run `opencode` (install with `curl -fsSL https://opencode.ai/install -sSf | bash`)
4. Start an OpenCode session, and give it your API key for [World Labs](https://platform.worldlabs.ai/) and [FAL](https://fal.ai/).
5. Put an image into `input/` directory and ask OpenCode to `blast it and confirm each step with me`.

### Description

By default `image-blaster` will use your input image to create:

1. 3D models (`.glb`, `.obj`) of all *dynamic* objects
2. Gaussian splat (`.spz`) of the *static* environment,
3. Ambient looping sound and object specific physics SFX (`.mp3`)

### Extensions

You can embed `image-blaster` under the assets of *any game engine, DCC software, or web app*.

1. Unity, Unreal, or Godot game engine
2. Blender, 3DS Max, or Maya or other DCC software
3. Three.js web app or Electron app

## How it works

`image-blaster` is a two-stage pipeline.

**Stage 1 — intent.** Someone decides what to generate and writes the prompts. Either the OpenCode agent (the `/image-blast-uncover` command analyzes the image, picks the discrete objects, and synthesizes the prompts per `.opencode/references/image-blast-spec.md`) or a human (writing the prompt strings and driving the scripts directly). The entire output of stage 1 is text: prompt strings plus an object list.

**Stage 2 — execution.** The `.mjs` scripts in `.opencode/scripts/` take those prompts and parameters, make the provider API calls, and write the results to disk. It is the same code path either way — the commands and subagents are thin workflow wrappers. Stage 2 owns all the state: indexed output files (`N-slug.ext` plus colocated `.N-slug-request.json`), request IDs persisted before polling so an interrupted generation resumes instead of re-paying, and synchronous execution — every script blocks until the API call completes and prints its result.

So the agent is optional. A fully programmatic blast:

```bash
node .opencode/scripts/project/project-state.mjs --world my-slug --stage-input
node .opencode/scripts/world/generate-world.mjs --world my-slug
node .opencode/scripts/asset-pipeline/generate-single-asset.mjs \
  --world my-slug --object-id chair --image-edit-prompt "a wooden chair"
node .opencode/scripts/sfx/fal-elevenlabs-sfx.mjs \
  --prompt "wind through a courtyard" --loop --count 2 --duration-seconds 10 \
  --output-dir worlds/my-slug/output/sfx
```

## Repository layout

```text
image-blaster/            ← repo root
├── AGENTS.md             ← OpenCode instructions (file convention, workflow order, dev notes)
├── .opencode/            ← dot-folder, hidden from a plain `ls`
│   ├── opencode.json     ← permission allow-list
│   ├── commands/         ← 8 slash commands (/image-blast-world, /image-blast-3d, ...)
│   ├── agents/           ← 6 background subagents (one per generation type)
│   ├── plugins/          ← image-blast-setup: per-prompt status injection
│   ├── references/       ← image-blast-spec.md (the uncover JSON contract)
│   └── scripts/          ← the real pipeline — plain node CLIs, no LLM required
│       ├── asset-pipeline/  single 3D object generation (meshy / hunyuan)
│       ├── fal/             generic FAL endpoint runner
│       ├── hooks/           status-check.sh (driven by the plugin)
│       ├── image-edit/      image edits / clean plates
│       ├── project/         envelope, staging, indexed paths, viewer URL, delete
│       ├── sfx/             ElevenLabs SFX via FAL
│       └── world/           World Labs environment generation
├── app/                  ← React viewer (Three.js + splat), port 5173
├── input/  worlds/       ← working areas (gitignored, `.gitkeep` only)
```

## Dependencies

Two API keys, two providers, no local GPU:

| Key | From | Used for |
|---|---|---|
| `WORLD_LABS_API_KEY` | [platform.worldlabs.ai](https://platform.worldlabs.ai/) | the environment (splat + panorama + thumbnail) |
| `FAL_KEY` | [fal.ai](https://fal.ai/) | 3D models, image editing, SFX |

- **FAL** is a serverless GPU inference platform — one gateway to `hunyuan-3d`, `meshy`, `nano-banana`, `gpt-image-2`, and `elevenlabs` sound effects. No separate OpenAI, Google, ElevenLabs, or Meshy accounts needed.
- **World Labs** is Fei-Fei Li's spatial-intelligence startup; its `marble-1.1` model is the only thing that generates the 3D environment.
- **Runtime**: Node for the scripts, Bun for the app/workspace (`bun install`, `bun run dev`). The viewer is a local convenience for viewing results, not a generation dependency.
- **Cost**: pay-per-use on both platforms. One full blast = 1 world generation + N object generations + a few image edits + SFX generations.

## Advanced

IMAGE-BLASTER uses a few generation models:

- `marble-1.1` - World Labs Marble model creates the explorable environment.
- `nano-banana` - default image edit preference for source cleanup, clean plates, and object reference images.
- `gpt-image-2` - alternate image edit provider when the edit skill is asked to prefer it.
- `hunyuan-3d` - Hunyuan 3D model creates 3D object models through FAL.
- `elevenlabs-sfx` - ElevenLabs sound effects model creates ambient and object-specific sounds.

3D model creation supports these Hunyuan parameters:

- `--face-count <40000-1500000>`: target face count. IMAGE-BLASTER defaults to `50000`; Hunyuan's API default is `500000`.
- `--enable-pbr true|false`: enable PBR material generation. Defaults to `true`.
- `--generate-type Normal|LowPoly|Geometry`: `Normal` creates a textured model, `LowPoly` applies polygon reduction, and `Geometry` creates a white geometry-only model. Defaults to `Normal`.
- `--polygon-type triangle|quadrilateral`: polygon type for `LowPoly`. Defaults to `triangle`.

### Examples

- Video game level concepts? `IMAGE-BLAST` it.
- Your childhood bedroom? `IMAGE-BLAST` it.
- Need an environment for a robot? `IMAGE-BLAST` it.
- A film location scout? `IMAGE-BLAST` it.
- An architectural rendering? `IMAGE-BLAST` it.

### Development

- The React viewer in `app/` is a normal part of the repository. To change it, just work in the repo as usual — OpenCode has no `.claudeignore`-style exclusion to remove.
