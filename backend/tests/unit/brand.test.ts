import { describe, expect, test } from "bun:test";

import {
  toDialogueId,
  toCharacterId,
  toUserId,
} from "../../src/types/brand.ts";

describe("branded type constructors", () => {
  test("toDialogueId preserves value", () => {
    const id = toDialogueId("abc-123");
    expect(id).toBe("abc-123");
  });

  test("toCharacterId preserves value", () => {
    const id = toCharacterId("char-456");
    expect(id).toBe("char-456");
  });

  test("toUserId preserves value", () => {
    const id = toUserId("user-789");
    expect(id).toBe("user-789");
  });

  test("branded types are strings at runtime", () => {
    const id = toDialogueId("test");
    expect(typeof id).toBe("string");
  });

  test("empty string is valid branded value", () => {
    const id = toDialogueId("");
    expect(id).toBe("");
  });
});
