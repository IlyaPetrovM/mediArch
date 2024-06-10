/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `preview` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT '',
  `recognizedText` text COLLATE utf8mb4_unicode_ci DEFAULT '',
  `recognitionStatus` char(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Ещё не распознан',
  `operator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'кто создал медиафайл',
  `date_upload_UTC` datetime DEFAULT NULL COMMENT 'локальное время сервера!',
  `date_upload_timezone` char(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_updated_UTC` datetime DEFAULT NULL COMMENT 'локальное время сервера!',
  `date_updated_timezone` char(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'in +hh:mm format i.e.: +03:00',
  `oldName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileExt` char(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filetype` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_created_UTC` datetime DEFAULT NULL,
  `file_created_LOCAL` datetime DEFAULT NULL,
  `file_updated_LOCAL` datetime DEFAULT NULL,
  `date_created_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'на основе каких данных нам известна дата',
  `hash_sha256` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exif` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'метаданные для фотографий' CHECK (json_valid(`exif`)),
  `deviceModel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_ms` int(11) DEFAULT NULL,
  `gps_str` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `informants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) DEFAULT NULL,
  `first_name` varchar(512) DEFAULT '',
  `middle_name` varchar(512) DEFAULT '',
  `last_name` varchar(512) DEFAULT '',
  `last_name_at_birth` varchar(512) DEFAULT '',
  `birthYear` year(4) DEFAULT NULL,
  `birth` date DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `contacts` varchar(255) DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `hide` int(1) DEFAULT 0,
  `reporter` varchar(512) DEFAULT NULL,
  `date_updated` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `user_created` char(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `interfaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tableName` char(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `col` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `editorHtml` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viewHtml` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `marks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_time` time DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `describtion` text DEFAULT NULL,
  `file_id` int(11) NOT NULL,
  `hide` char(1) NOT NULL DEFAULT '',
  `time_msec` int(11) DEFAULT 0,
  `recognition0` text DEFAULT NULL,
  `recognition1` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`) USING BTREE,
  KEY `start_time` (`start_time`),
  FULLTEXT KEY `tags` (`tags`),
  FULLTEXT KEY `decription_of_file` (`describtion`),
  CONSTRAINT `marks_to_files_constr` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DELIMITER //
CREATE FUNCTION `getServerTimezone`() RETURNS char(6) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci
    NO SQL
BEGIN
   IF (NOW() >= UTC_TIMESTAMP) THEN
      return CONCAT('+', SUBSTRING_INDEX(TIMEDIFF(NOW(), UTC_TIMESTAMP), ':', 2));
   ELSE
        return CONCAT('-', SUBSTRING_INDEX(TIMEDIFF(UTC_TIMESTAMP, NOW()), ':', 2));
   END IF;
END//
DELIMITER ;

SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `files_insert` BEFORE INSERT ON `files` FOR EACH ROW BEGIN
   SET NEW.date_upload_UTC = UTC_TIMESTAMP();
   SET NEW.date_updated_UTC = UTC_TIMESTAMP();
    SET NEW.date_updated_timezone = getServerTimezone();
   SET NEW.date_upload_timezone = getServerTimezone();
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `files_update` BEFORE UPDATE ON `files` FOR EACH ROW BEGIN
   SET NEW.date_updated_timezone = getServerTimezone();
   SET NEW.date_updated_UTC = UTC_TIMESTAMP();
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
