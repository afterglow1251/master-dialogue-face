import { describe, expect, test } from "bun:test";

import { config } from "../../src/config.ts";

describe("config", () => {
  test("port is a number", () => {
    expect(typeof config.port).toBe("number");
    expect(config.port).toBeGreaterThan(0);
  });

  test("databaseUrl is a non-empty string", () => {
    expect(typeof config.databaseUrl).toBe("string");
    expect(config.databaseUrl.length).toBeGreaterThan(0);
  });

  test("external service timeouts are positive numbers", () => {
    expect(config.emotion.timeoutMs).toBeGreaterThan(0);
    expect(config.tts.timeoutMs).toBeGreaterThan(0);
  });

  test("llm settings are valid", () => {
    expect(config.llm.model.length).toBeGreaterThan(0);
    expect(config.llm.maxTokens).toBeGreaterThan(0);
    expect(config.llm.historyTurns).toBeGreaterThan(0);
  });

  test("ws defaults are valid", () => {
    expect(config.ws.defaultExpressionIntensity).toBeGreaterThanOrEqual(0);
    expect(config.ws.maxExpressionIntensity).toBeGreaterThan(0);
  });

  test("clerk keys are non-empty strings", () => {
    expect(config.clerk.secretKey.length).toBeGreaterThan(0);
    expect(config.clerk.publishableKey.length).toBeGreaterThan(0);
  });
});
