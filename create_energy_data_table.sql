CREATE TABLE IF NOT EXISTS `energy_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) NOT NULL,
  `home_id` int(11) NOT NULL,
  `address` int(11) NOT NULL,
  `frequency` float DEFAULT NULL,
  `voltage` float DEFAULT NULL,
  `current` float DEFAULT NULL,
  `active_power` float DEFAULT NULL,
  `reactive_power` float DEFAULT NULL,
  `apparent_power` float DEFAULT NULL,
  `power_factor` float DEFAULT NULL,
  `active_energy` float DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_device_address_created` (`device_id`, `address`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
