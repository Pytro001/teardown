---
doc: scope
status: approved
---

# Teardown

Snap a photo of any everyday object and see what is inside it: the parts, what they are made of, and how they were made.

## The Unique Kernel
The answer is drawn on your own photo. Numbered callouts land on the real parts of the real object you are holding, and each one tells you the material and the factory process (injection moulding, stamping, die casting, PCB assembly). It turns "what is this made of" into a two second visual, with an honest confidence label on every guess.

## Who It's For
Someone like Konstantin's X followers: curious, not an engineer, watches factory tour and teardown videos. Today they search "how are headphones made" and get a 20 minute video about someone else's headphones, or a wall of text from a chatbot.

## The Core Loop
Open the page, drop or snap a photo, watch the callouts draw onto it, tap a part to read its card, scroll the "how it is made" journey. Then try the next object on the desk. They come back because every object is a new answer.

## Inspiration & Identity
Product film look: dark studio background, the photo as the hero, thin white leader lines, numbered dots, a technical drawing or exploded view feel. Calm, precise, a little magical. References: iFixit teardowns (https://www.ifixit.com/Teardown), Apple product page cutaways, "How It's Made".

## Why This Matters to the Learner
"I make videos about how rockets and factories work. This is the same curiosity for the stuff on your desk, in one tap."

## What "Working" Looks Like
Upload a photo of headphones. Within a few seconds the photo gets 4 to 10 numbered callouts that sit on the right parts, a part list appears beside it, tapping "driver" opens a card with material, process, confidence and a fun fact, and below sits a 4 to 6 step journey from raw material to desk. The "oh, that's cool" beat is the callouts drawing in one after another on your own photo.

## The POC Boundary
- One page, one action: photo in, labelled breakdown out.
- Vision model returns structured JSON: object name, parts with approximate boxes, material, process, confidence, fun fact, plus the journey.
- Callouts on the photo, part list, part card, journey timeline.
- Confidence label per part, "best guess" wording below 0.6.
- Five example photos with cached results so it can be tried with no upload.

## Later
- Compare two products side by side.
- Shareable result link and share card image.
- Sustainability or recyclability score per part.
- Exploded view animation that pulls parts apart.

## Explicitly Cut
- Accounts and saved history: nothing to prove the kernel, adds auth.
- A database: results live in the page; examples are static JSON files.
- Chat follow-up questions: turns it back into a chatbot, the kernel is visual.
- Pixel accurate segmentation: boxes are approximate and labelled as such; real segmentation is a separate model and a week of work.
- Prices, suppliers, where to buy: different product.
