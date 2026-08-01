CREATE TABLE `session_role_claims` (
	`session_id` text NOT NULL,
	`role_id` text NOT NULL,
	`member_id` text NOT NULL,
	`selected_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `role_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `session_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_role_claims_member_id_unique` ON `session_role_claims` (`member_id`);