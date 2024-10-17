-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for queenfood
CREATE DATABASE IF NOT EXISTS `queenfood` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `queenfood`;

-- Dumping structure for table queenfood.absen
CREATE TABLE IF NOT EXISTS `absen` (
  `id_absen` int NOT NULL AUTO_INCREMENT,
  `id_akun` int NOT NULL,
  `tanggal_absen` date DEFAULT NULL,
  `absen_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `pulang_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `detail` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_detail` int DEFAULT NULL,
  PRIMARY KEY (`id_absen`),
  KEY `absen_detail_absen_FK` (`id_detail`),
  KEY `id_akun` (`id_akun`),
  CONSTRAINT `absen_detail_absen_FK` FOREIGN KEY (`id_detail`) REFERENCES `detail_absen` (`id_detail`),
  CONSTRAINT `absen_ibfk_1` FOREIGN KEY (`id_akun`) REFERENCES `user` (`id_akun`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table queenfood.absen: ~1 rows (approximately)
INSERT IGNORE INTO `absen` (`id_absen`, `id_akun`, `tanggal_absen`, `absen_time`, `pulang_time`, `detail`, `id_detail`) VALUES
	(83, 1, '2024-10-17', '2024-10-17 11:27:26', '2024-10-17 11:46:26', 'Hadir', 84);

-- Dumping structure for table queenfood.detail_absen
CREATE TABLE IF NOT EXISTS `detail_absen` (
  `id_detail` int NOT NULL AUTO_INCREMENT,
  `id_akun` int DEFAULT NULL,
  `foto_diri` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `foto_etalase` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lokasi` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_izin` int DEFAULT NULL,
  PRIMARY KEY (`id_detail`),
  KEY `detail_absen_user_FK` (`id_akun`),
  KEY `detail_absen_izin_FK` (`id_izin`),
  CONSTRAINT `detail_absen_izin_FK` FOREIGN KEY (`id_izin`) REFERENCES `izin` (`id_izin`),
  CONSTRAINT `detail_absen_user_FK` FOREIGN KEY (`id_akun`) REFERENCES `user` (`id_akun`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table queenfood.detail_absen: ~1 rows (approximately)
INSERT IGNORE INTO `detail_absen` (`id_detail`, `id_akun`, `foto_diri`, `foto_etalase`, `lokasi`, `id_izin`) VALUES
	(84, 1, 'https://res.cloudinary.com/dezla8wit/image/upload/v1729164431/lillcvof1jfgzbqvaq3q.jpg', 'https://res.cloudinary.com/dezla8wit/image/upload/v1729164441/junluymxledr5y9lqyru.jpg', 'Jalan Parung Raya 5, Kecamatan Depok, Jawa Barat 16516', NULL);

-- Dumping structure for table queenfood.expo_push_tokens
CREATE TABLE IF NOT EXISTS `expo_push_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_akun` int NOT NULL,
  `expo_push_token` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_akun` (`id_akun`),
  CONSTRAINT `expo_push_tokens_ibfk_1` FOREIGN KEY (`id_akun`) REFERENCES `user` (`id_akun`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table queenfood.expo_push_tokens: ~2 rows (approximately)
INSERT IGNORE INTO `expo_push_tokens` (`id`, `id_akun`, `expo_push_token`, `created_at`, `updated_at`) VALUES
	(1, 1, 'ExponentPushToken[2ncBDZIMKU6EpWA3RsvtKS]', '2024-10-05 06:46:22', '2024-10-05 06:46:22'),
	(2, 2, 'ExponentPushToken[2ncBDZIMKU6EpWA3RsvtKS]', '2024-10-05 07:02:30', '2024-10-12 10:12:54');

-- Dumping structure for table queenfood.izin
CREATE TABLE IF NOT EXISTS `izin` (
  `id_izin` int NOT NULL AUTO_INCREMENT,
  `id_akun` int DEFAULT NULL,
  `tanggal_izin` date DEFAULT NULL,
  `alasan` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipe` enum('Izin','Sakit') COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('Pending','Rejected','Approved') COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id_izin`),
  KEY `izin_user_FK` (`id_akun`),
  CONSTRAINT `izin_user_FK` FOREIGN KEY (`id_akun`) REFERENCES `user` (`id_akun`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table queenfood.izin: ~0 rows (approximately)

-- Dumping structure for table queenfood.user
CREATE TABLE IF NOT EXISTS `user` (
  `id_akun` int NOT NULL AUTO_INCREMENT,
  `nama_karyawan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `level` enum('admin','user') COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id_akun`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table queenfood.user: ~4 rows (approximately)
INSERT IGNORE INTO `user` (`id_akun`, `nama_karyawan`, `username`, `password`, `level`) VALUES
	(1, 'daw', 'e', 'e', 'user'),
	(2, 'dwa', 'a', 'a', 'admin'),
	(3, 'Eg', 'Zff', 'Sdf', 'user'),
	(4, 'Ederen', 'E. D. E. R. E. N', 'EdErEn', 'user');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
