import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { BlendshapeVector } from "@shared/types/blendshape.ts";
import type { EmotionProbabilities, VADValues } from "@shared/types/emotion.ts";
import type { TurnRole } from "@shared/types/speech.ts";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  displayName: varchar("display_name", { length: 200 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const emotionTemplates = pgTable("emotion_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  emotionName: varchar("emotion_name", { length: 50 }).notNull().unique(),
  blendshapeVector: jsonb("blendshape_vector")
    .$type<BlendshapeVector>()
    .notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const characters = pgTable("characters", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  modelUrl: varchar("model_url", { length: 500 }).notNull(),
  description: text("description"),
  expressionMultiplier: real("expression_multiplier").default(1.0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dialogues = pgTable(
  "dialogues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    characterId: uuid("character_id")
      .references(() => characters.id)
      .notNull(),
    title: varchar("title", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("dialogues_user_id_idx").on(table.userId)],
);

export const dialogueTurns = pgTable(
  "dialogue_turns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dialogueId: uuid("dialogue_id")
      .references(() => dialogues.id, { onDelete: "cascade" })
      .notNull(),
    turnIndex: integer("turn_index").notNull(),
    role: varchar("role", { length: 16 })
      .$type<TurnRole>()
      .default("user")
      .notNull(),
    text: text("text").notNull(),
    analysisText: text("analysis_text"),
    emotionProbabilities: jsonb(
      "emotion_probabilities",
    ).$type<EmotionProbabilities>(),
    vadValues: jsonb("vad_values").$type<VADValues>(),
    blendshapeVector: jsonb("blendshape_vector").$type<BlendshapeVector>(),
    processingTimeMs: real("processing_time_ms"),
    moodVadSnapshot: jsonb("mood_vad_snapshot").$type<VADValues>(),
    combinedProbabilities: jsonb(
      "combined_probabilities",
    ).$type<EmotionProbabilities>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("dialogue_turns_dialogue_id_idx").on(table.dialogueId)],
);

export const dialogueMoodStates = pgTable("dialogue_mood_states", {
  id: uuid("id").defaultRandom().primaryKey(),
  dialogueId: uuid("dialogue_id")
    .references(() => dialogues.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  moodValence: real("mood_valence").default(0.5).notNull(),
  moodArousal: real("mood_arousal").default(0.3).notNull(),
  moodDominance: real("mood_dominance").default(0.5).notNull(),
  turnCount: integer("turn_count").default(0).notNull(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
