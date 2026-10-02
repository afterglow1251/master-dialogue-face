// crypto.randomUUID() exists only in secure contexts (HTTPS or localhost),
// so it is undefined when the app is served over plain HTTP by IP address.
// crypto.getRandomValues() works everywhere and is backed by the same CSPRNG;
// the backend only matches request ids, it does not require UUID format.
export function randomId(): string {
  const ID_BYTES = 16;
  const bytes = crypto.getRandomValues(new Uint8Array(ID_BYTES));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
