CREATE DATABASE IF NOT EXISTS boardgame_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE boardgame_db;
CREATE TABLE IF NOT EXISTS publishers (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, country VARCHAR(80) NOT NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS categories (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, description VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS boardgames (
 id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, min_players INT NOT NULL, max_players INT NOT NULL,
 playing_time_minutes INT NOT NULL, publisher_id INT NOT NULL, category_id INT NOT NULL,
 CONSTRAINT uq_game_name_publisher UNIQUE(name,publisher_id),
 CONSTRAINT chk_player_counts CHECK(min_players >= 1 AND max_players >= min_players),
 CONSTRAINT chk_playing_time CHECK(playing_time_minutes > 0),
 CONSTRAINT fk_game_publisher FOREIGN KEY(publisher_id) REFERENCES publishers(id) ON DELETE RESTRICT,
 CONSTRAINT fk_game_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
