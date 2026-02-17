CREATE TABLE `rate_limits` (
	`ip` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`window_start` text NOT NULL
);
