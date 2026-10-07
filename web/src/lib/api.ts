import type { Teardown, Usage } from './types';

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

export type TeardownResponse = { result: Teardown; usage: Usage; attempts: number; ms: number };

export async function requestTeardown(base64: string): Promise<TeardownResponse> {
  let res: Response;
  try {
    res = await fetch(`${API}/api/teardown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, format: 'jpeg' })
    });
  } catch {
    throw new Error('The model did not answer. Try again or pick an example.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('The model did not answer. Try again or pick an example.');
  return json as TeardownResponse;
}
