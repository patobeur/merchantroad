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

    // SQL to create the saves table
    $sql = "
    CREATE TABLE IF NOT EXISTS saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        save_name VARCHAR(255) NOT NULL,
        save_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";

    // Execute the query
    $pdo->exec($sql);

    echo "Database and 'saves' table created successfully.";

} catch (PDOException $e) {
    die("ERROR: Could not connect. " . $e->getMessage());
}
?>
