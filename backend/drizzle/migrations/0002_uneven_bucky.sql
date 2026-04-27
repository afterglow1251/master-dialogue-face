CREATE INDEX "dialogue_turns_dialogue_id_idx" ON "dialogue_turns" USING btree ("dialogue_id");--> statement-breakpoint
CREATE INDEX "dialogues_user_id_idx" ON "dialogues" USING btree ("user_id");