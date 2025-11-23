<?php
require_once 'config.php';
header('Content-Type: application/json');

// --- Database Connection ---
try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// --- Helper Functions ---
function getVilleId($pdo, $nom) {
    $stmt = $pdo->prepare("SELECT id FROM mr_villes WHERE nom = :nom");
    $stmt->execute(['nom' => $nom]);
    return $stmt->fetchColumn();
}

function getRessourceId($pdo, $nom) {
    $stmt = $pdo->prepare("SELECT id FROM mr_ressources WHERE nom = :nom");
    $stmt->execute(['nom' => $nom]);
    return $stmt->fetchColumn();
}

// --- API Actions ---
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list_saves':
        $stmt = $pdo->query("SELECT s.id, s.nom, s.gold, s.niveau, s.xp, v.nom AS villeActuelle FROM mr_saves s JOIN mr_villes v ON s.villeActuelle_id = v.id ORDER BY s.updated_at DESC");
        $saves = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($saves);
        break;

    case 'load_game':
        $id = intval($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid save ID']);
            break;
        }

        // Fetch main save data
        $stmt = $pdo->prepare("SELECT s.id, s.nom, s.gold, s.niveau, s.xp, v.nom AS villeActuelle FROM mr_saves s JOIN mr_villes v ON s.villeActuelle_id = v.id WHERE s.id = :id");
        $stmt->execute(['id' => $id]);
        $saveData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$saveData) {
            http_response_code(404);
            echo json_encode(['error' => 'Save not found']);
            break;
        }

        // Fetch stocks for this save
        $stmt = $pdo->prepare("SELECT v.nom AS ville, r.nom AS ressource, s.quantite, s.prix FROM mr_stocks s JOIN mr_villes v ON s.ville_id = v.id JOIN mr_ressources r ON s.ressource_id = r.id WHERE s.save_id = :id");
        $stmt->execute(['id' => $id]);
        $stocks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch cargo for this save
        $stmt = $pdo->prepare("SELECT r.nom AS ressource, c.quantite FROM mr_cargaisons c JOIN mr_ressources r ON c.ressource_id = r.id WHERE c.save_id = :id");
        $stmt->execute(['id' => $id]);
        $cargo = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Reconstruct the gameState object
        $gameState = [
            'save_id' => $saveData['id'],
            'joueur' => [
                'nom' => $saveData['nom'],
                'or' => intval($saveData['gold']),
                'niveau' => intval($saveData['niveau']),
                'xp' => intval($saveData['xp']),
                'villeActuelle' => $saveData['villeActuelle'],
                'cargaison' => array_reduce($cargo, function ($acc, $item) {
                    $acc[$item['ressource']] = intval($item['quantite']);
                    return $acc;
                }, [])
            ],
            'villes' => [], // Will be populated from stocks
            'voyage' => null // Voyage is transient, not saved in DB
        ];

        foreach ($stocks as $stock) {
            $gameState['villes'][$stock['ville']]['stocks'][$stock['ressource']] = [
                'quantite' => intval($stock['quantite']),
                'prix' => intval($stock['prix']),
            ];
        }

        echo json_encode($gameState);
        break;

    case 'save_game':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['joueur'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data provided']);
            break;
        }

        $save_id = $data['save_id'] ?? null;
        $joueur = $data['joueur'];
        $villes = $data['villes'];

        $villeActuelleId = getVilleId($pdo, $joueur['villeActuelle']);

        $pdo->beginTransaction();
        try {
            if ($save_id) { // Update existing save
                $stmt = $pdo->prepare("UPDATE mr_saves SET nom = :nom, gold = :gold, niveau = :niveau, xp = :xp, villeActuelle_id = :ville_id WHERE id = :id");
                $stmt->execute([
                    'id' => $save_id,
                    'nom' => $joueur['nom'],
                    'gold' => $joueur['or'],
                    'niveau' => $joueur['niveau'],
                    'xp' => $joueur['xp'],
                    'ville_id' => $villeActuelleId
                ]);
            } else { // Create new save
                $stmt = $pdo->prepare("INSERT INTO mr_saves (nom, gold, niveau, xp, villeActuelle_id) VALUES (:nom, :gold, :niveau, :xp, :ville_id)");
                $stmt->execute([
                    'nom' => $joueur['nom'],
                    'gold' => $joueur['or'],
                    'niveau' => $joueur['niveau'],
                    'xp' => $joueur['xp'],
                    'ville_id' => $villeActuelleId
                ]);
                $save_id = $pdo->lastInsertId();
            }

            // Clear and re-insert stocks and cargo for simplicity (could be optimized)
            $pdo->prepare("DELETE FROM mr_stocks WHERE save_id = :id")->execute(['id' => $save_id]);
            $pdo->prepare("DELETE FROM mr_cargaisons WHERE save_id = :id")->execute(['id' => $save_id]);

            // Insert stocks
            $stmtStock = $pdo->prepare("INSERT INTO mr_stocks (save_id, ville_id, ressource_id, quantite, prix) VALUES (:sid, :vid, :rid, :q, :p)");
            foreach ($villes as $villeNom => $villeData) {
                $villeId = getVilleId($pdo, $villeNom);
                foreach ($villeData['stocks'] as $resNom => $resData) {
                    $resId = getRessourceId($pdo, $resNom);
                    $stmtStock->execute([
                        'sid' => $save_id,
                        'vid' => $villeId,
                        'rid' => $resId,
                        'q' => $resData['quantite'],
                        'p' => $resData['prix']
                    ]);
                }
            }

            // Insert cargo
            $stmtCargo = $pdo->prepare("INSERT INTO mr_cargaisons (save_id, ressource_id, quantite) VALUES (:sid, :rid, :q)");
            foreach ($joueur['cargaison'] as $resNom => $quantite) {
                if ($quantite > 0) {
                    $resId = getRessourceId($pdo, $resNom);
                    $stmtCargo->execute(['sid' => $save_id, 'rid' => $resId, 'q' => $quantite]);
                }
            }

            $pdo->commit();
            echo json_encode(['message' => 'Game saved successfully', 'save_id' => $save_id]);

        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save game: ' . $e->getMessage()]);
        }
        break;

    case 'delete_save':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid save ID']);
            break;
        }

        $stmt = $pdo->prepare("DELETE FROM mr_saves WHERE id = :id");
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount()) {
            echo json_encode(['message' => 'Save deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Save not found']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action specified']);
        break;
}
?>
