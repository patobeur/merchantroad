<?php
// php/setup.php

// --- Database Setup for Space Dealer ---
//
// Instructions:
// 1. Ensure you have a `config.php` file with your database credentials.
// 2. Run this script from your browser or the command line: `php setup.php`
//
// This script will create a normalized database schema for the game.

if (!file_exists(__DIR__ . '/config.php')) {
    die("Please create a config.php file. You can copy it from config.php.example and fill in your database credentials.");
}
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
    $pdo->exec("USE " . DB_NAME);
    echo "Database '" . DB_NAME . "' is ready.<br>";

    // Drop existing tables to start fresh
    $pdo->exec("DROP TABLE IF EXISTS mr_cargaisons, mr_stocks, mr_saves, mr_users, mr_villes, mr_ressources;");
    echo "Dropped old tables if they existed.<br>";

    // --- Users Table ---
    $sqlUsers = "
    CREATE TABLE mr_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlUsers);
    echo "Table 'mr_users' created.<br>";

    // --- Villes Table ---
    $sqlVilles = "
    CREATE TABLE mr_villes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlVilles);
    echo "Table 'mr_villes' created.<br>";

    // --- Ressources Table ---
    $sqlRessources = "
    CREATE TABLE mr_ressources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlRessources);
    echo "Table 'mr_ressources' created.<br>";

    // --- Saves Table ---
    $sqlSaves = "
    CREATE TABLE mr_saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        save_name VARCHAR(255) NOT NULL,
        gold INT UNSIGNED NOT NULL,
        niveau INT UNSIGNED NOT NULL,
        xp INT UNSIGNED NOT NULL,
        villeActuelle_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES mr_users(id) ON DELETE CASCADE,
        FOREIGN KEY (villeActuelle_id) REFERENCES mr_villes(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlSaves);
    echo "Table 'mr_saves' created.<br>";

    // --- Cargaisons (Cargo) Table ---
    $sqlCargaisons = "
    CREATE TABLE mr_cargaisons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        save_id INT NOT NULL,
        ressource_id INT NOT NULL,
        quantite INT NOT NULL,
        FOREIGN KEY (save_id) REFERENCES mr_saves(id) ON DELETE CASCADE,
        FOREIGN KEY (ressource_id) REFERENCES mr_ressources(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlCargaisons);
    echo "Table 'mr_cargaisons' created.<br>";

    // --- Stocks Table (City Inventories) ---
    $sqlStocks = "
    CREATE TABLE mr_stocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        save_id INT NOT NULL,
        ville_id INT NOT NULL,
        ressource_id INT NOT NULL,
        quantite INT NOT NULL,
        prix INT NOT NULL,
        FOREIGN KEY (save_id) REFERENCES mr_saves(id) ON DELETE CASCADE,
        FOREIGN KEY (ville_id) REFERENCES mr_villes(id),
        FOREIGN KEY (ressource_id) REFERENCES mr_ressources(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sqlStocks);
    echo "Table 'mr_stocks' created.<br>";

    // --- Seed Data ---
    $villes = ["Ville_A", "Ville_B", "Ville_C", "Ville_D"];
    $ressources = [
        "Cacao", "Coton", "Pierres précieuses", "Raisins", "Poudre à canon",
        "Métal", "Rations", "Pimenter", "Canne à sucre", "Tabac vieilli",
    ];

    $stmtVille = $pdo->prepare("INSERT INTO mr_villes (nom) VALUES (?)");
    foreach ($villes as $ville) {
        $stmtVille->execute([$ville]);
    }
    echo "Seeded 'mr_villes' table.<br>";

    $stmtRessource = $pdo->prepare("INSERT INTO mr_ressources (nom) VALUES (?)");
    foreach ($ressources as $ressource) {
        $stmtRessource->execute([$ressource]);
    }
    echo "Seeded 'mr_ressources' table.<br>";

    echo "<br><h2>Database setup is complete!</h2>";

} catch (PDOException $e) {
    die("Database setup failed: " . $e->getMessage());
}
