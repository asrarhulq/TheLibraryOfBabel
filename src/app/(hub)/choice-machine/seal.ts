import { SIDE_NAME, type Side } from "@/lib/choice-machine/predictor";

export interface Seal {
  side: Side;
  salt: string;
  hash: string;
}

/** The text that is hashed for the seal. Shown in full at the end so anyone can check it. */
export const commitText = (salt: string, side: Side) => `choice-machine:${salt}:${SIDE_NAME[side]}`;

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
