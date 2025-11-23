<?php
// php/database.php

require_once __DIR__ . '/config.php';

function getDbConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        // In a real application, you would log this error and show a generic message.
        die("Database connection failed: " . $e->getMessage());
    }
}
