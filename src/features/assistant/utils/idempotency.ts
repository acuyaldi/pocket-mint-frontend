/** Generates the `Idempotency-Key` header value required by `POST /assistant/drafts/:draftId/confirm`. */
export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}
