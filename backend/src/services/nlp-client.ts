import { config } from "../config.ts";
import {
  isEmotionAnalysisResult,
  type EmotionAnalysisResult,
} from "../types/index.ts";

interface AnalyzeRequest {
  readonly text: string;
  readonly context: readonly string[];
}

interface NlpHealthResponse {
  readonly status: string;
  readonly model_loaded: boolean;
  readonly device: string;
}

const NLP_PATHS = {
  analyze: "/api/v1/analyze",
  health: "/api/v1/health",
} as const;

class NlpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async analyze(
    text: string,
    context: readonly string[],
  ): Promise<EmotionAnalysisResult> {
    const body: AnalyzeRequest = { text, context };

    const response = await fetch(`${this.baseUrl}${NLP_PATHS.analyze}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(config.nlp.analyzeTimeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NLP service error (${response.status}): ${errorText}`);
    }

    const json: unknown = await response.json();
    if (!isEmotionAnalysisResult(json)) {
      throw new Error("NLP service returned unexpected response format");
    }
    return json;
  }

  async healthCheck(): Promise<NlpHealthResponse> {
    const response = await fetch(`${this.baseUrl}${NLP_PATHS.health}`, {
      signal: AbortSignal.timeout(config.nlp.healthTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(`NLP health check failed: ${response.status}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    return {
      status: String(json.status ?? "unknown"),
      model_loaded: Boolean(json.model_loaded),
      device: String(json.device ?? "unknown"),
    };
  }
}

export const nlpClient = new NlpClient(config.nlpServiceUrl);
