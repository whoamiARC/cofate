DROP INDEX IF EXISTS `session_choice_unique`;
--> statement-breakpoint
CREATE UNIQUE INDEX `session_choice_unique` ON `session_entries` (`session_id`,`member_id`,`turn`,`kind`) WHERE "session_entries"."kind" = 'choice';
