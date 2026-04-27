declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type DialogueId = Brand<string, "DialogueId">;
export type CharacterId = Brand<string, "CharacterId">;
export type UserId = Brand<string, "UserId">;

// Branding constructors — the ONLY place where `as` is acceptable.
// Used at system boundaries: DB results, route params, auth tokens.
export const toDialogueId = (id: string) => id as DialogueId;
export const toCharacterId = (id: string) => id as CharacterId;
export const toUserId = (id: string) => id as UserId;
