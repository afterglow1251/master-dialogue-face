import { eq } from "drizzle-orm";

import { verifyRequest } from "../services/auth.ts";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { HttpError } from "../utils/errors.ts";

/**
 * Resolves a Clerk external userId to an internal database userId.
 * Creates a user record in DB if it doesn't exist (upsert).
 */
export async function resolveUserIdFromClerkId(
  clerkUserId: string,
): Promise<string> {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUserId));

  if (existingUser) {
    return existingUser.id;
  }

  const [newUser] = await db
    .insert(users)
    .values({ clerkId: clerkUserId })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser.id;
}

/**
 * Verifies Clerk session token from Authorization header
 * and resolves internal userId.
 */
export async function resolveUserId(request: Request): Promise<string> {
  const clerkUserId = await verifyRequest(request);

  if (!clerkUserId) {
    throw new HttpError(401, "Unauthorized");
  }

  return resolveUserIdFromClerkId(clerkUserId);
}
