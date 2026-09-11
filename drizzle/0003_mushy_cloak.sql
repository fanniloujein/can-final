CREATE TABLE `managedProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(160) NOT NULL,
	`reference` varchar(80) NOT NULL,
	`category` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text NOT NULL,
	`sourceUrl` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `managedProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `managedProducts_slug_unique` UNIQUE(`slug`)
);
