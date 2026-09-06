WITH canonical AS (
	SELECT DISTINCT ON (name) name, id
	FROM characters
	ORDER BY name, created_at, id
)
UPDATE dialogues d
SET character_id = canonical.id
FROM characters dup
JOIN canonical ON canonical.name = dup.name
WHERE d.character_id = dup.id AND dup.id <> canonical.id;
--> statement-breakpoint
DELETE FROM characters
WHERE id NOT IN (
	SELECT DISTINCT ON (name) id
	FROM characters
	ORDER BY name, created_at, id
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_name_unique" UNIQUE("name");
