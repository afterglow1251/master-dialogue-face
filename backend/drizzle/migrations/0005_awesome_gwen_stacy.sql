ALTER TABLE "dialogue_turns" ADD COLUMN "role" varchar(16) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "dialogue_turns" ADD COLUMN "analysis_text" text;