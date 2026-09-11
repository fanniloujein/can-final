CREATE TABLE `adminInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(160),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminInvites_email_unique` UNIQUE(`email`)
);
