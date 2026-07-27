CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`world_id` text NOT NULL,
	`participant_id` text,
	`author` text NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`world_id`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`world_id` text NOT NULL,
	`name` text NOT NULL,
	`emoji` text NOT NULL,
	`identity` text NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`world_id`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `worlds` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`vibe` text NOT NULL,
	`prompt` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `worlds_code_unique` ON `worlds` (`code`);