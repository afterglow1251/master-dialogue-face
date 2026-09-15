export const MOOD_LINE_COLOR = "rgb(245, 158, 11)";
export const MOOD_FILL_COLOR = "rgba(245, 158, 11, 0.1)";
export const MOOD_HIGHLIGHT_BORDER = "rgb(180, 83, 9)";
export const POSITIVE_COLOR = "rgb(16, 185, 129)";
export const NEGATIVE_COLOR = "rgb(244, 63, 94)";
export const NEUTRAL_COLOR = "rgb(148, 163, 184)";
export const GRID_COLOR = "rgba(148, 163, 184, 0.25)";
export const AXIS_COLOR = "rgb(148, 163, 184)";

export const POSITIVE_THRESHOLD = 0.6;
export const NEGATIVE_THRESHOLD = 0.4;

export const MOOD_POINT_RADIUS = 3;
export const MOOD_HIGHLIGHT_RADIUS = 6;
export const EMOTION_POINT_RADIUS = 4;
export const TOOLTIP_TEXT_LIMIT = 60;

export interface MoodTimelineLabels {
  readonly mood: string;
  readonly positiveEmotion: string;
  readonly neutralEmotion: string;
  readonly negativeEmotion: string;
  readonly neutral: string;
}

export type ValenceTone = "positive" | "neutral" | "negative";

function emotionDataset(
  label: string,
  color: string,
  values: readonly (number | null)[],
  tone: ValenceTone,
) {
  return {
    label,
    data: values.map((value) => (valenceTone(value) === tone ? value : null)),
    showLine: false,
    borderColor: color,
    backgroundColor: color,
    pointBackgroundColor: color,
    pointBorderColor: color,
    pointRadius: EMOTION_POINT_RADIUS,
    pointHoverRadius: EMOTION_POINT_RADIUS + 2,
    fill: false,
  };
}

export function buildDatasets(
  moodValues: readonly (number | null)[],
  emotionValues: readonly (number | null)[],
  neutralValence: number,
  labels: MoodTimelineLabels,
  highlightIndex?: number,
) {
  const isHighlight = (index: number) => index === highlightIndex;
  return [
    {
      label: labels.neutral,
      data: moodValues.map(() => neutralValence),
      borderColor: NEUTRAL_COLOR,
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      pointHitRadius: 0,
      pointStyle: "line" as const,
      fill: false,
    },
    {
      label: labels.mood,
      data: [...moodValues],
      borderColor: MOOD_LINE_COLOR,
      backgroundColor: MOOD_FILL_COLOR,
      borderWidth: 2,
      tension: 0.3,
      fill: "origin" as const,
      spanGaps: true,
      pointBackgroundColor: MOOD_LINE_COLOR,
      pointBorderColor: moodValues.map((_, index) =>
        isHighlight(index) ? MOOD_HIGHLIGHT_BORDER : MOOD_LINE_COLOR,
      ),
      pointBorderWidth: moodValues.map((_, index) =>
        isHighlight(index) ? 2 : 1,
      ),
      pointRadius: moodValues.map((_, index) =>
        isHighlight(index) ? MOOD_HIGHLIGHT_RADIUS : MOOD_POINT_RADIUS,
      ),
    },
    emotionDataset(
      labels.positiveEmotion,
      POSITIVE_COLOR,
      emotionValues,
      "positive",
    ),
    emotionDataset(
      labels.neutralEmotion,
      NEUTRAL_COLOR,
      emotionValues,
      "neutral",
    ),
    emotionDataset(
      labels.negativeEmotion,
      NEGATIVE_COLOR,
      emotionValues,
      "negative",
    ),
  ];
}

export function valenceTone(value: number | null): ValenceTone {
  if (value === null) return "neutral";
  if (value >= POSITIVE_THRESHOLD) return "positive";
  if (value <= NEGATIVE_THRESHOLD) return "negative";
  return "neutral";
}

export function truncate(text: string, limit = TOOLTIP_TEXT_LIMIT): string {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return trimmed.slice(0, limit - 1) + "…";
}

export function formatVAD(value: number): string {
  return value.toFixed(3);
}

export function formatVADDelta(current: number, previous: number): string {
  const delta = Number((current - previous).toFixed(3));
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(3)}`;
}
