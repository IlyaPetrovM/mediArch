-- --------------------------------------------------------
-- Хост:                         127.0.0.1
-- Версия сервера:               10.5.10-MariaDB - mariadb.org binary distribution
-- Версия программы:             mediArch 0.0.5
-- Операционная система:         Win64
-- HeidiSQL Версия:              11.2.0.6213
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Дамп структуры базы данных test_file_uploader
CREATE DATABASE IF NOT EXISTS `test_file_uploader` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `test_file_uploader`;

-- Дамп структуры для таблица test_file_uploader.files
CREATE TABLE IF NOT EXISTS `files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `time_upload` datetime DEFAULT current_timestamp(),
  `oldName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filetype` char(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preview` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы test_file_uploader.files: ~26 rows (приблизительно)
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
/*!40000 ALTER TABLE `files` ENABLE KEYS */;

-- Дамп структуры для таблица test_file_uploader.interfaces
CREATE TABLE IF NOT EXISTS `interfaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tableName` char(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `col` char(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `editorHtml` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `viewHtml` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Дамп данных таблицы test_file_uploader.interfaces: ~7 rows (приблизительно)
/*!40000 ALTER TABLE `interfaces` DISABLE KEYS */;
INSERT IGNORE INTO `interfaces` (`id`, `tableName`, `col`, `editorHtml`, `viewHtml`) VALUES
	(0, '__default', '__default', '<div> ${value} </div>', '<div> ${value} </div>  '),
	(1, 'files', 'oldName', '<input value=${value} >', '<div>${value}</div>'),
	(2, 'files', 'id', '<b> ${value} </b>', '<b> ${value} </b>'),
	(3, 'files', 'name', '<input value=${value} >', '<div>${value}</div>'),
	(4, 'files', 'preview', NULL, '<img src=\'uploads/${data.oldName}\' class=preview>'),
	(5, 'files', 'description', '<textarea>${value}', '<div> ${value} </div>'),
	(6, 'files', 'watchBtn', '', '<button onclick=watch(\'uploads/${data.oldName}\')>Смотреть </button> ');
/*!40000 ALTER TABLE `interfaces` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
