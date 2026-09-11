CREATE TABLE `heroSlides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`subtitle` text NOT NULL,
	`imageUrl` text NOT NULL,
	`eyebrow` varchar(160) NOT NULL DEFAULT 'Sélection professionnelle',
	`ctaLabel` varchar(120) NOT NULL DEFAULT 'Découvrir',
	`ctaUrl` varchar(500) NOT NULL DEFAULT '/products',
	`status` enum('draft','published') NOT NULL DEFAULT 'published',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `heroSlides_id` PRIMARY KEY(`id`)
);
