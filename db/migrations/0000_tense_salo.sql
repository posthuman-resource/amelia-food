CREATE TABLE `words` (
	`id` text PRIMARY KEY NOT NULL,
	`word` text NOT NULL,
	`part_of_speech` text NOT NULL,
	`pronunciation` text NOT NULL,
	`description` text NOT NULL,
	`parts` text NOT NULL,
	`literal` text NOT NULL
);
