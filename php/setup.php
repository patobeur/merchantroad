<?php
// php/setup.php

// --- Database Setup for Space Dealer ---
//
// Instructions:
// 1. Copy `config.php.example` to `config.php`.
// 2. Fill in your MySQL database credentials in `config.php`.
// 3. Run this script from your browser or the command line: `php setup.php`
//
// This script will create the necessary tables for the game.

if (!file_exists(__DIR__ . '/config.php')) {
    die("Please create a config.php file. You can copy it from config.php.example and fill in your database credentials.");
}
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
    $pdo->exec("USE " . DB_NAME);

    echo "Database " . DB_NAME . " created or already exists.<br>";

    // --- Users Table ---
    $sqlUsers = "
    CREATE TABLE IF NOT EXISTS mr_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlUsers);
    echo "Table 'mr_users' created or already exists.<br>";


    // --- Saves Table ---
    $sqlSaves = "
    CREATE TABLE IF NOT EXISTS mr_saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        save_name VARCHAR(255) NOT NULL,
        game_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES mr_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlSaves);
    echo "Table 'mr_saves' created or already exists.<br>";


    echo "<br>Setup complete!";

} catch (PDOException $e) {
    die("Database setup failed: " . $e->getMessage());
}
