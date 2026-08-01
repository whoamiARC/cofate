CREATE TABLE `player_profiles` (
	`device_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`games_played` integer DEFAULT 0 NOT NULL,
	`goals_completed` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_member_profiles` (
	`member_id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `session_members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `player_profiles`(`device_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_results` (
	`session_id` text NOT NULL,
	`member_id` text NOT NULL,
	`result_json` text NOT NULL,
	`xp_earned` integer NOT NULL,
	`points_earned` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`session_id`, `member_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `session_members`(`id`) ON UPDATE no action ON DELETE cascade
);
