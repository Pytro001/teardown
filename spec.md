---
doc: spec
status: approved
---

# Teardown, Technical Spec

## How This Works, In Plain Language
There are two pieces. The **page** (React in the browser) takes your photo, shrinks it, and sends it to the **server** (a small Node program on your machine). The server is the only place that knows the model key. It sends the photo to Claude Sonnet 4.5 on Amazon Bedrock and forces the answer into a fixed shape (a "tool call" with a JSON schema): object name, parts with boxes, materials, processes, confidence, fun facts, and the journey. The server checks the answer against the rules and asks once more if it breaks them. The page then draws the answer on top of your photo.
Example objects skip the server: their answers were made once with the same pipeline and saved as JSON next to the image.
Why this shape: the key must not live in the browser, and one tiny server is the smallest thing that keeps it secret.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. You drop a photo, `web/src/lib/image.ts` reads it and scales it to at most 1280 px on the long side as JPEG.
2. `web/src/lib/api.ts` POSTs `{ image: <base64 jpeg> }` to `/api/teardown` (Vite proxies to port 8303 in dev; `VITE_API_URL` in a static build).
3. `server/index.mjs` receives it, `server/bedrock.mjs` calls Bedrock Converse with the image and the `report_teardown` tool, tool choice forced.
4. `server/schema.mjs > validateTeardown` checks the tool input. On failure the server retries once with the error text appended. Then it returns `{ result, usage, ms, attempts }`.
5. `web/src/App.tsx` stores the result in React state; `Overlay.tsx` draws the callouts, `PartPanel.tsx` the list and card, `Journey.tsx` the timeline.
6. Clicking an example loads `/samples/<id>.jpg` and `/samples/<id>.json` with no server call.

## Stack
- React 19 + TypeScript + Vite 7 (https://react.dev, https://vite.dev). Learner choice: familiar, fast.
- Node 26 built-in `http` and `fetch` for the server, no framework (https://nodejs.org/api/http.html). Fewer dependencies.
- Amazon Bedrock Converse API, model `us.anthropic.claude-sonnet-4-5-20250929-v1:0`, bearer token auth (https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html).
- Together AI FLUX.1 schnell for the five sample photos only (https://docs.together.ai/docs/images-overview).
- Playwright (already on the machine) for the film recorder; ffmpeg for encoding.

## Where It Runs and How Someone Tries It
- Requirements: Node 20 or newer, a Bedrock bearer token in `.env` (see `.env.example`).
- `npm install` then `npm run dev`: starts the API on http://localhost:8303 and Vite on http://localhost:5303. Open http://localhost:5303.
- Without a key the examples still work (they are cached); uploads show the server error state.
- Static build: `VITE_API_URL=https://your-api npm run build` writes `web/dist`, deployable to Vercel or GitHub Pages. The server runs anywhere Node runs (`npm start`). Deployment is optional and left to the user.
- Film: `npm run dev`, then `node output/record.mjs`.

## Look and Feel
Implements `prd.md > Look and Feel`.
- Background `#07080a` with a radial vignette; panels `#0e1013` with 1 px `#ffffff14` borders.
- Text `#f2f2ee`, muted `#8b8f97`. Accent amber `#ffb547` for the active part only. Confidence colours: confident `#7ee2a8`, likely `#ffd27a`, best guess `#ff9b7a`.
- Fonts: Inter Tight for text, JetBrains Mono for numbers (Google Fonts).
- Leader lines 1.5 px white, dots 26 px circles with mono numerals. Lines draw in with `stroke-dashoffset`, 450 ms each, 280 ms apart.
- Large type: headline 56 px, object name 40 px. Built for 1920x1080 video.

## Components

### Server: `server/index.mjs`
HTTP server on `PORT` (8303). Routes: `GET /api/health`, `POST /api/teardown`. CORS open for the static build. Body limit 8 MB. Logs token usage per call.
PRD ref: `prd.md > States and Boundaries`.

### Model call: `server/bedrock.mjs`
`analyzeImage(base64, mediaType)` builds the Converse request (system prompt, image block, text instruction, `toolConfig` with `report_teardown`, `toolChoice: { tool: { name } }`, temperature 0.2, maxTokens 3000). Returns tool input plus usage.

### Schema and validation: `server/schema.mjs`
The JSON schema for `report_teardown` and `validateTeardown(obj)` that returns a list of errors: 4 to 10 parts, boxes inside 0..1, confidence 0..1, process from the allowed list, 4 to 6 journey steps, non empty strings. Also normalises small issues (clamps boxes).
PRD ref: `prd.md > Features and Behavior`.

### Upload and stage: `web/src/components/Stage.tsx`
Drop zone, file input (`accept="image/*"`, `capture` hint on phones), scanning state, error message. Keyboard: the zone is a button.
PRD ref: `prd.md > Photo input`.

### Overlay: `web/src/components/Overlay.tsx`
SVG in the photo's coordinate space. For each part: dot at box centre, label placed on the nearer left or right side, leader line from dot to label, sorted vertically per side so labels do not collide. Staggered draw-in animation. Clicking a dot or label selects the part.
PRD ref: `prd.md > The breakdown overlay`.

### Part panel: `web/src/components/PartPanel.tsx`
Object name, numbered list, selected part card with material, process, confidence word and bar, fun fact.
PRD ref: `prd.md > Part list and part card`.

### Journey: `web/src/components/Journey.tsx`
Horizontal steps with a drawn connecting line.
PRD ref: `prd.md > How it is made`.

### Examples: `web/src/components/Examples.tsx`
Five thumbnails from `web/src/lib/samples.ts`.

### Film mode: `web/src/film.ts`
With `?film=1`, exposes `window.__film` with `load(id)`, `select(index)`, `setTime(ms)` so the recorder steps animations frame by frame (all animation timing is driven from a single clock that film mode controls).

## Data Model
One `Teardown` object in React state, gone on reload.
```
Teardown {
  object: string, summary: string,
  parts: [{ name, box: {x,y,w,h} (0..1, top-left origin), material, process, process_detail, confidence (0..1), fun_fact }],   // 4 to 10
  journey: [{ stage, title, detail }]   // 4 to 6
}
```
Selected part index and load status are also React state. Examples are static files in `web/public/samples/`.

## File Structure
```
teardown/
├── scope.md prd.md spec.md     # copies of the approved planning docs (submission requirement)
├── devpost/                    # skill pack workspace: scope, prd, spec, checklist, interview log, app map
├── server/
│   ├── index.mjs               # HTTP API, port 8303
│   ├── bedrock.mjs             # Converse call with image + forced tool
│   └── schema.mjs              # JSON schema + validation
├── web/
│   ├── index.html
│   ├── public/samples/         # 5 AI generated photos + cached JSON results
│   └── src/
│       ├── main.tsx App.tsx styles.css film.ts
│       ├── components/ Stage.tsx Overlay.tsx PartPanel.tsx Journey.tsx Examples.tsx
│       └── lib/ api.ts image.ts confidence.ts samples.ts types.ts
├── scripts/
│   ├── dev.mjs                 # starts server + vite together
│   ├── make-samples.mjs        # Together FLUX sample photos
│   ├── cache-samples.mjs       # runs the real pipeline on each sample, saves JSON
│   └── test-schema.mjs         # validation tests
├── output/record.mjs           # Playwright film recorder
└── vite.config.ts package.json README.md LICENSE
```

## External Services and Dependencies
- **Bedrock Converse**: `POST https://bedrock-runtime.us-east-1.amazonaws.com/model/{modelId}/converse`, header `Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK`. Body `{ system:[{text}], messages:[{role:'user', content:[{image:{format:'jpeg', source:{bytes:<base64>}}},{text}]}], toolConfig:{tools:[{toolSpec:{name, description, inputSchema:{json}}}], toolChoice:{tool:{name}}}, inferenceConfig:{maxTokens, temperature} }`. Response `output.message.content[].toolUse.input`, `usage.inputTokens/outputTokens`. Cost: Sonnet 4.5 list price $3 per million input and $15 per million output tokens.
- **Together images**: `POST https://api.together.xyz/v1/images/generations`, `{ model:'black-forest-labs/FLUX.1-schnell', prompt, width, height, steps, response_format:'b64_json' }`. Only used offline by `make-samples.mjs`.

## Important Failure Modes
- **Model returns invalid JSON or breaks the rules** → one retry with the errors; then the page shows "The model did not answer. Try again or pick an example."
- **Photo with no clear object** → the model returns `parts: []` with `object: "none"`; the page shows "Could not find parts in this photo."
- **Boxes are imprecise** → dot at box centre, "positions are approximate" note on screen.

## What Was Simplified and Why
- **Box centre dots** instead of segmentation, because a language model gives rough boxes; good enough to point at a part.
- **Cached example results** instead of live calls for the examples, so the page is instant and the film deterministic. They are real model outputs, made by `cache-samples.mjs`.
- **No storage**, so no share links yet.

## Decisions and Open Issues
- Stack and model: learner accepted React + Vite + Node with Bedrock Sonnet 4.5.
- Learner uncertainty: are model bounding boxes accurate enough? Agreed investigation: run the five samples, inspect overlays in stills, record results under `checklist.md > Revisions`.
- Open: none blocking.
