import { describe, expect, test } from "bun:test";

import {
  createReplyParser,
  parseReplyLine,
} from "../../src/utils/reply-format.ts";

describe("parseReplyLine", () => {
  test("parses user translation line", () => {
    expect(parseReplyLine("USER: You are good")).toEqual({
      type: "user_translation",
      analysisText: "You are good",
    });
  });

  test("parses sentence with translation", () => {
    expect(parseReplyLine("SAY: Дякую! ||| Thank you!")).toEqual({
      type: "sentence",
      text: "Дякую!",
      analysisText: "Thank you!",
    });
  });

  test("falls back to original text when translation is missing", () => {
    expect(parseReplyLine("SAY: Hello there.")).toEqual({
      type: "sentence",
      text: "Hello there.",
      analysisText: "Hello there.",
    });
  });

  test("treats unprefixed text as a sentence", () => {
    expect(parseReplyLine("Привіт ||| Hi")).toEqual({
      type: "sentence",
      text: "Привіт",
      analysisText: "Hi",
    });
  });

  test("ignores empty lines and empty payloads", () => {
    expect(parseReplyLine("   ")).toBeNull();
    expect(parseReplyLine("USER:")).toBeNull();
    expect(parseReplyLine("SAY: ||| Hi")).toBeNull();
  });
});

describe("createReplyParser", () => {
  test("emits events only for completed lines across chunks", () => {
    const parser = createReplyParser();

    expect(parser.push("USER: Hel")).toEqual([]);
    expect(parser.push("lo\nSAY: Прив")).toEqual([
      { type: "user_translation", analysisText: "Hello" },
    ]);
    expect(parser.push("іт! ||| Hi!\nSAY: Як ти?")).toEqual([
      { type: "sentence", text: "Привіт!", analysisText: "Hi!" },
    ]);
    expect(parser.flush()).toEqual([
      { type: "sentence", text: "Як ти?", analysisText: "Як ти?" },
    ]);
    expect(parser.flush()).toEqual([]);
  });
});
