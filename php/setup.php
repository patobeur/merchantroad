<?php
// Include the database configuration
require_once 'config.php';

try {
    // Connect to MySQL server
    $pdo = new PDO('mysql:host=' . DB_HOST, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create the database if it doesn't exist
    $pdo->exec('CREATE DATABASE IF NOT EXISTS ' . DB_NAME);
    $pdo->exec('USE ' . DB_NAME);

    // Drop existing tables to start fresh
    $pdo->exec("DROP TABLE IF EXISTS mr_stocks, mr_cargaisons, mr_saves, mr_villes, mr_ressources;");

    // SQL to create the new tables
    $sql = "
    CREATE TABLE mr_villes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE
    );

    CREATE TABLE mr_ressources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL UNIQUE
    );

    CREATE TABLE mr_saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255) NOT NULL,
        gold INT UNSIGNED NOT NULL,
        niveau INT UNSIGNED NOT NULL,
        xp INT UNSIGNED NOT NULL,
        villeActuelle_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (villeActuelle_id) REFERENCES mr_villes(id)
    );

    CREATE TABLE mr_cargaisons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        save_id INT NOT NULL,
        ressource_id INT NOT NULL,
        quantite INT NOT NULL,
        FOREIGN KEY (save_id) REFERENCES mr_saves(id) ON DELETE CASCADE,
        FOREIGN KEY (ressource_id) REFERENCES mr_ressources(id)
    );

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
    );
    ";

    $pdo->exec($sql);
    echo "Tables created successfully.<br>";

    // --- Populate static data ---
    $ressources = [
        "Cacao", "Coton", "Pierres précieuses", "Raisins", "Poudre à canon",
        "Métal", "Rations", "Pimenter", "Canne à sucre", "Tabac vieilli",
    ];

    $villes = ["Ville_A", "Ville_B", "Ville_C", "Ville_D"];

    $stmt = $pdo->prepare("INSERT INTO mr_ressources (nom) VALUES (:nom)");
    foreach ($ressources as $nom) {
        $stmt->execute(['nom' => $nom]);
    }
    echo "Populated `mr_ressources` table.<br>";

    $stmt = $pdo->prepare("INSERT INTO mr_villes (nom) VALUES (:nom)");
    foreach ($villes as $nom) {
        $stmt->execute(['nom' => $nom]);
    }
    echo "Populated `mr_villes` table.<br>";

    echo "Database setup complete.";

} catch (PDOException $e) {
    die("ERROR: Could not setup database. " . $e->getMessage());
}
?>
