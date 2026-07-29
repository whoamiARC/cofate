CREATE TABLE `session_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`member_id` text,
	`turn` integer NOT NULL,
	`kind` text NOT NULL,
	`author` text NOT NULL,
	`content` text NOT NULL,
	`meta_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_members` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`player_token` text NOT NULL,
	`name` text NOT NULL,
	`role_json` text,
	`is_host` integer NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_members_player_token_unique` ON `session_members` (`player_token`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`theme` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`max_players` integer NOT NULL,
	`host_member_id` text NOT NULL,
	`world_json` text,
	`turn` integer NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_code_unique` ON `sessions` (`code`);