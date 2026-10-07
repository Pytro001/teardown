---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Drop a photo and see numbered callouts land on it**
  Becomes usable: Running app; a dropped photo goes through Bedrock and comes back with callouts drawn on the photo.
  Why now: It is the kernel and the riskiest part (vision + strict JSON + box quality). Bootstrapping lives here.
  PRD ref: `prd.md > The Core Journey` (steps 1 to 4), `prd.md > Photo input`, `prd.md > The breakdown overlay`
  Spec ref: `spec.md > Server: server/index.mjs`, `spec.md > Model call: server/bedrock.mjs`, `spec.md > Schema and validation: server/schema.mjs`, `spec.md > Upload and stage: web/src/components/Stage.tsx`, `spec.md > Overlay: web/src/components/Overlay.tsx`
  Build: Scaffold Vite React TS and the Node server, dev script for both, Converse call with forced tool, validation with one retry, image downscale, stage and SVG overlay with staggered draw-in.
  Verify (mechanical): `node scripts/test-schema.mjs` passes; `curl` a photo to `/api/teardown` returns valid JSON; `vite build` has no type errors; screenshot shows callouts on the photo.
  Learner check: Run `npm run dev`, drop a photo of something on your desk, watch the dots draw in.
  Commit: `Photo in, callouts out`

- [x] **2. Tap a part to read its card**
  Becomes usable: Part list beside the photo; selecting a part highlights it and shows material, process, confidence and a fun fact.
  Why now: Completes the "what is this made of" answer for one part.
  PRD ref: `prd.md > Part list and part card`
  Spec ref: `spec.md > Part panel: web/src/components/PartPanel.tsx`
  Build: Panel with list, card, confidence words, keyboard selection, overlay highlight and dimming.
  Verify (mechanical): Build passes; Playwright click on part 2 shows its card text.
  Learner check: Click a dot on the photo and then a list item, check the card matches.
  Commit: `Part list and part cards`

- [x] **3. See how it is made, and the honest states**
  Becomes usable: Journey timeline under the stage; error and empty states; honesty note.
  Why now: Closes the core journey and the what-ifs from the PRD.
  PRD ref: `prd.md > How it is made`, `prd.md > States and Boundaries`, `prd.md > Honesty`
  Spec ref: `spec.md > Journey: web/src/components/Journey.tsx`, `spec.md > Important Failure Modes`
  Build: Timeline component, error messages, scanning state, no-object handling.
  Verify (mechanical): Upload a blank image and confirm the "Could not find parts" message; build passes.
  Learner check: Try a photo of a wall and see the friendly message.
  Commit: `Journey timeline and error states`

- [x] **4. Try an example without uploading**
  Becomes usable: Five example objects load instantly with saved real results.
  Why now: Lets anyone try it and makes the film repeatable.
  PRD ref: `prd.md > Photo input` (examples)
  Spec ref: `spec.md > Examples: web/src/components/Examples.tsx`, `spec.md > External Services and Dependencies`
  Build: `make-samples.mjs` (Together FLUX), `cache-samples.mjs` (real pipeline), example row.
  Verify (mechanical): Five JPG and five JSON files exist and pass validation; clicking each renders callouts.
  Learner check: Click every example and judge if the dots sit on the right parts.
  Commit: `Five examples with cached results`

- [x] **5. Film mode and recorder**
  Becomes usable: `?film=1` with `window.__film` and a frame stepped Playwright recorder producing the screen film and stills.
  Why now: Submission needs the video; the app must be finished first.
  PRD ref: `prd.md > The Core Journey`
  Spec ref: `spec.md > Film mode: web/src/film.ts`
  Build: Single clock for animations, film API, `output/record.mjs`, stills.
  Verify (mechanical): `output/teardown-screen.mp4` exists at 1920x1080 30 fps; stills inspected.
  Learner check: Watch the film once start to finish.
  Commit: `Film mode and recorder`

## Hands-on Checkpoints

- [ ] Early usable behavior explored, after slice 1 (agent ran the learner check with Playwright screenshots; Konstantin still has to try it himself, see README "Open items")
- [ ] Final kick-the-tires exploration and feedback completed (pending Konstantin)

## Final Review

- [x] Agent review: overlay label collisions, crossing leader lines, dots hidden under labels, journey caption overlap all fixed and re-checked in stills
- [ ] Final review complete, feedback resolved and learner confirms ready to ship (pending Konstantin)

## Code Tour and App Map

- [ ] Learning activity complete
- [ ] Optional edit and transfer reflection addressed
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: reference route only, written into `devpost/app-map.html`; the guided tour has not been done with Konstantin yet.
Route and stops: `web/src/components/DropZone.tsx` (onFile) > `server/bedrock.mjs` (analyzeImage) > `web/src/components/Overlay.tsx` (layout).
Edit outcome: not applicable yet.
Reflection: not offered yet.
Activity mode: reference route (static).

## Revisions

- Sample photos made with Azure AI Foundry gpt-image-2 instead of Together FLUX.1 schnell: the Together key was rejected (401 on every call, including the models list) and NVIDIA's hosted FLUX endpoint timed out. `scripts/make-samples.mjs` still tries Together first, so FLUX is used again once a working key is set.
- Dev launcher runs the API without `node --watch-path`: the watcher kept restarting the server mid request, which surfaced as "socket hang up" in the Vite proxy.
- Box accuracy investigation (the open question from `spec.md > Decisions and Open Issues`): on the five samples the dots land on the right part for most large visible parts (ear cushion, headband, hinge, chuck, battery, kettle base); small or hidden parts drift (keyboard knob box sits above the knob, internal parts are inferred). Kept box centre dots plus the "positions are approximate" note, and the dashed dot style marks inferred internal parts.
- Overlay layout gained three rules the plan did not foresee: labels go to the side of their dot with a balance limit, neighbouring label slots swap when leader lines would cross, and dots inside a label column push labels away. Dots render above labels.
- Stack versions: npm resolved Vite 8, TypeScript 7 and React 19 (spec said Vite 7); no code changes needed.
- Journey timeline now starts when it scrolls into view rather than right after the callouts, so it is not over before anyone sees it.
- Slices 1 to 4 were built in one pass and committed as four slice sized commits afterwards.

