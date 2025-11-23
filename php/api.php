<?php
// php/api.php

header('Content-Type: application/json');
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/game.php';

// Simple router
$action = $_GET['action'] ?? '';
$response = ['success' => false, 'message' => 'Invalid action.'];

// The API receives POST data as JSON
$postData = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    // --- Auth Actions ---
    case 'register':
        if (isset($postData['name'], $postData['email'], $postData['password'])) {
            $success = registerUser($postData['name'], $postData['email'], $postData['password']);
            if ($success) {
                $response = ['success' => true, 'message' => 'Registration successful.'];
            } else {
                $response['message'] = 'Registration failed. Email may already be in use.';
            }
        } else {
            $response['message'] = 'Missing registration data.';
        }
        break;

    case 'login':
        if (isset($postData['email'], $postData['password'])) {
            if (loginUser($postData['email'], $postData['password'])) {
                $response = ['success' => true, 'message' => 'Login successful.', 'user_name' => $_SESSION['user_name']];
            } else {
                $response['message'] = 'Invalid email or password.';
            }
        } else {
            $response['message'] = 'Missing login data.';
        }
        break;

    case 'logout':
        logoutUser();
        $response = ['success' => true, 'message' => 'Logged out successfully.'];
        break;

    case 'status':
        if (isLoggedIn()) {
            $response = ['success' => true, 'loggedIn' => true, 'user_name' => $_SESSION['user_name']];
        } else {
            $response = ['success' => true, 'loggedIn' => false];
        }
        break;

    // --- Game Actions ---
    case 'save_game':
        if (isset($postData['save_name'], $postData['game_data'])) {
            $response = saveGameData($postData['save_name'], $postData['game_data']);
        } else {
            $response['message'] = 'Missing game data.';
        }
        break;

    case 'load_game':
        if (isset($_GET['save_name'])) {
            $response = loadGameData($_GET['save_name']);
        } else {
            $response['message'] = 'Missing save name.';
        }
        break;

    case 'list_saves':
        $response = listSavesForCurrentUser();
        break;

    case 'delete_save':
        if (isset($postData['save_name'])) {
            $response = deleteSaveData($postData['save_name']);
        } else {
            $response['message'] = 'Missing save name.';
        }
        break;
}

echo json_encode($response);
