<?php
// php/game.php

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth.php';

function saveGameData($saveName, $gameData) {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    // Check if a save with the same name already exists for this user
    $stmt = $pdo->prepare("SELECT id FROM mr_saves WHERE user_id = ? AND save_name = ?");
    $stmt->execute([$userId, $saveName]);
    $existingSave = $stmt->fetch();

    if ($existingSave) {
        // Update existing save
        $stmt = $pdo->prepare("UPDATE mr_saves SET game_data = ? WHERE id = ?");
        $success = $stmt->execute([json_encode($gameData), $existingSave['id']]);
    } else {
        // Insert new save
        $stmt = $pdo->prepare("INSERT INTO mr_saves (user_id, save_name, game_data) VALUES (?, ?, ?)");
        $success = $stmt->execute([$userId, $saveName, json_encode($gameData)]);
    }

    return ['success' => $success];
}

function loadGameData($saveName) {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("SELECT game_data FROM mr_saves WHERE user_id = ? AND save_name = ?");
    $stmt->execute([$userId, $saveName]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        return ['success' => true, 'data' => json_decode($result['game_data'], true)];
    }

    return ['success' => false, 'message' => 'Save not found.'];
}

function listSavesForCurrentUser() {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("SELECT save_name, updated_at FROM mr_saves WHERE user_id = ? ORDER BY updated_at DESC");
    $stmt->execute([$userId]);
    $saves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return ['success' => true, 'data' => $saves];
}

function deleteSaveData($saveName) {
    if (!isLoggedIn()) {
        return ['success' => false, 'message' => 'User not logged in.'];
    }

    $userId = getCurrentUserId();
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("DELETE FROM mr_saves WHERE user_id = ? AND save_name = ?");
    $success = $stmt->execute([$userId, $saveName]);

    return ['success' => $success];
}
