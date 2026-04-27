import {
  createClerkClient,
  verifyToken as clerkVerifyToken,
} from "@clerk/backend";

import { config } from "../config.ts";

const clerkClient = createClerkClient({
  secretKey: config.clerk.secretKey,
  publishableKey: config.clerk.publishableKey,
});

/**
 * Verifies a raw Clerk JWT token string.
 * Returns the Clerk userId (sub) if valid, null otherwise.
 */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const payload = await clerkVerifyToken(token, {
      secretKey: config.clerk.secretKey,
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Verifies a Clerk session token from Authorization header.
 * Returns the userId (sub) if valid, null otherwise.
 */
export async function verifyRequest(request: Request): Promise<string | null> {
  try {
    // Clone request to avoid "ReadableStream already used" error
    // when Elysia has already consumed the body
    const cloneReq = new Request(request.url, {
      method: request.method,
      headers: request.headers,
    });
    const result = await clerkClient.authenticateRequest(cloneReq);
    const authObject = result.toAuth();
    return authObject?.userId ?? null;
  } catch (err) {
    console.error("[auth] Clerk verification failed:", err);
    return null;
  }
}
