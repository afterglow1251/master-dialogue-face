import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";

import { config } from "../config.ts";
import { db } from "../db/index.ts";
import { characters, emotionTemplates } from "../db/schema.ts";
import { resolveUserId } from "./auth-middleware.ts";
import * as dialogueService from "../services/dialogue.service.ts";
import { toCharacterId, toDialogueId, toUserId } from "../types/index.ts";
import { HttpError } from "../utils/errors.ts";

// ── Public routes (no auth) ──
const publicRoutes = new Elysia({ prefix: "/api/v1" })
  .get("/health", () => {
    return {
      status: "ok",
      emotionModel: config.emotion.model,
      llmModel: config.llm.model,
    };
  })

  .get("/characters", async () => {
    return db.select().from(characters);
  })

  .get("/emotion-templates", async () => {
    return db.select().from(emotionTemplates);
  })

  .get(
    "/emotion-templates/:name",
    async ({ params }) => {
      const [row] = await db
        .select()
        .from(emotionTemplates)
        .where(eq(emotionTemplates.emotionName, params.name));
      if (!row) throw new HttpError(404, "Emotion template not found");
      return row;
    },
    { params: t.Object({ name: t.String() }) },
  );

// ── Protected routes (auth required) ──
const protectedRoutes = new Elysia({ prefix: "/api/v1" })
  .derive(async ({ request }) => {
    const userId = await resolveUserId(request);
    return { userId };
  })

  // ── Dialogues ──
  .post(
    "/dialogues",
    async ({ userId, body }) => {
      const dialogue = await dialogueService.createDialogue(
        toUserId(userId),
        toCharacterId(body.characterId),
        body.title,
      );
      if (!dialogue) throw new Error("Failed to create dialogue");
      return dialogue;
    },
    {
      body: t.Object({
        characterId: t.String(),
        title: t.Optional(t.String()),
      }),
    },
  )

  .get("/dialogues", async ({ userId }) => {
    return dialogueService.getDialoguesByUser(toUserId(userId));
  })

  .get(
    "/dialogues/:id",
    async ({ params, userId }) => {
      const dialogueId = toDialogueId(params.id);
      await dialogueService.verifyDialogueOwnership(
        dialogueId,
        toUserId(userId),
      );
      const result = await dialogueService.getDialogueWithTurns(dialogueId);
      if (!result) throw new HttpError(404, "Dialogue not found");
      return result;
    },
    { params: t.Object({ id: t.String() }) },
  )

  .patch(
    "/dialogues/:id",
    async ({ params, body, userId }) => {
      const dialogueId = toDialogueId(params.id);
      await dialogueService.verifyDialogueOwnership(
        dialogueId,
        toUserId(userId),
      );
      const updated = await dialogueService.updateDialogueTitle(
        dialogueId,
        body.title,
      );
      if (!updated) throw new HttpError(404, "Dialogue not found");
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) }),
    },
  )

  .delete(
    "/dialogues/:id",
    async ({ params, userId }) => {
      const dialogueId = toDialogueId(params.id);
      await dialogueService.verifyDialogueOwnership(
        dialogueId,
        toUserId(userId),
      );
      await dialogueService.deleteDialogue(dialogueId);
      return { success: true };
    },
    { params: t.Object({ id: t.String() }) },
  )

  // ── Dialogue Turns (sync mode) ──
  .post(
    "/dialogues/:id/turns",
    async ({ params, body, userId }) => {
      const dialogueId = toDialogueId(params.id);
      await dialogueService.verifyDialogueOwnership(
        dialogueId,
        toUserId(userId),
      );
      const { turn, analysis, blendshapes, mood, combinedEmotions } =
        await dialogueService.analyzeAndSaveTurn({
          dialogueId,
          role: "user",
          text: body.text,
          analysisText: body.text,
          moodReactivity: config.mood.defaultReactivity,
          moodDecaySeconds: config.mood.defaultDecaySeconds,
          emotionWeight: config.mood.defaultEmotionWeight,
        });

      return {
        turn,
        emotions: analysis.emotions,
        blendshapes,
        mood,
        combinedEmotions,
      };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ text: t.String({ minLength: 1 }) }),
    },
  );

export const restRoutes = new Elysia().use(publicRoutes).use(protectedRoutes);
