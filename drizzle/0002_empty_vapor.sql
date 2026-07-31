CREATE TABLE `daily_custom_usage` (
	`device_id` text NOT NULL,
	`usage_day` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`device_id`, `usage_day`)
);
