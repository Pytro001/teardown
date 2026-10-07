// One call to Claude on Amazon Bedrock (Converse API) with the photo and a forced tool,
// so the answer always comes back as structured JSON.
import { teardownSchema, TOOL_NAME, validateTeardown } from './schema.mjs';

const SYSTEM = `You are Teardown, a manufacturing engineer who explains how everyday objects are made.
You look at one photo and report the main parts of the main object: what each part is made of and how it is manufactured.
Rules:
- Report 4 to 10 parts. Prefer parts a curious person would point at; include one or two important hidden parts (motor, driver, PCB, heating element, battery) when the object surely has them, with internal=true and a box where they sit.
- Boxes are approximate, normalised 0 to 1 from the top-left of the image. Make each box tight around the part as it appears in this photo.
- Be specific about materials, and honest about uncertainty: confidence below 0.6 means it is a best guess.
- Fun facts must be true and specific, no fluff.
- The journey goes from raw material to the buyer's desk in 4 to 6 steps.
- Plain words, no marketing language, no dashes as punctuation.
- If the photo has no single physical product, set object to "none" and leave parts and journey empty.
Always answer by calling the ${TOOL_NAME} tool.`;

const PRICE_IN = 3 / 1e6;   // USD per input token, Claude Sonnet 4.5 list price
const PRICE_OUT = 15 / 1e6; // USD per output token

function endpoint() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const model = process.env.BEDROCK_CLAUDE_MODEL || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';
  return `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(model)}/converse`;
}

async function converse(base64, format, extraNote) {
  const token = process.env.AWS_BEARER_TOKEN_BEDROCK;
  if (!token) throw Object.assign(new Error('AWS_BEARER_TOKEN_BEDROCK is not set'), { status: 503 });
  const text = 'Tear this object down.' + (extraNote ? `\n\nYour previous answer broke these rules, fix them:\n${extraNote}` : '');
  const body = {
    system: [{ text: SYSTEM }],
    messages: [{ role: 'user', content: [{ image: { format, source: { bytes: base64 } } }, { text }] }],
    toolConfig: {
      tools: [{ toolSpec: { name: TOOL_NAME, description: 'Report the teardown of the object in the photo.', inputSchema: { json: teardownSchema } } }],
      toolChoice: { tool: { name: TOOL_NAME } }
    },
    inferenceConfig: { maxTokens: 3000, temperature: 0.2 }
  };
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(`Bedrock ${res.status}: ${json.message || 'error'}`), { status: 502 });
  const tool = (json.output?.message?.content || []).find((c) => c.toolUse)?.toolUse;
  return { input: tool?.input, usage: json.usage || {} };
}

/** Analyse one image. Validates the answer and retries once with the errors if it breaks the rules. */
export async function analyzeImage(base64, format = 'jpeg') {
  const usage = { inputTokens: 0, outputTokens: 0 };
  let note = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { input, usage: u } = await converse(base64, format, note);
    usage.inputTokens += u.inputTokens || 0;
    usage.outputTokens += u.outputTokens || 0;
    const { value, errors } = validateTeardown(input);
    if (value) {
      usage.costUsd = +(usage.inputTokens * PRICE_IN + usage.outputTokens * PRICE_OUT).toFixed(5);
      return { result: value, usage, attempts: attempt };
    }
    note = errors.slice(0, 12).join('\n');
  }
  throw Object.assign(new Error('The model answer did not pass validation twice: ' + note), { status: 502 });
}
