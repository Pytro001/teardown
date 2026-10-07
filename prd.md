---
doc: prd
status: approved
---

# Teardown, Product Requirements

A one page web app for curious people: drop in a photo of an everyday object and see its parts called out on the photo, with material, manufacturing process and a raw-material-to-desk journey.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

## The Core Journey
1. The visitor opens the page and sees a large drop zone on a dark stage, one headline, and a row of five example objects.
2. They drop a photo, pick one with the file picker, take one with the phone camera, or click an example.
3. The photo appears full size on the stage with a scanning sweep while the model works.
4. Numbered dots with leader lines draw onto the photo one after another, each ending in a short label. The object name appears above the photo.
5. A numbered part list fills in on the right, in the same order.
6. They click or tap a part (on the photo or in the list). The matching callout highlights, the others dim, and a card opens: material, manufacturing process, confidence label, one fun fact.
7. Below the stage, the "How it is made" timeline shows 4 to 6 steps from raw material to desk.
8. They pick another object and the loop repeats. Success is the moment the callouts land on their own object.

## Screens and Layout
One screen.
- **Header:** product name and a one line promise.
- **Stage (left, about two thirds wide):** the drop zone, then the photo with the overlay.
- **Side panel (right):** object name, part list, part card.
- **Example row:** five thumbnails under the stage, "Try an example".
- **Timeline:** full width below, horizontal steps.
On phones the panel stacks under the photo.

## Look and Feel
Dark studio: near black background with a soft vignette, the photo as the hero. White hairline leader lines, numbered dots, one amber accent for the active part. Clean grotesk for text, mono for numbers and confidence. Calm motion: lines draw in, nothing bounces. Avoid generic purple gradients and chat bubbles. Reference: iFixit teardowns, Apple product cutaways.

## Features and Behavior

### Photo input
- [ ] Drag and drop a JPG, PNG or WEBP onto the stage.
- [ ] Click the stage or press Enter on it to open the file picker; on phones the picker offers the camera.
- [ ] Click an example thumbnail to load that object and its saved result.

### The breakdown overlay
- [ ] Each part shows a numbered dot at its approximate location, a leader line, and a label.
- [ ] Callouts draw in one after another, not all at once.
- [ ] Labels never leave the photo area; they sit on the side of the photo nearest their dot.

### Part list and part card
- [ ] Part list shows every part, numbered to match the photo.
- [ ] Selecting a part (click, tap, or keyboard) highlights its callout and opens its card.
- [ ] Card shows material, process, confidence as a word and number, and a fun fact.
- [ ] Confidence under 0.6 reads "best guess"; 0.6 to 0.8 "likely"; above 0.8 "confident".

### How it is made
- [ ] 4 to 6 steps, raw material to desk, each with a short title and one line.
- [ ] Steps appear after the callouts finish.

### Honesty
- [ ] A visible note says the breakdown is an AI estimate from one photo, positions are approximate.

## States and Boundaries
- **First use:** drop zone with headline and example row. No empty panel.
- **Working:** photo shown with scanning sweep and "Looking inside..." status.
- **Success:** callouts, list, timeline.
- **Error, not an object or no parts found:** plain message over the photo, "Could not find parts in this photo. Try one object, close up, good light.", and the examples stay usable.
- **Error, server or network:** "The model did not answer. Try again or pick an example."
- **File too big or wrong type:** message before upload; images are scaled down in the browser first.
- **Persistence:** none. Reloading returns to the first screen.

## Product Decisions
- Confidence label is a feature, not a footnote (asked "what if the model is wrong").
- Examples have saved results, so the page works instantly and the film is repeatable.
- No accounts, no history, no chat.

## What We're Building
Photo input, the vision call with structured output, the animated overlay, the part list and card, the journey timeline, the five examples, the error states.

## Deferred From the POC
- Share link and share image: needs storage for results.
- Compare two objects: second layout.

## Possible Later Enhancements
Sustainability score per part. Exploded view animation. Bill of materials export.

## Non-Goals
- Exact part outlines (segmentation): needs a different model.
- Prices and suppliers.
- Repair guides.

## Open Questions
- Are model bounding boxes good enough for dot placement? Investigate during build (can wait).
