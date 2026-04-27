CREATE TABLE "dialogue_mood_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dialogue_id" uuid NOT NULL,
	"mood_valence" real DEFAULT 0.5 NOT NULL,
	"mood_arousal" real DEFAULT 0.3 NOT NULL,
	"mood_dominance" real DEFAULT 0.5 NOT NULL,
	"turn_count" integer DEFAULT 0 NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dialogue_mood_states_dialogue_id_unique" UNIQUE("dialogue_id")
);
--> statement-breakpoint
ALTER TABLE "dialogue_turns" ADD COLUMN "mood_vad_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "dialogue_turns" ADD COLUMN "combined_probabilities" jsonb;--> statement-breakpoint
ALTER TABLE "dialogue_mood_states" ADD CONSTRAINT "dialogue_mood_states_dialogue_id_dialogues_id_fk" FOREIGN KEY ("dialogue_id") REFERENCES "public"."dialogues"("id") ON DELETE cascade ON UPDATE no action;