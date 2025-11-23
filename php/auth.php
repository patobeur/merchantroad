<?php
// php/auth.php

require_once __DIR__ . '/database.php';

session_start();

function registerUser($name, $email, $password) {
    $pdo = getDbConnection();
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO mr_users (name, email, password) VALUES (?, ?, ?)");
    return $stmt->execute([$name, $email, $hashedPassword]);
}

function loginUser($email, $password) {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT * FROM mr_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        return true;
    }
    return false;
}

function logoutUser() {
    session_unset();
    session_destroy();
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}
