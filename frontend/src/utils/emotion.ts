import type { EmotionProbabilities, EmotionScore } from "@shared/types/emotion";

export function toTopEmotions(
  categories: EmotionProbabilities,
  limit = 5,
): EmotionScore[] {
  return Object.entries(categories)
    .map(([name, probability]) => ({
      name: name as EmotionScore["name"],
      probability,
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, limit);
}
