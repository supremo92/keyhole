CREATE TABLE `doors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`colour` text NOT NULL,
	`floor` integer DEFAULT 0 NOT NULL,
	`side` text DEFAULT 'front' NOT NULL,
	`door_slot` integer NOT NULL,
	`design` text NOT NULL,
	`wallpaper` text NOT NULL,
	`carpet_colour` text NOT NULL,
	`window_layout` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doors_user_id_floor_side_door_slot_unique` ON `doors` (`user_id`,`floor`,`side`,`door_slot`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`door_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body_front` text,
	`body_back` text,
	`colour` text NOT NULL,
	`design` text NOT NULL,
	`furniture` text NOT NULL,
	`room_slot` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`door_id`) REFERENCES `doors`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_door_id_room_slot_unique` ON `notes` (`door_id`,`room_slot`);