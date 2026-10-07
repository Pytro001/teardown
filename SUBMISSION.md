# Devpost submission: Teardown

Hackathon: Build With AI: Basics (Devpost Learn). Manage page: https://devpost.com/submit-to/30447-build-with-ai-basics/manage/submissions

> Note for Konstantin: the `6-ship` skill in this pack says the submission text should be written by you, and the agent may only fix spelling and grammar. Everything below is a factual draft built from the repo so nothing is missed. Read it, rewrite it in your own words where you want, then paste.

## Project name

Teardown

## Tagline (under 200 characters)

Snap any object and see what is inside it: every part called out on your photo, what it is made of, how it was manufactured, and how sure the AI is.

## Links

- Repo: [REPO] (public, contains scope.md, prd.md, spec.md at the root)
- Video: [VIDEO]
- Live demo: [DEMO] (optional; the app runs locally, see README)

## About the project

### Inspiration

Everything on my desk went through a factory I have never seen. I make videos about how rockets and factories work, and the most common question I get is the simplest one: what is this thing actually made of? Search gives you a 20 minute video about someone else's headphones, or a wall of chatbot text. I wanted the answer drawn on my own photo, in two seconds.

### What it does

You drop in a photo of an object (or take one with your phone). Teardown:

- draws numbered callouts onto your photo, one after another, for 4 to 10 main parts, including the hidden ones (drivers, circuit boards, batteries, heating elements) shown with dashed dots;
- lists the parts beside the photo; tap one and its card opens: material, manufacturing process (injection moulding, stamping, die casting, PCB assembly, winding and so on), one line on how it is made, a fun fact;
- says how sure it is on every part: Confident, Likely, or Best guess under 0.6;
- shows "How it is made", 4 to 6 steps from raw material to your desk.

Five examples (headphones, kettle, cordless drill, mechanical keyboard, bicycle pedal) load instantly so anyone can try it without uploading.

### How I built it

I started from an empty folder and installed the Devpost Learn skill pack (`npx skills add challengepost/learn-ai-basics --all -y`) in Claude Code. Then I ran the skills in order. `1-start` asked about me and my idea. `2-scope` pushed me to name the one distinctive thing (the answer is drawn on your own photo) and to cut accounts, history, chat and exact segmentation. `3-prd` walked the journey screen by screen and asked what happens when the photo is bad. `4-spec` chose the stack with me and made me write down what I was least sure about: whether an AI's bounding boxes are good enough to put dots on. Only then did `5-build` split the work into five slices, each built, checked and committed.

The stack: a React + TypeScript + Vite page and a tiny Node server that holds the key. The server sends the photo to Claude Sonnet 4.5 on Amazon Bedrock through the Converse API with image input and a forced tool call, so the answer always comes back as JSON in a fixed schema. The server validates it (part counts, box ranges, allowed processes, confidence) and asks once more with the errors if it breaks a rule. The page lays out the labels so they never overlap and leader lines do not cross, then animates them in. The five sample photos are AI generated product shots, and their answers are real model outputs saved as JSON so the examples are instant and the demo film is repeatable.

### Challenges I ran into

- Bounding boxes from a language model are rough. Big parts land well, small ones drift, hidden ones are a guess. Instead of hiding that, the product says it: confidence words on every part, dashed dots for inferred internal parts, and a note that positions are approximate.
- Label layout on a busy photo. The first version crossed leader lines across the whole image and hid a dot under its own label. Fixes: labels go to the side of their dot, neighbouring slots swap when lines would cross, and labels move out of the way of dots that sit in their column.
- My image generation key for the sample photos was rejected, so the samples were made with a different image model. The script keeps both paths.
- The dev server restarted itself in the middle of requests because of a file watcher. Turning the watcher off fixed the "socket hang up".

### Accomplishments that I'm proud of

- The moment the callouts draw onto your own photo. It is one screen and one action, and it looks like a product film.
- Strict structured output: every answer in this project passed validation on the first try.
- It is honest by design. The uncertainty became a feature instead of a disclaimer.

### What I learned

Planning before building changed what got built. The interview made me cut chat, accounts and history before I had written any code, and the spec's "what are you least sure about" question turned into the confidence labels, which ended up being one of the best parts of the design. Writing the risky assumption down first, then checking it on real outputs on day one, is something I will keep doing.

### What's next

- Compare two products side by side (two kettles: which one is easier to recycle).
- A share card image and link for a teardown.
- A sustainability view per part: recyclable or not, and what it is made from.
- An exploded view animation that pulls the parts apart.

## Built with

react, typescript, vite, node.js, amazon-bedrock, claude, claude-sonnet-4.5, claude-code, devpost-learn-skill-pack, playwright, ffmpeg, azure-ai-foundry

## Extra questions

**Did you participate as an individual or a team?**
Individual.

**Country of residence**
[COUNTRY]

**What did you use to build your project?**
Claude Code with the Devpost Learn Skill Pack (`challengepost/learn-ai-basics`, skills 1-start to 5-build), Amazon Bedrock with Claude Sonnet 4.5 vision (Converse API, image input, forced tool call for JSON), React, TypeScript, Vite and Node.js. The sample photos were planned with Together FLUX.1 schnell, but that key was rejected during the build, so the five photos were generated with Azure AI Foundry gpt-image-2 instead (the script supports both). Playwright and ffmpeg record the demo film.

**Did the cost of AI matter for your project?**
A little, and I measured it. Each photo uses about 3,000 to 3,400 input tokens and 1,200 to 1,600 output tokens, which is about 3 cents at Sonnet 4.5 list prices, and takes 20 to 25 seconds. All Claude calls during the build came to about 21 cents. Cost mattered in two design choices: the page shrinks photos to 1280 pixels before sending them, and the five examples use saved answers so visitors trying the demo cost nothing. At 3 cents a photo, a public version would need a rate limit or a small daily cap.

**How confident are you that your project works?**
Confident for the core flow, which I tested end to end: a real upload through the page returns a breakdown in about 20 seconds, a blank photo shows the "could not find parts" message, all five examples load, and the validator tests pass. Less confident about part positions on cluttered real world photos: the boxes are approximate, small parts can drift, and hidden parts are inferred. The materials, processes and fun facts are the model's best estimate and are not fact checked. It runs locally; it is not deployed yet.

**License URL**
[REPO]/blob/main/LICENSE (MIT)

**What value did your project create?**
It turns a vague curiosity ("what is this made of?") into a two second visual answer on your own object, and it teaches the basics of manufacturing (moulding, stamping, casting, PCB assembly, winding) through things people already own. It is useful for curious people, teachers and students, and makers who want a quick first look at how a product is built before they open it.

**How does your project meet the technical requirement?**
The project started from an empty folder on October 7, 2026 (first commit in the git history). The Devpost Learn skill pack was installed first (`.claude/skills/1-start` to `6-ship` are committed). The skills were run in order: `1-start` wrote the learner profile, `2-scope` wrote `scope.md`, `3-prd` wrote `prd.md`, `4-spec` wrote `spec.md`, and `5-build` wrote `devpost/checklist.md` and built against the spec in five committed slices, recording where the build changed the plan. `scope.md`, `prd.md` and `spec.md` are at the repo root (canonical copies in `devpost/`), and the git history shows the planning commit before any application code.

## Limitations (also in README)

- Part positions are approximate; hidden parts are inferred.
- Materials, processes and fun facts are not fact checked.
- None of the five examples has a part below 0.6 confidence, so "Best guess" does not appear in the film.
- Sample photos are AI generated studio shots.
- Not deployed; runs locally.
- The skill interviews were answered from my written project plan in one sitting.
