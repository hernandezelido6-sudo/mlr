CREATE TABLE `quote_requests` (
	`id` varchar(36) NOT NULL,
	`ownerId` int NOT NULL,
	`nameCiphertext` text NOT NULL,
	`phoneCiphertext` text NOT NULL,
	`emailCiphertext` text NOT NULL,
	`originCiphertext` text NOT NULL,
	`destinationCiphertext` text NOT NULL,
	`detailsCiphertext` text NOT NULL,
	`cargo` varchar(80) NOT NULL,
	`status` enum('new','reviewing','closed') NOT NULL DEFAULT 'new',
	`requestFingerprint` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `quote_requests` ADD CONSTRAINT `quote_requests_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `quote_owner_created_idx` ON `quote_requests` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `quote_fingerprint_created_idx` ON `quote_requests` (`requestFingerprint`,`createdAt`);