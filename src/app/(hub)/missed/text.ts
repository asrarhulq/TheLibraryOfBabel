// Share wording, shared by the client share block and the server result page.
export function resultText(countAnswer: number, identified: boolean, seconds: number) {
  return identified
    ? `I counted ${countAnswer} bounces and spotted the surprise. Can you?`
    : `I counted ${countAnswer} bounces. I missed the magenta star that crossed the screen for ${seconds} seconds.`;
}
export const CHALLENGE_TEXT = "A 90-second attention test: can you count the bounces? Watch closely.";
