<?php
// Include the database configuration
require_once 'config.php';

// Set the content type to JSON
header('Content-Type: application/json');

try {
    // Connect to the database
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Handle the request
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list_saves':
        try {
            $stmt = $pdo->query('SELECT id, save_name, save_data FROM saves ORDER BY created_at DESC');
            $saves = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($saves);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to list saves: ' . $e->getMessage()]);
        }
        break;

    case 'load_game':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing save ID']);
            break;
        }
        try {
            $stmt = $pdo->prepare('SELECT save_data FROM saves WHERE id = :id');
            $stmt->execute(['id' => $id]);
            $save = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($save) {
                // The data is stored as a JSON string, so just output it directly
                echo $save['save_data'];
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Save not found']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to load game: ' . $e->getMessage()]);
        }
        break;

    case 'save_game':
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'No data provided']);
            break;
        }
        $saveName = 'save_' . time(); // Simple name generation
        $saveData = json_encode($data);

        try {
            $stmt = $pdo->prepare('INSERT INTO saves (save_name, save_data) VALUES (:save_name, :save_data)');
            $stmt->execute(['save_name' => $saveName, 'save_data' => $saveData]);
            $lastInsertId = $pdo->lastInsertId();
            echo json_encode(['message' => 'Game saved successfully', 'id' => $lastInsertId, 'name' => $saveName]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save game: ' . $e->getMessage()]);
        }
        break;

    case 'delete_save':
        $id = $_POST['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing save ID']);
            break;
        }
        try {
            $stmt = $pdo->prepare('DELETE FROM saves WHERE id = :id');
            $stmt->execute(['id' => $id]);
            if ($stmt->rowCount()) {
                echo json_encode(['message' => 'Save deleted successfully']);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Save not found']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete save: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>
