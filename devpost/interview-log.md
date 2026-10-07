# Skill pack interview log

The Devpost Learn skills (`1-start` to `4-spec`) interviewed the builder before any code was written. This is a condensed record of the questions the skills asked and the answers given. Answers were taken from Konstantin's written project plan for Teardown (see README, "How the plan was made").

## 1-start
- **What would you like to build?** A photo in, "what is inside this" out. Parts called out on your photo, materials, how each is manufactured, and the journey from raw material to your desk.
- **Experience with coding and agents, plan-first?** Builds with Claude Code and Codex daily, React and Node. Writes one page plans, never a scope, PRD and spec sequence.
- **One thing to get better at?** See whether interviewing first changes what the agent builds.

## 2-scope
- **Brain dump.** Everything on your desk went through a factory you have never seen. Curiosity tool for people who watch how-it's-made videos. Dark, product film look, the photo is the hero.
- **What is distinctive?** The answer is drawn on your own photo, not someone else's video.
- **What if the model is wrong?** Say so. Every part gets a confidence label, and below 0.6 it says "best guess". (This became a feature.)
- **What does working look like?** Headphones photo, callouts draw in, tap the driver, read magnet, coil, stamped steel, see the journey.
- **Cut.** No accounts, no database, no chat, no exact segmentation.

## 3-prd
- **First screen?** One big drop zone, one line of copy, and a row of five example objects so nobody has to upload to try it.
- **After the photo?** A short scanning state on the photo itself, then callouts draw in one after another, part list appears on the right.
- **Tap a part?** A card: material, process, confidence, one fun fact. The matching callout lights up.
- **Look?** Dark studio, near black, white hairlines, one warm accent (amber) for the active part, a clean grotesk for text and a mono for numbers.
- **Nothing found or not an object?** Plain message on the photo: "Could not find parts in this photo. Try one object, close up, good light."

## 4-spec
- **Stack?** React, TypeScript, Vite in the browser; a small Node server holds the model key. Accepted.
- **Model?** Claude Sonnet 4.5 on Amazon Bedrock, Converse API with image input, forced tool call for strict JSON. Accepted.
- **Where does data live?** Nowhere. The result lives in the page. Examples are JSON files next to the images.
- **Least sure about?** Whether the bounding boxes from a language model are accurate enough to put dots on. Agreed investigation: run the five examples, look at the overlays, put the dot at the box centre and say "approximate" on screen.
- **Where it runs?** Locally for the film, static web build plus Node API for a later deploy.
