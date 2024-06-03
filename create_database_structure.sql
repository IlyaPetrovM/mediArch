/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `time_upload` datetime DEFAULT current_timestamp(),
  `date_created` datetime DEFAULT NULL,
  `date_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `oldName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileExt` char(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filetype` char(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preview` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT '',
  `recognizedText` text COLLATE utf8mb4_unicode_ci DEFAULT '',
  `recognitionStatus` char(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Ещё не распознан',
  `hashsum` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exif` longblob DEFAULT NULL COMMENT 'метаданные для фотографий',
  `duration_ms` int(11) DEFAULT NULL,
  `operator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'кто создал медиафайл',
  `gps_str` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `informants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `last_name` varchar(512) DEFAULT '',
  `first_name` varchar(512) DEFAULT '',
  `middle_name` varchar(512) DEFAULT '',
  `birthYear` year(4) DEFAULT NULL,
  `birth` datetime DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `contacts` varchar(255) DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `hide` char(1) DEFAULT NULL,
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
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`) USING BTREE,
  KEY `start_time` (`start_time`),
  FULLTEXT KEY `tags` (`tags`),
  FULLTEXT KEY `decription_of_file` (`describtion`),
  CONSTRAINT `marks_to_files_constr` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
